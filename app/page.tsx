import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { getActiveRequest, type ActiveRequest } from "./request/_lib/data";
import { logout } from "./login/actions";
import { cancelRequest, markPickedUp, returnKey } from "./request/actions";

export const metadata = { title: "Key Recovery" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const dtFmt = new Intl.DateTimeFormat("en-FI", {
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  day: "numeric",
});

function centsToEur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

function overdueHours(dueAt: Date, now: Date) {
  return Math.max(0, (now.getTime() - dueAt.getTime()) / 3_600_000);
}

function RequestPanel({ request, now }: { request: ActiveRequest; now: Date }) {
  if (!request) return null;
  const { id, status, apartment, key } = request;
  const aptLabel = `${apartment.block.name} / Apt ${apartment.number}`;

  if (status === "AWAITING_PAYMENT") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
          Pending payment
        </div>
        <div className="text-base font-semibold">Spare key — {aptLabel}</div>
        <div className="mt-1 text-sm text-zinc-500">€20.00 due to confirm your request</div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-800"
            href={`/request/${id}/pay`}
          >
            Continue to payment
          </Link>
          <form action={cancelRequest} className="flex-1">
            <input name="id" type="hidden" value={id} />
            <button
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
              type="submit"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (status === "PAID" && key) {
    return (
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-6 shadow-sm dark:border-teal-900/70 dark:bg-teal-950/20">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-teal-700 dark:text-teal-400">
          Key ready for pickup
        </div>
        <div className="text-base font-semibold">{aptLabel}</div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-md bg-white px-4 py-3 shadow-sm dark:bg-zinc-950">
            <div className="text-xs text-zinc-500">Cabinet</div>
            <div className="mt-0.5 text-xl font-semibold tabular-nums">{key.cabinet.number}</div>
          </div>
          <div className="rounded-md bg-white px-4 py-3 shadow-sm dark:bg-zinc-950">
            <div className="text-xs text-zinc-500">Code</div>
            <div className="mt-0.5 text-xl font-semibold tabular-nums tracking-widest">
              {key.cabinet.currentCode}
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-teal-700 dark:text-teal-400">
          {request.type === "FOR_OTHER"
            ? "Pick up the key and pass it to the resident. You have 6 hours to return it. Overage is €5.00/hr."
            : "You have 6 hours from pickup to return the key. Overage is €5.00/hr."}
        </p>

        <form action={markPickedUp} className="mt-4">
          <input name="id" type="hidden" value={id} />
          <button
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-800"
            type="submit"
          >
            I&apos;ve picked it up
          </button>
        </form>
      </div>
    );
  }

  if (status === "PICKED_UP" && request.dueAt && key) {
    const hoursOver = overdueHours(request.dueAt, now);
    const isOverdue = hoursOver > 0;
    const estimatedFee = Math.ceil(hoursOver) * 500;

    return (
      <div
        className={`rounded-lg border p-6 shadow-sm ${
          isOverdue
            ? "border-red-200 bg-red-50 dark:border-red-900/70 dark:bg-red-950/20"
            : "border-amber-200 bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/20"
        }`}
      >
        <div
          className={`mb-1 text-xs font-medium uppercase tracking-wide ${
            isOverdue ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"
          }`}
        >
          {isOverdue ? "Overdue" : "Key checked out"}
        </div>
        <div className="text-base font-semibold">{aptLabel}</div>

        {isOverdue ? (
          <div className="mt-2 text-sm text-red-700 dark:text-red-400">
            Overdue by {Math.floor(hoursOver)}h {Math.round((hoursOver % 1) * 60)}m — estimated
            extra {centsToEur(estimatedFee)}
          </div>
        ) : (
          <div className="mt-2 text-sm text-amber-700 dark:text-amber-400">
            Return by {dtFmt.format(request.dueAt)}
          </div>
        )}

        <div className="mt-3 flex gap-3 text-sm text-zinc-500">
          <span>Cabinet {key.cabinet.number}</span>
          <span>·</span>
          <span>Code {key.cabinet.currentCode}</span>
        </div>

        <form action={returnKey} className="mt-4">
          <input name="id" type="hidden" value={id} />
          <button
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-800 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
            type="submit"
          >
            Return key
          </button>
        </form>
      </div>
    );
  }

  return null;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const error = firstParam(params.error);

  const tenant = await requireTenant();
  const activeRequest = await getActiveRequest(tenant.id);
  const now = new Date();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome, {tenant.fullName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {tenant.apartment.block.name} · Apt {tenant.apartment.number} ·{" "}
            {tenant.apartment.block.streetName} {tenant.apartment.block.zip}
          </p>
        </div>
        <form action={logout}>
          <button className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            Sign out
          </button>
        </form>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {activeRequest ? (
        <RequestPanel now={now} request={activeRequest} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            className="group rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            href="/request/new"
          >
            <div className="text-sm font-semibold">Request spare key</div>
            <p className="mt-2 text-sm text-zinc-500">
              Get temporary access to your apartment. €20.00 · 6-hour hold.
            </p>
            <div className="mt-4 text-xs font-medium text-teal-700 group-hover:underline dark:text-teal-400">
              Start request →
            </div>
          </Link>

          <Link
            className="group rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            href="/request/for-someone"
          >
            <div className="text-sm font-semibold">Request for someone</div>
            <p className="mt-2 text-sm text-zinc-500">
              Request a key on behalf of another tenant in the building.
            </p>
            <div className="mt-4 text-xs font-medium text-teal-700 group-hover:underline dark:text-teal-400">
              Start request →
            </div>
          </Link>
        </div>
      )}
    </main>
  );
}
