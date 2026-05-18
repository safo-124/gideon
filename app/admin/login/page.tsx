import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata = { title: "Admin sign in — Key Recovery" };

export default async function AdminLoginPage() {
  const session = await readSession();
  if (session?.role === "admin") redirect("/admin");
  if (session?.role === "tenant") redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Restricted to authorized staff.
          </p>
        </div>
        <AdminLoginForm />
        <p className="text-xs text-zinc-500">
          Tenant?{" "}
          <a href="/login" className="underline">
            Sign in here
          </a>
          .
        </p>
      </div>
    </main>
  );
}
