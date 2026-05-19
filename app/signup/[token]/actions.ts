"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export type ActivateState = { error?: string };

export async function activateAccount(
  _prev: ActivateState,
  formData: FormData,
): Promise<ActivateState> {
  const token = String(formData.get("token") ?? "");
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const tenant = await prisma.tenant.findUnique({ where: { inviteToken: token } });

  if (!tenant) return { error: "This invite link is invalid." };
  if (tenant.passwordHash) return { error: "This account is already activated. Sign in instead." };
  if (!tenant.inviteExpiresAt || tenant.inviteExpiresAt < new Date()) {
    return { error: "This invite link has expired. Ask your building manager for a new one." };
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      phone: phone ?? tenant.phone,
      inviteToken: null,
      inviteExpiresAt: null,
    },
  });

  await createSession({ role: "tenant", id: tenant.id });
  redirect("/");
}
