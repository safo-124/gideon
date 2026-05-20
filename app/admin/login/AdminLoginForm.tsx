"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminLoginState } from "./actions";

const initial: AdminLoginState = {};

const inputClass =
  "auth-input h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initial);

  return (
    <form action={action} className="auth-form space-y-4">
      <div className="auth-field">
        <label className={labelClass} htmlFor="username">Username</label>
        <input
          autoComplete="username"
          className={inputClass}
          id="username"
          name="username"
          placeholder="admin"
          required
          type="text"
        />
      </div>
      <div className="auth-field">
        <label className={labelClass} htmlFor="password">Password</label>
        <input
          autoComplete="current-password"
          className={inputClass}
          id="password"
          name="password"
          placeholder="Enter password"
          required
          type="password"
        />
      </div>

      {state.error && (
        <div
          className="auth-error rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300"
          role="alert"
        >
          {state.error}
        </div>
      )}

      <button
        className="auth-submit mt-1 inline-flex h-11 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
