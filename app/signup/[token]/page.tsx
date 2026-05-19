import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ActivateForm } from "./ActivateForm";

export const metadata = { title: "Activate account — Key Recovery" };

export default async function ActivatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const session = await readSession();
  if (session?.role === "tenant") redirect("/");
  if (session?.role === "admin") redirect("/admin");

  const tenant = await prisma.tenant.findUnique({
    where: { inviteToken: token },
    include: { apartment: { include: { block: true } } },
  });

  const KeyIcon = () => (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-sm">
      <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
      </svg>
    </div>
  );

  // Invalid token
  if (!tenant) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center"><KeyIcon /></div>
          <h1 className="mt-4 text-xl font-semibold">Invalid invite link</h1>
          <p className="mt-2 text-sm text-zinc-500">
            This link is invalid or has already been used. Contact your building manager for a new one.
          </p>
          <Link
            className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-teal-700 px-6 text-base font-semibold text-white transition hover:bg-teal-800"
            href="/login"
          >
            Sign in instead
          </Link>
        </div>
      </main>
    );
  }

  // Already activated
  if (tenant.passwordHash) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center"><KeyIcon /></div>
          <h1 className="mt-4 text-xl font-semibold">Already activated</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Your account is already active. Sign in with your email and password.
          </p>
          <Link
            className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-teal-700 px-6 text-base font-semibold text-white transition hover:bg-teal-800"
            href="/login"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  // Expired
  const isExpired = tenant.inviteExpiresAt ? tenant.inviteExpiresAt < new Date() : true;
  if (isExpired) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center"><KeyIcon /></div>
          <h1 className="mt-4 text-xl font-semibold">Invite expired</h1>
          <p className="mt-2 text-sm text-zinc-500">
            This invite link has expired. Ask your building manager to send a new one.
          </p>
        </div>
      </main>
    );
  }

  const aptLabel = `${tenant.apartment.block.name} / Apt ${tenant.apartment.number}`;

  return (
    <main className="flex flex-1 items-start justify-center px-4 py-12 sm:items-center sm:px-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <KeyIcon />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Activate your account</h1>
          <p className="mt-1 text-sm text-zinc-500">Set a password to get started</p>
        </div>

        {/* Pre-filled info */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-teal-200 bg-teal-50 dark:border-teal-900/50 dark:bg-teal-950/20">
          <div className="border-b border-teal-100 px-5 py-2.5 dark:border-teal-900/50">
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-400">
              Your account
            </span>
          </div>
          <div className="divide-y divide-teal-100 px-5 dark:divide-teal-900/50">
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-zinc-500">Name</span>
              <span className="text-sm font-semibold">{tenant.fullName}</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-zinc-500">Email</span>
              <span className="text-sm font-medium">{tenant.email}</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-zinc-500">Apartment</span>
              <span className="text-sm font-semibold">{aptLabel}</span>
            </div>
          </div>
        </div>

        {/* Activation form */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <ActivateForm token={token} />
        </div>

        <p className="mt-5 text-center text-sm text-zinc-500">
          Already have a password?{" "}
          <Link className="font-medium text-teal-700 hover:underline dark:text-teal-400" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
