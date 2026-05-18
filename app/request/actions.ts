"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findAvailableKey, getActiveRequest, getRequest } from "./_lib/data";

function parseId(formData: FormData): number {
  const v = Number(formData.get("id"));
  if (!Number.isInteger(v) || v <= 0) redirect("/");
  return v;
}

export async function createSelfRequest(_formData: FormData) {
  const tenant = await requireTenant();
  const existing = await getActiveRequest(tenant.id);
  if (existing) redirect("/");

  const request = await prisma.keyRequest.create({
    data: {
      requesterId: tenant.id,
      apartmentId: tenant.apartmentId,
      type: "SELF",
      status: "AWAITING_PAYMENT",
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

  await prisma.keyRequest.update({
    where: { id: requestId },
    data: { status: "PAID", paidAt: new Date(), keyId: key.id },
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
  const dueAt = new Date(pickedAt.getTime() + 6 * 60 * 60 * 1000);

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
