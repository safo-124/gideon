import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata = { title: "Admin sign in — Key Recovery" };

export default async function AdminLoginPage() {
  const session = await readSession();
  if (session?.role === "admin") redirect("/admin");
  if (session?.role === "tenant") redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <div className="mt-4 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            Admin
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-zinc-500">Restricted to authorised staff only</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <AdminLoginForm />
        </div>

        <p className="mt-5 text-center text-sm text-zinc-500">
          Tenant?{" "}
          <Link className="font-medium text-zinc-700 hover:underline dark:text-zinc-300" href="/login">
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}
