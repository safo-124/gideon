import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { findAvailableKey, getActiveRequest } from "../_lib/data";
import { createSelfRequest } from "../actions";

export const metadata = { title: "Request spare key — Key Recovery" };

export default async function NewRequestPage() {
  const tenant = await requireTenant();
  const existing = await getActiveRequest(tenant.id);
  if (existing) redirect("/");

  const keyAvailable = !!(await findAvailableKey(tenant.apartmentId));

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
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

      <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Apartment</span>
            <span className="font-medium">
              {tenant.apartment.block.name} / Apt {tenant.apartment.number}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Address</span>
            <span className="font-medium">
              {tenant.apartment.block.streetName} {tenant.apartment.block.zip}
            </span>
          </div>
          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Fee</span>
            <span className="font-semibold text-zinc-950 dark:text-zinc-50">€20.00</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Key hold</span>
            <span className="font-medium">6 hours</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Overage</span>
            <span className="font-medium">€5.00 / hr</span>
          </div>
        </div>

        {keyAvailable ? (
          <form action={createSelfRequest}>
            <button
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-800"
              type="submit"
            >
              Continue to payment
            </button>
          </form>
        ) : (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
            No spare key is available for your apartment right now. Please try again later.
          </div>
        )}
      </div>
    </main>
  );
}
