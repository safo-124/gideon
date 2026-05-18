import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in — Key Recovery" };

export default async function LoginPage() {
  const session = await readSession();
  if (session?.role === "tenant") redirect("/");
  if (session?.role === "admin") redirect("/admin");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tenant sign in</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Use your registered email and password.
          </p>
        </div>
        <LoginForm />
        <p className="text-xs text-zinc-500">
          Admin?{" "}
          <a href="/admin/login" className="underline">
            Sign in here
          </a>
          .
        </p>
      </div>
    </main>
  );
}
