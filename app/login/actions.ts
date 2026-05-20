"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/session";
import { authenticateTenantLogin, type LoginState } from "./authenticate";

export async function loginTenant(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const result = await authenticateTenantLogin(formData);
  if (result.unlocked) redirect("/");

  return result;
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
