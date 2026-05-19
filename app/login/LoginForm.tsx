"use client";

import { useActionState } from "react";
import { loginTenant, type LoginState } from "./actions";

const initial: LoginState = {};

const inputClass =
  "h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginTenant, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className={inputClass}
          id="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium" htmlFor="password">
          Password
        </label>
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
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300" role="alert">
          {state.error}
        </div>
      )}
      <button
        className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
