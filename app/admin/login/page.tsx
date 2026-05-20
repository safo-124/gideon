import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyDoorAnimation } from "@/app/components/key-door-animation";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { readSession } from "@/lib/session";
import { AdminLoginForm } from "./AdminLoginForm";

export const metadata = { title: "Admin sign in — Key Recovery" };

export default async function AdminLoginPage() {
  const session = await readSession();
  if (session?.role === "admin") redirect("/admin");
  if (session?.role === "tenant") redirect("/");

  return (
    <main className="auth-shell flex flex-1 flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="auth-topbar flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="auth-mark flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
            <ShieldIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Key Recovery</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Staff console</div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <section className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="auth-card-wrap w-full max-w-[420px]">
          <div className="auth-card overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="auth-card-header border-b border-zinc-200 bg-zinc-50 px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900/60 sm:px-6">
              <div className="flex items-center gap-4">
                <KeyDoorAnimation className="auth-card-mark" tone="zinc" />
                <div>
                  <div className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                    Admin
                  </div>
                  <h1 className="mt-2 text-xl font-semibold tracking-tight">Sign in</h1>
                </div>
              </div>
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Restricted to authorised staff only</p>
            </div>

            <div className="p-5 sm:p-6">
              <AdminLoginForm />
            </div>
          </div>

          <p className="auth-footer mt-5 text-center text-sm text-zinc-500">
            Tenant?{" "}
            <Link className="font-medium text-zinc-800 hover:underline dark:text-zinc-200" href="/login">
              Sign in here
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function ShieldIcon({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path
        d="M9 12.75 11.25 15 15 9.75m-3-7.04A11.96 11.96 0 0 1 3.6 6 12 12 0 0 0 3 9.75c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.31-.21-2.57-.6-3.75h-.15c-3.2 0-6.1-1.25-8.25-3.29Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
