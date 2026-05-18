"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findAvailableKey, getActiveRequest, getRequest } from "./_lib/data";
import { getSettings } from "@/lib/settings";

function parseId(formData: FormData): number {
  const v = Number(formData.get("id"));
  if (!Number.isInteger(v) || v <= 0) redirect("/");
  return v;
}

export async function createSelfRequest(_formData: FormData) {
  const tenant = await requireTenant();
  const existing = await getActiveRequest(tenant.id);
  if (existing) redirect("/");

  const { base_fee_cents } = await getSettings();

  const request = await prisma.keyRequest.create({
    data: {
      requesterId: tenant.id,
      apartmentId: tenant.apartmentId,
      type: "SELF",
      status: "AWAITING_PAYMENT",
      amountCents: base_fee_cents,
    },
  });

  redirect(`/request/${request.id}/pay`);
}

export async function createForOtherRequest(formData: FormData) {
  const tenant = await requireTenant();
  const existing = await getActiveRequest(tenant.id);
  if (existing) redirect("/");

  const apartmentId = Number(formData.get("apartmentId"));
  if (!Number.isInteger(apartmentId) || apartmentId <= 0) redirect("/request/for-someone");

  if (apartmentId === tenant.apartmentId) {
    redirect("/request/for-someone?error=Use+the+spare+key+request+for+your+own+apartment.");
  }

  const apartment = await prisma.apartment.findUnique({ where: { id: apartmentId } });
  if (!apartment) redirect("/request/for-someone?error=Apartment+not+found.");

  const { base_fee_cents } = await getSettings();

  const request = await prisma.keyRequest.create({
    data: {
      requesterId: tenant.id,
      apartmentId,
      type: "FOR_OTHER",
      status: "AWAITING_PAYMENT",
      amountCents: base_fee_cents,
    },
  });

  redirect(`/request/${request.id}/pay`);
}

export async function payRequest(formData: FormData) {
  const tenant = await requireTenant();
  const requestId = parseId(formData);

  const request = await getRequest(requestId, tenant.id);
  if (!request || request.status !== "AWAITING_PAYMENT") redirect("/");

  const key = await findAvailableKey(request.apartmentId);
  if (!key) {
    await prisma.keyRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    redirect("/?error=No+spare+key+is+currently+available.+Try+again+later.");
  }

  const paidAt = new Date();

  await prisma.keyRequest.update({
    where: { id: requestId },
    data: {
      status: "PAID",
      paidAt,
      keyId: key.id,
      ...(request.type === "FOR_OTHER" && {
        disputeToken: randomBytes(24).toString("hex"),
        disputeWindowEndsAt: await getSettings().then(
          (s) => new Date(paidAt.getTime() + s.dispute_window_minutes * 60 * 1000),
        ),
      }),
    },
  });

  revalidatePath("/");
  redirect("/");
}

export async function markPickedUp(formData: FormData) {
  const tenant = await requireTenant();
  const requestId = parseId(formData);

  const request = await getRequest(requestId, tenant.id);
  if (!request || request.status !== "PAID") redirect("/");

  const pickedAt = new Date();
  const { hold_hours } = await getSettings();
  const dueAt = new Date(pickedAt.getTime() + hold_hours * 60 * 60 * 1000);

  await prisma.keyRequest.update({
    where: { id: requestId },
    data: { status: "PICKED_UP", pickedAt, dueAt },
  });

  revalidatePath("/");
  redirect("/");
}

export async function returnKey(formData: FormData) {
  const tenant = await requireTenant();
  const requestId = parseId(formData);

  const request = await getRequest(requestId, tenant.id);
  if (!request || request.status !== "PICKED_UP") redirect("/");

  await prisma.keyRequest.update({
    where: { id: requestId },
    data: { status: "RETURNED", returnedAt: new Date() },
  });

  revalidatePath("/");
  redirect("/");
}

export async function cancelRequest(formData: FormData) {
  const tenant = await requireTenant();
  const requestId = parseId(formData);

  const request = await getRequest(requestId, tenant.id);
  if (!request || request.status !== "AWAITING_PAYMENT") redirect("/");

  await prisma.keyRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  revalidatePath("/");
  redirect("/");
}
