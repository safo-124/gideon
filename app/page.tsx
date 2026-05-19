import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { getActiveRequest, getPastRequests, type ActiveRequest, type PastRequest } from "./request/_lib/data";
import { logout } from "./login/actions";
import { cancelRequest, markPickedUp, returnKey } from "./request/actions";
import { SubmitButton } from "./components/submit-button";

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

const shortFmt = new Intl.DateTimeFormat("en-FI", { month: "short", day: "numeric", year: "numeric" });

function centsToEur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

function overdueHours(dueAt: Date, now: Date) {
  return Math.max(0, (now.getTime() - dueAt.getTime()) / 3_600_000);
}

// ── Active request panel ──────────────────────────────────────────────────────

function RequestPanel({ request, now }: { request: ActiveRequest; now: Date }) {
  if (!request) return null;
  const { id, status, apartment, key } = request;
  const aptLabel = `${apartment.block.name} / Apt ${apartment.number}`;

  if (status === "AWAITING_PAYMENT") {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 bg-amber-50 px-6 py-3 dark:border-zinc-800 dark:bg-amber-950/30">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Pending payment
          </span>
        </div>
        <div className="p-6">
          <div className="text-lg font-semibold">{aptLabel}</div>
          <div className="mt-1 text-sm text-zinc-500">Complete payment to confirm your spare key request.</div>
          <div className="mt-3 inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700 dark:bg-teal-950/50 dark:text-teal-400">
            €20.00 due
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800"
              href={`/request/${id}/pay`}
            >
              Continue to payment →
            </Link>
            <form action={cancelRequest} className="flex-1">
              <input name="id" type="hidden" value={id} />
              <SubmitButton
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                pendingText="Cancelling…"
              >
                Cancel
              </SubmitButton>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (status === "PAID" && key) {
    return (
      <div className="overflow-hidden rounded-2xl border border-teal-200 bg-teal-50 shadow-sm dark:border-teal-900/50 dark:bg-teal-950/20">
        <div className="border-b border-teal-100 bg-teal-100/70 px-6 py-3 dark:border-teal-900/50 dark:bg-teal-950/40">
          <span className="text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-400">
            Ready for pickup
          </span>
        </div>
        <div className="p-6">
          <div className="text-lg font-semibold">{aptLabel}</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-teal-100 bg-white px-5 py-4 shadow-sm dark:border-teal-900/30 dark:bg-zinc-900">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Cabinet</div>
              <div className="mt-1.5 text-4xl font-bold tabular-nums">{key.cabinet.number}</div>
            </div>
            <div className="rounded-xl border border-teal-100 bg-white px-5 py-4 shadow-sm dark:border-teal-900/30 dark:bg-zinc-900">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Code</div>
              <div className="mt-1.5 text-4xl font-bold tabular-nums tracking-[0.15em]">{key.cabinet.currentCode}</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-teal-800 dark:text-teal-300">
            {request.type === "FOR_OTHER"
              ? "Pick up the key and pass it to the resident. You have 6 hours to return it — overage is €5.00/hr."
              : "You have 6 hours from pickup to return the key. Overage is €5.00/hr."}
          </p>
          <form action={markPickedUp} className="mt-4">
            <input name="id" type="hidden" value={id} />
            <SubmitButton
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              pendingText="Confirming…"
            >
              I&apos;ve picked it up
            </SubmitButton>
          </form>
        </div>
      </div>
    );
  }

  if (status === "PICKED_UP" && request.dueAt && key) {
    const hoursOver = overdueHours(request.dueAt, now);
    const isOverdue = hoursOver > 0;
    const estimatedFee = Math.ceil(hoursOver) * 500;

    return (
      <div
        className={`overflow-hidden rounded-2xl border shadow-sm ${
          isOverdue
            ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
            : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20"
        }`}
      >
        <div
          className={`border-b px-6 py-3 ${
            isOverdue
              ? "border-red-100 bg-red-100/70 dark:border-red-900/50 dark:bg-red-950/40"
              : "border-amber-100 bg-amber-100/70 dark:border-amber-900/50 dark:bg-amber-950/40"
          }`}
        >
          <span
            className={`text-xs font-semibold uppercase tracking-widest ${
              isOverdue ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"
            }`}
          >
            {isOverdue ? "Overdue — return immediately" : "Key checked out"}
          </span>
        </div>
        <div className="p-6">
          <div className="text-lg font-semibold">{aptLabel}</div>
          {isOverdue ? (
            <div className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">
              Overdue by {Math.floor(hoursOver)}h {Math.round((hoursOver % 1) * 60)}m — estimated extra {centsToEur(estimatedFee)}
            </div>
          ) : (
            <div className="mt-2 text-sm text-amber-800 dark:text-amber-300">
              Return by <span className="font-semibold">{dtFmt.format(request.dueAt)}</span>
            </div>
          )}
          <div className="mt-4 flex items-center gap-5 rounded-xl bg-white/70 px-5 py-3.5 dark:bg-black/20">
            <div>
              <div className="text-xs text-zinc-400">Cabinet</div>
              <div className="mt-0.5 text-xl font-bold tabular-nums">{key.cabinet.number}</div>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div>
              <div className="text-xs text-zinc-400">Code</div>
              <div className="mt-0.5 text-xl font-bold tabular-nums tracking-[0.15em]">{key.cabinet.currentCode}</div>
            </div>
          </div>
          <form action={returnKey} className="mt-4">
            <input name="id" type="hidden" value={id} />
            <SubmitButton
              className={`inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isOverdue
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              }`}
              pendingText="Returning…"
            >
              Return key
            </SubmitButton>
          </form>
        </div>
      </div>
    );
  }

  return null;
}

// ── Past request history ──────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  RETURNED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  CANCELLED: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
  DISPUTED: "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  RETURNED: "Returned",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};

function HistorySection({ requests }: { requests: PastRequest[] }) {
  if (requests.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Past requests</h2>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {requests.map((req, i) => {
          const aptLabel = `${req.apartment.block.name} / Apt ${req.apartment.number}`;
          const date = req.returnedAt ?? req.cancelledAt ?? req.createdAt;
          const statusClass = STATUS_STYLE[req.status] ?? "bg-zinc-100 text-zinc-500";
          const label = STATUS_LABEL[req.status] ?? req.status;
          const total = req.amountCents + req.overdueFeeCents;

          return (
            <div
              className={`flex items-center justify-between gap-4 px-5 py-4 ${
                i > 0 ? "border-t border-zinc-100 dark:border-zinc-800" : ""
              }`}
              key={req.id}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{aptLabel}</div>
                <div className="mt-0.5 text-xs text-zinc-400">
                  {req.type === "FOR_OTHER" ? "For someone · " : ""}
                  {shortFmt.format(date)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {req.overdueFeeCents > 0 && (
                  <span className="text-xs font-medium text-red-500">{centsToEur(total)}</span>
                )}
                {req.overdueFeeCents === 0 && req.status === "RETURNED" && (
                  <span className="text-xs text-zinc-400">{centsToEur(req.amountCents)}</span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>{label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = firstParam(params.error);

  const tenant = await requireTenant();
  const [activeRequest, pastRequests] = await Promise.all([
    getActiveRequest(tenant.id),
    getPastRequests(tenant.id),
  ]);
  const now = new Date();

  const firstName = tenant.fullName.split(" ")[0];
  const initials = tenant.fullName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-6">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight">Welcome, {firstName}</h1>
            <p className="truncate text-sm text-zinc-500">
              {tenant.apartment.block.name} · Apt {tenant.apartment.number} · {tenant.apartment.block.streetName} {tenant.apartment.block.zip}
            </p>
          </div>
        </div>
        <form action={logout} className="shrink-0">
          <SubmitButton
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
            pendingText="…"
          >
            Sign out
          </SubmitButton>
        </form>
      </header>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
          <span className="mt-px shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {activeRequest ? (
        <RequestPanel now={now} request={activeRequest} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-teal-700"
            href="/request/new"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
              </svg>
            </div>
            <div className="text-sm font-semibold">Request spare key</div>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
              Get temporary access to your apartment.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-zinc-400">€20.00 · 6-hour hold</span>
              <span className="text-xs font-medium text-teal-700 transition group-hover:translate-x-0.5 dark:text-teal-400">
                →
              </span>
            </div>
          </Link>

          <Link
            className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-teal-700"
            href="/request/for-someone"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <div className="text-sm font-semibold">Request for someone</div>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
              Request a key on behalf of another resident.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-zinc-400">For other tenants</span>
              <span className="text-xs font-medium text-teal-700 transition group-hover:translate-x-0.5 dark:text-teal-400">
                →
              </span>
            </div>
          </Link>
        </div>
      )}

      <HistorySection requests={pastRequests} />
    </main>
  );
}
