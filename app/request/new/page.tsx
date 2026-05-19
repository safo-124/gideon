import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { findAvailableKey, getActiveRequest } from "../_lib/data";
import { createSelfRequest } from "../actions";
import { SubmitButton } from "@/app/components/submit-button";

export const metadata = { title: "Request spare key — Key Recovery" };

export default async function NewRequestPage() {
  const tenant = await requireTenant();
  const existing = await getActiveRequest(tenant.id);
  if (existing) redirect("/");

  const keyAvailable = !!(await findAvailableKey(tenant.apartmentId));

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        href="/"
      >
        ← Back
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Request spare key</h1>
      <p className="mt-2 text-sm text-zinc-500">
        A spare key will be placed in a cabinet for you to collect. You have 6 hours to return it.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="divide-y divide-zinc-100 px-5 py-4 dark:divide-zinc-800">
          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-zinc-500">Apartment</span>
            <span className="text-sm font-medium">
              {tenant.apartment.block.name} / Apt {tenant.apartment.number}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-zinc-500">Address</span>
            <span className="text-right text-sm font-medium">
              {tenant.apartment.block.streetName} {tenant.apartment.block.zip}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-zinc-500">Fee</span>
            <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">€20.00</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-zinc-500">Key hold</span>
            <span className="text-sm font-medium">6 hours</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-zinc-500">Overage</span>
            <span className="text-sm font-medium">€5.00 / hr</span>
          </div>
        </div>

        <div className="border-t border-zinc-100 p-5 dark:border-zinc-800">
          {keyAvailable ? (
            <form action={createSelfRequest}>
              <SubmitButton
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                pendingText="Creating request…"
              >
                Continue to payment
              </SubmitButton>
            </form>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
              No spare key is available for your apartment right now. Please try again later.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
