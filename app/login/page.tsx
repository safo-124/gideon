import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in — Key Recovery" };

export default async function LoginPage() {
  const session = await readSession();
  if (session?.role === "tenant") redirect("/");
  if (session?.role === "admin") redirect("/admin");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-sm">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Key Recovery</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your tenant account</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <LoginForm />
        </div>

        <p className="mt-5 text-center text-sm text-zinc-500">
          No account? Check your email for an invite from your building manager.
        </p>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Admin?{" "}
          <a className="hover:underline" href="/admin/login">
            Sign in here
          </a>
        </p>
      </div>
    </main>
  );
}
