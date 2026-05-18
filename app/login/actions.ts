"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";

export type LoginState = { error?: string };

export async function loginTenant(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required" };

  const tenant = await prisma.tenant.findUnique({ where: { email } });
  if (!tenant) return { error: "Invalid email or password" };

  const ok = await bcrypt.compare(password, tenant.passwordHash);
  if (!ok) return { error: "Invalid email or password" };

  await createSession({ role: "tenant", id: tenant.id });
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
