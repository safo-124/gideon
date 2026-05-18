"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";

export type AdminLoginState = { error?: string };

export async function loginAdmin(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Username and password are required" };

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) return { error: "Invalid username or password" };

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return { error: "Invalid username or password" };

  await createSession({ role: "admin", id: admin.id });
  redirect("/admin");
}

export async function logoutAdmin() {
  await destroySession();
  redirect("/admin/login");
}
