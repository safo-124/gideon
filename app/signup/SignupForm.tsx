"use client";

import { useActionState, useState } from "react";
import { registerTenant, type SignupState } from "./actions";
import type { BlocksForSignup } from "@/app/request/_lib/data";

const initial: SignupState = {};

const inputClass =
  "h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 disabled:opacity-50";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400";

export function SignupForm({ blocks }: { blocks: BlocksForSignup }) {
  const [state, action, pending] = useActionState(registerTenant, initial);
  const [blockId, setBlockId] = useState("");

  const apartments = blocks.find((b) => b.id.toString() === blockId)?.apartments ?? [];

  return (
    <form action={action} className="space-y-4">
      {/* Full name */}
      <div>
        <label className={labelClass} htmlFor="fullName">Full name</label>
        <input
          autoComplete="name"
          className={inputClass}
          id="fullName"
          name="fullName"
          placeholder="Jane Doe"
          required
          type="text"
        />
      </div>

      {/* Email */}
      <div>
        <label className={labelClass} htmlFor="email">Email</label>
        <input
          autoComplete="email"
          className={inputClass}
          id="email"
          name="email"
          placeholder="jane@example.com"
          required
          type="email"
        />
      </div>

      {/* Phone */}
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

      {/* Apartment — two-step: block then unit */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="blockSelect">Building</label>
          <select
            className={inputClass}
            id="blockSelect"
            onChange={(e) => setBlockId(e.target.value)}
            required
            value={blockId}
          >
            <option value="">Select block</option>
            {blocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="apartmentId">Apartment</label>
          <select
            className={inputClass}
            disabled={apartments.length === 0}
            id="apartmentId"
            name="apartmentId"
            required
          >
            <option value="">Select apt</option>
            {apartments.map((apt) => (
              <option key={apt.id} value={apt.id}>
                Apt {apt.number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Password */}
      <div>
        <label className={labelClass} htmlFor="password">Password</label>
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

      {/* Confirm password */}
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
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
