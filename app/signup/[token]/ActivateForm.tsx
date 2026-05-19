"use client";

import { useActionState } from "react";
import { activateAccount, type ActivateState } from "./actions";

const initial: ActivateState = {};

const inputClass =
  "h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400";

export function ActivateForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(activateAccount, initial);

  return (
    <form action={action} className="space-y-4">
      <input name="token" type="hidden" value={token} />

      <div>
        <label className={labelClass} htmlFor="phone">
          Mobile <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <input
          autoComplete="tel"
          className={inputClass}
          id="phone"
          name="phone"
          placeholder="+358 40 123 4567"
          type="tel"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="password">Choose a password</label>
        <input
          autoComplete="new-password"
          className={inputClass}
          id="password"
          minLength={8}
          name="password"
          placeholder="At least 8 characters"
          required
          type="password"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="confirmPassword">Confirm password</label>
        <input
          autoComplete="new-password"
          className={inputClass}
          id="confirmPassword"
          minLength={8}
          name="confirmPassword"
          placeholder="Repeat your password"
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
        className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Activating account…" : "Activate account"}
      </button>
    </form>
  );
}
