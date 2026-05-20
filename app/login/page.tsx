import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyDoorAnimation } from "@/app/components/key-door-animation";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { readSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in — Key Recovery" };

export default async function LoginPage() {
  const session = await readSession();
  if (session?.role === "tenant") redirect("/");
  if (session?.role === "admin") redirect("/admin");

  return (
    <main className="auth-shell flex flex-1 flex-col bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="auth-topbar flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="auth-mark flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm dark:bg-teal-500 dark:text-white">
            <KeyIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Key Recovery</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Tenant portal</div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <section className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="auth-card-wrap w-full max-w-[420px]">
          <div className="auth-card overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="auth-card-header border-b border-zinc-200 bg-zinc-50 px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900/60 sm:px-6">
              <div className="flex items-center gap-4">
                <KeyDoorAnimation className="auth-card-mark" tone="teal" />
                <div>
                  <div className="inline-flex items-center rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-semibold uppercase text-teal-700 dark:border-teal-900/60 dark:bg-teal-950/40 dark:text-teal-300">
                    Tenant
                  </div>
                  <h1 className="mt-2 text-xl font-semibold tracking-tight">Sign in</h1>
                </div>
              </div>
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Access your account to request and return spare keys.</p>
            </div>

            <div className="p-5 sm:p-6">
              <LoginForm />
            </div>
          </div>

          <p className="auth-footer mt-5 text-center text-sm text-zinc-500">
            No account? Check your email for an invite from your building manager.
          </p>
          <p className="auth-footer mt-2 text-center text-sm text-zinc-500">
            Admin?{" "}
            <Link className="font-medium text-zinc-800 hover:underline dark:text-zinc-200" href="/admin/login">
              Sign in here
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function KeyIcon({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path
        d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.03 5.91c-.56-.1-1.16.03-1.56.43l-2.66 2.66H8.25v2.25H6v2.25H2.25v-2.82c0-.6.24-1.17.66-1.59l6.5-6.5c.4-.4.53-1 .43-1.56A6 6 0 0 1 21.75 8.25Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
