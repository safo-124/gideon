"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function tokenAndCode(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (!token) redirect("/");
  if (code.length !== 6) redirect(`/resident-approval/${token}?error=Enter+the+6-digit+code.`);
  return { code, token };
}

async function pendingApproval(token: string) {
  const request = await prisma.keyRequest.findUnique({ where: { approvalToken: token } });
  if (!request) redirect("/");
  if (request.status !== "PENDING_AUTH") redirect(`/resident-approval/${token}`);

  const now = new Date();
  if (request.approvalExpiresAt && now > request.approvalExpiresAt) {
    await prisma.keyRequest.update({
      where: { id: request.id },
      data: { cancelledAt: now, status: "CANCELLED" },
    });
    revalidatePath("/");
    redirect(`/resident-approval/${token}?expired=1`);
  }

  if (!request.approvalCodeHash) redirect(`/resident-approval/${token}?error=This+approval+code+is+not+available.`);
  return request;
}

async function verifyApprovalCode(token: string, code: string, hash: string, requestId: number, attempts: number) {
  const ok = await bcrypt.compare(code, hash);
  if (ok) return;

  const nextAttempts = attempts + 1;
  await prisma.keyRequest.update({
    where: { id: requestId },
    data:
      nextAttempts >= 5
        ? { approvalCodeAttempts: nextAttempts, cancelledAt: new Date(), status: "CANCELLED" }
        : { approvalCodeAttempts: nextAttempts },
  });

  revalidatePath("/");
  redirect(
    nextAttempts >= 5
      ? `/resident-approval/${token}?expired=1`
      : `/resident-approval/${token}?error=That+code+did+not+match.`,
  );
}

export async function approveResidentAccess(formData: FormData) {
  const { code, token } = tokenAndCode(formData);
  const request = await pendingApproval(token);

  await verifyApprovalCode(token, code, request.approvalCodeHash!, request.id, request.approvalCodeAttempts);

  await prisma.keyRequest.update({
    where: { id: request.id },
    data: {
      approvalCodeAttempts: 0,
      approvalRespondedAt: new Date(),
      status: "AWAITING_PAYMENT",
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/requests");
  redirect(`/resident-approval/${token}?approved=1`);
}

export async function denyResidentAccess(formData: FormData) {
  const { code, token } = tokenAndCode(formData);
  const request = await pendingApproval(token);

  await verifyApprovalCode(token, code, request.approvalCodeHash!, request.id, request.approvalCodeAttempts);

  await prisma.keyRequest.update({
    where: { id: request.id },
    data: {
      approvalCodeAttempts: 0,
      approvalDeniedAt: new Date(),
      approvalRespondedAt: new Date(),
      status: "DISPUTED",
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/requests");
  redirect(`/resident-approval/${token}?denied=1`);
}
