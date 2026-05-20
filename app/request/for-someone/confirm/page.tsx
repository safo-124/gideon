import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getApartmentByBlockAndNumber } from "../../_lib/data";
import { createForOtherRequest } from "../../actions";
import { KeyDoorAnimation } from "@/app/components/key-door-animation";
import { SubmitButton } from "@/app/components/submit-button";
import { ThemeToggle } from "@/app/components/theme-toggle";

export const metadata = { title: "Confirm request — Key Recovery" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function centsToEur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

const reasonLabels: Record<string, string> = {
  caregiver: "Family or caregiver access",
  locked_out: "Resident is locked out",
  other: "Other approved reason",
  resident_asked: "Resident asked me to help",
};

function BackLink({ href }: { href: string }) {
  return (
    <Link
      className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-50"
      href={href}
    >
      ← Back
    </Link>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <header className="tenant-dashboard-enter flex items-center justify-between gap-4">
          <BackLink href="/request/for-someone" />
          <ThemeToggle />
        </header>
        {children}
      </div>
    </main>
  );
}

export default async function ForSomeoneConfirmPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const tenant = await requireTenant();
  const settings = await getSettings();

  const blockId = Number(firstParam(params.blockId));
  const aptNumber = Number(firstParam(params.apt));
  const reason = firstParam(params.reason) ?? "";
  const reasonLabel = reasonLabels[reason] ?? "Resident-assisted access";

  if (!blockId || !aptNumber) {
    return (
      <PageShell>
        <div className="tenant-dashboard-card mt-8 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-lg font-semibold">Invalid search</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Choose a building and apartment number to continue.</p>
        </div>
      </PageShell>
    );
  }

  const apartment = await getApartmentByBlockAndNumber(blockId, aptNumber);

  if (!apartment) {
    return (
      <PageShell>
        <div className="tenant-dashboard-card mt-8 rounded-lg border border-red-200 bg-red-50 p-5 dark:border-red-900/70 dark:bg-red-950/30">
          <h1 className="text-lg font-semibold text-red-700 dark:text-red-300">Apartment not found</h1>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            We could not find apartment {aptNumber} in that building. Check the building and number, then try again.
          </p>
          <Link
            className="mt-4 inline-flex h-10 items-center rounded-md bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950/40"
            href="/request/for-someone"
          >
            Try again
          </Link>
        </div>
      </PageShell>
    );
  }

  const isOwnApartment = apartment.id === tenant.apartmentId;

  return (
    <PageShell>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_340px] lg:items-start">
        <section className="tenant-dashboard-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">Confirm details</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Review the apartment</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Make sure this is the resident&apos;s apartment before continuing to payment.
              </p>
            </div>
            <KeyDoorAnimation className="self-start" tone="teal" />
          </div>

          <div className="mt-6 divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Building</span>
              <span className="text-right text-sm font-medium">{apartment.block.name}</span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Apartment</span>
              <span className="text-right text-sm font-medium">Apt {apartment.number}</span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Address</span>
              <span className="text-right text-sm font-medium">
                {apartment.block.streetName} {apartment.block.zip}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Reason</span>
              <span className="text-right text-sm font-medium">{reasonLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Fee</span>
              <span className="text-right text-sm font-bold">{centsToEur(settings.base_fee_cents)}</span>
            </div>
          </div>

          <div className="mt-5">
            {isOwnApartment ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
                This is your own apartment.{" "}
                <Link className="font-semibold underline" href="/request/new">
                  Use the spare key request instead.
                </Link>
              </div>
            ) : (
              <form action={createForOtherRequest} className="grid gap-4">
                <input name="apartmentId" type="hidden" value={apartment.id} />
                <input name="reason" type="hidden" value={reason} />
                <label className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
                  <input
                    className="mt-0.5 h-4 w-4 rounded border-amber-300 accent-teal-700"
                    name="permissionConfirmed"
                    required
                    type="checkbox"
                    value="yes"
                  />
                  <span>I confirm I have permission to request this key for the resident.</span>
                </label>
                <SubmitButton
                  className="inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                  pendingText="Sending approval..."
                >
                  Send approval request
                </SubmitButton>
              </form>
            )}
          </div>
        </section>

        <aside className="tenant-dashboard-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold">Resident protection</h2>
          <div className="mt-4 grid gap-4 text-sm">
            <div>
              <div className="font-medium">Notification first</div>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                The resident receives a dispute link before access is released.
              </p>
            </div>
            <div>
              <div className="font-medium">{settings.dispute_window_minutes}-minute review</div>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                If they dispute the request, the key is blocked immediately.
              </p>
            </div>
            <div>
              <div className="font-medium">{settings.hold_hours}-hour return window</div>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                You are responsible for returning the spare key after pickup.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
