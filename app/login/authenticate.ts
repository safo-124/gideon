import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export type LoginState = { error?: string; unlocked?: boolean };

export async function authenticateTenantLogin(formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required" };

  const tenant = await prisma.tenant.findUnique({ where: { email } });
  if (!tenant) return { error: "Invalid email or password" };

  if (!tenant.passwordHash) {
    return { error: "Your account isn't activated yet. Check your email for the invite link." };
  }

  const ok = await bcrypt.compare(password, tenant.passwordHash);
  if (!ok) return { error: "Invalid email or password" };

  await createSession({ role: "tenant", id: tenant.id });
  return { unlocked: true };
}
