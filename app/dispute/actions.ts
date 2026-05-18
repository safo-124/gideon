"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function disputeKeyRequest(formData: FormData) {
  const token = formData.get("token");
  if (typeof token !== "string" || !token) redirect("/");

  const request = await prisma.keyRequest.findUnique({ where: { disputeToken: token } });
  if (!request) redirect("/");

  if (request.status !== "PAID") {
    redirect(`/dispute/${token}`);
  }

  const now = new Date();
  if (request.disputeWindowEndsAt && now > request.disputeWindowEndsAt) {
    redirect(`/dispute/${token}?expired=1`);
  }

  await prisma.keyRequest.update({
    where: { id: request.id },
    data: { status: "DISPUTED" },
  });

  redirect(`/dispute/${token}?disputed=1`);
}
