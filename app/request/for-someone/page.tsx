import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { getActiveRequest, getBlocks } from "../_lib/data";

export const metadata = { title: "Request key for someone — Key Recovery" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const inputClass =
  "h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

export default async function ForSomeonePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const error = firstParam(params.error);

  const tenant = await requireTenant();
  const [existing, blocks] = await Promise.all([
    getActiveRequest(tenant.id),
    getBlocks(),
  ]);

  if (existing) redirect("/");

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        href="/"
      >
        ← Back
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Request for someone</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Find the apartment you want to request a spare key for. The resident will be notified.
      </p>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
          <span className="mt-px shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <form
        action="/request/for-someone/confirm"
        className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        method="get"
      >
        <div className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Building</span>
            <select className={inputClass} name="blockId" required>
              <option value="">Select a block</option>
              {blocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.name} — {block.streetName} {block.zip}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400">Apartment number</span>
            <input
              className={inputClass}
              inputMode="numeric"
              min={1}
              name="apt"
              placeholder="e.g. 25"
              required
              type="number"
            />
          </label>
        </div>

        <div className="border-t border-zinc-100 p-5 dark:border-zinc-800">
          <button
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800"
            type="submit"
          >
            Find apartment →
          </button>
        </div>
      </form>
    </main>
  );
}
