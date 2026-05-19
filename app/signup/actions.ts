"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export type SignupState = { error?: string };

export async function registerTenant(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const apartmentId = Number(formData.get("apartmentId"));

  if (!fullName) return { error: "Full name is required." };
  if (!email || !email.includes("@")) return { error: "A valid email is required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };
  if (!apartmentId || !Number.isInteger(apartmentId)) return { error: "Please select your apartment." };

  try {
    const tenant = await prisma.tenant.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash: await bcrypt.hash(password, 10),
        apartmentId,
      },
    });
    await createSession({ role: "tenant", id: tenant.id });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e) {
      if ((e as { code: string }).code === "P2002") {
        return { error: "An account with that email already exists." };
      }
    }
    console.error(e);
    return { error: "Could not create account. Please try again." };
  }

  redirect("/");
}
