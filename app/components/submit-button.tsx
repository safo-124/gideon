"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className,
  pendingText = "Working…",
}: {
  children: React.ReactNode;
  className: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingText : children}
    </button>
  );
}
