"use client";

import { useEffect } from "react";

export default function AdminError({
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
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-500">{error.message || "An unexpected error occurred."}</p>
      <button
        className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}
