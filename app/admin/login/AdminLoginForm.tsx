"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminLoginState } from "./actions";

const initial: AdminLoginState = {};

const inputClass =
  "h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/15 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-zinc-500";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="username">Username</label>
        <input
          autoComplete="username"
          className={inputClass}
          id="username"
          name="username"
          required
          type="text"
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="password">Password</label>
        <input
          autoComplete="current-password"
          className={inputClass}
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {state.error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300"
          role="alert"
        >
          {state.error}
        </div>
      )}

      <button
        className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-xl bg-zinc-900 px-5 text-base font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
