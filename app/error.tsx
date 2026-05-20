"use client";

import { useEffect } from "react";
import { ThemeToggle } from "./components/theme-toggle";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <ThemeToggle className="mb-8" />
      <div className="text-5xl font-bold text-zinc-200 dark:text-zinc-700">!</div>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-500">An unexpected error occurred. Please try again.</p>
      <button
        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-teal-700 px-5 text-sm font-medium text-white transition hover:bg-teal-800"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
