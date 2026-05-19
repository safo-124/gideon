import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { getApartmentByBlockAndNumber } from "../../_lib/data";
import { createForOtherRequest } from "../../actions";
import { SubmitButton } from "@/app/components/submit-button";

export const metadata = { title: "Confirm request — Key Recovery" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function BackLink({ href }: { href: string }) {
  return (
    <Link
      className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      href={href}
    >
      ← Back
    </Link>
  );
}

export default async function ForSomeoneConfirmPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const tenant = await requireTenant();

  const blockId = Number(firstParam(params.blockId));
  const aptNumber = Number(firstParam(params.apt));

  if (!blockId || !aptNumber) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <BackLink href="/request/for-someone" />
        <p className="text-sm text-zinc-500">Invalid search. Please go back and try again.</p>
      </main>
    );
  }

  const apartment = await getApartmentByBlockAndNumber(blockId, aptNumber);

  if (!apartment) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <BackLink href="/request/for-someone" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/70 dark:bg-red-950/30">
          <div className="text-sm font-semibold text-red-700 dark:text-red-300">Apartment not found</div>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            No apartment {aptNumber} exists in that block. Check the number and try again.
          </p>
        </div>
        <Link
          className="mt-4 inline-flex h-12 items-center rounded-xl border border-zinc-200 bg-white px-5 text-base font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          href="/request/for-someone"
        >
          Try again
        </Link>
      </main>
    );
  }

  const isOwnApartment = apartment.id === tenant.apartmentId;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <BackLink href="/request/for-someone" />

      <h1 className="text-2xl font-semibold tracking-tight">Confirm apartment</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Review the details before requesting a spare key.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="divide-y divide-zinc-100 px-5 py-2 dark:divide-zinc-800">
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm text-zinc-500">Block</span>
            <span className="text-sm font-medium">{apartment.block.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm text-zinc-500">Apartment</span>
            <span className="text-sm font-medium">Apt {apartment.number}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm text-zinc-500">Address</span>
            <span className="text-right text-sm font-medium">
              {apartment.block.streetName} {apartment.block.zip}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm text-zinc-500">Fee</span>
            <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">€20.00</span>
          </div>
        </div>

        <div className="border-t border-zinc-100 p-5 dark:border-zinc-800">
          {isOwnApartment ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
              This is your own apartment.{" "}
              <Link className="font-semibold underline" href="/request/new">
                Use the spare key request instead.
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
                <strong className="font-semibold">Resident notification:</strong> The resident will
                receive an email with a 30-minute window to dispute this request. If they dispute it,
                the key will be blocked immediately.
              </div>
              <form action={createForOtherRequest}>
                <input name="apartmentId" type="hidden" value={apartment.id} />
                <SubmitButton
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                  pendingText="Creating request…"
                >
                  Accept and continue to payment
                </SubmitButton>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
