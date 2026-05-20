"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UnlockTransition } from "@/app/components/unlock-transition";
import type { LoginState } from "./authenticate";

const inputClass =
  "auth-input h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base outline-none placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const unlockRedirectDelayMs = 1800;

export function LoginForm() {
  const router = useRouter();
  const redirectTimeoutRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) window.clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || isUnlocking) return;

    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/login", {
        body: new FormData(event.currentTarget),
        credentials: "same-origin",
        method: "POST",
      });
      const result = (await response.json()) as LoginState;

      if (!response.ok || !result.unlocked) {
        setError(result.error ?? "Unable to sign in right now.");
        return;
      }

      setIsUnlocking(true);
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      redirectTimeoutRef.current = window.setTimeout(
        () => {
          router.replace("/");
        },
        prefersReducedMotion ? 250 : unlockRedirectDelayMs,
      );
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      {isUnlocking && <UnlockTransition />}
      <form aria-busy={isPending || isUnlocking} className="auth-form space-y-4" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className={labelClass} htmlFor="email">Email</label>
          <input
            autoComplete="email"
            className={inputClass}
            disabled={isPending || isUnlocking}
            id="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>
        <div className="auth-field">
          <label className={labelClass} htmlFor="password">Password</label>
          <input
            autoComplete="current-password"
            className={inputClass}
            disabled={isPending || isUnlocking}
            id="password"
            name="password"
            placeholder="Enter password"
            required
            type="password"
          />
        </div>
        {error && (
          <div className="auth-error rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300" role="alert">
            {error}
          </div>
        )}
        <button
          className="auth-submit mt-1 inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-500 dark:hover:bg-teal-400"
          disabled={isPending || isUnlocking}
          type="submit"
        >
          {isUnlocking ? "Opening..." : isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </>
  );
}
