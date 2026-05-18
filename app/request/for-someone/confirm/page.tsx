import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { getApartmentByBlockAndNumber } from "../../_lib/data";
import { createForOtherRequest } from "../../actions";

export const metadata = { title: "Confirm request — Key Recovery" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
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
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
        <Link className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200" href="/request/for-someone">
          ← Back
        </Link>
        <p className="text-sm text-zinc-500">Invalid search. Please go back and try again.</p>
      </main>
    );
  }

  const apartment = await getApartmentByBlockAndNumber(blockId, aptNumber);

  if (!apartment) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
        <Link className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200" href="/request/for-someone">
          ← Back
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 dark:border-red-900/70 dark:bg-red-950/30">
          <div className="text-sm font-medium text-red-700 dark:text-red-300">Apartment not found</div>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            No apartment {aptNumber} exists in that block. Check the number and try again.
          </p>
        </div>
        <Link
          className="mt-4 inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          href="/request/for-someone"
        >
          Try again
        </Link>
      </main>
    );
  }

  const isOwnApartment = apartment.id === tenant.apartmentId;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <Link
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        href="/request/for-someone"
      >
        ← Back
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Confirm apartment</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Review the details before requesting a spare key.
      </p>

      <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-5 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Block</span>
            <span className="font-medium">{apartment.block.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Apartment</span>
            <span className="font-medium">Apt {apartment.number}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Address</span>
            <span className="font-medium">
              {apartment.block.streetName} {apartment.block.zip}
            </span>
          </div>
          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Fee</span>
            <span className="font-semibold text-zinc-950 dark:text-zinc-50">€20.00</span>
          </div>
        </div>

        {isOwnApartment ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
            This is your own apartment.{" "}
            <Link className="font-medium underline" href="/request/new">
              Use the spare key request instead.
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
              <strong className="font-semibold">Resident notification:</strong> The resident of this
              apartment will receive an email with a 30-minute window to dispute this request. If they
              dispute it, the key will be blocked immediately.
            </div>

            <form action={createForOtherRequest}>
              <input name="apartmentId" type="hidden" value={apartment.id} />
              <button
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-800"
                type="submit"
              >
                Accept and continue to payment
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
