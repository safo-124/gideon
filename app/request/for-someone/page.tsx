import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { KeyDoorAnimation } from "@/app/components/key-door-animation";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { getActiveRequest, getBlocks } from "../_lib/data";

export const metadata = { title: "Request key for someone — Key Recovery" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function centsToEur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

const fieldClass =
  "h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

const requestReasons = [
  { label: "Resident asked me to help", value: "resident_asked" },
  { label: "Resident is locked out", value: "locked_out" },
  { label: "Family or caregiver access", value: "caregiver" },
  { label: "Other approved reason", value: "other" },
];

function StepItem({ index, label }: { index: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white dark:bg-teal-500 dark:text-zinc-950">
        {index}
      </span>
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
    </div>
  );
}

export default async function ForSomeonePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const error = firstParam(params.error);

  const tenant = await requireTenant();
  const [existing, blocks, settings] = await Promise.all([
    getActiveRequest(tenant.id),
    getBlocks(),
    getSettings(),
  ]);

  if (existing) redirect("/");

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 pb-24 sm:px-6 sm:py-8 lg:px-8">
        <header className="tenant-dashboard-enter flex items-center justify-between gap-4">
          <Link
            className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-50"
            href="/"
          >
            ← Back
          </Link>
          <ThemeToggle />
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-start">
          <section>
            <div className="tenant-dashboard-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">Resident-assisted access</p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Help another resident get access
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    Find the apartment first. The resident will be notified before a spare key is released.
                  </p>
                </div>
                <KeyDoorAnimation className="self-start" tone="teal" />
              </div>

              {error && (
                <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              )}

              <form action="/request/for-someone/confirm" className="mt-6 grid gap-5" method="get">
                <label className="block">
                  <span className={labelClass}>Building</span>
                  <select className={fieldClass} name="blockId" required>
                    <option value="">Select a block</option>
                    {blocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.name} - {block.streetName} {block.zip}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1.5 block text-xs text-zinc-400">Choose the resident&apos;s building.</span>
                </label>

                <label className="block">
                  <span className={labelClass}>Apartment number</span>
                  <input
                    className={fieldClass}
                    inputMode="numeric"
                    min={1}
                    name="apt"
                    placeholder="e.g. 25"
                    required
                    type="number"
                  />
                  <span className="mt-1.5 block text-xs text-zinc-400">Enter only the apartment number.</span>
                </label>

                <label className="block">
                  <span className={labelClass}>Reason</span>
                  <select className={fieldClass} name="reason" required>
                    <option value="">Select a reason</option>
                    {requestReasons.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
                  <input className="mt-0.5 h-4 w-4 rounded border-amber-300 accent-teal-700" name="understood" required type="checkbox" value="yes" />
                  <span>I understand the resident will be notified and can dispute this request.</span>
                </label>

                <button
                  className="inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
                  type="submit"
                >
                  Find apartment →
                </button>
              </form>
            </div>
          </section>

          <aside className="grid gap-4">
            <section className="tenant-dashboard-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold">How it works</h2>
              <div className="mt-4 grid gap-4">
                <StepItem index={1} label="Find the apartment" />
                <StepItem index={2} label="Resident is notified" />
                <StepItem index={3} label="Pay and collect key" />
                <StepItem index={4} label="Return it on time" />
              </div>
            </section>

            <section className="tenant-dashboard-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold">Request rules</h2>
              <div className="mt-4 divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
                <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
                  <span className="text-zinc-500 dark:text-zinc-400">Base fee</span>
                  <span className="font-medium">{centsToEur(settings.base_fee_cents)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="text-zinc-500 dark:text-zinc-400">Return window</span>
                  <span className="font-medium">{settings.hold_hours} hours</span>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="text-zinc-500 dark:text-zinc-400">Dispute window</span>
                  <span className="font-medium">{settings.dispute_window_minutes} minutes</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
