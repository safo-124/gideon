import Link from "next/link";
import { getFinanceSummary, getTransactions, type Transaction } from "../../_lib/data";
import { Flash, PageHeader, firstParam, type AdminSearchParams } from "../../_components/ui";

export const metadata = { title: "Finance — Admin" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function eur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

function parseMonth(raw: string | undefined): { gte: Date; lt: Date } | undefined {
  if (!raw || !/^\d{4}-\d{2}$/.test(raw)) return undefined;
  const [y, m] = raw.split("-").map(Number);
  return { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
}

function monthLabel(raw: string) {
  const [y, m] = raw.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-FI", { month: "long", year: "numeric" });
}

function recentMonths(n = 5) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

const dtFmt = new Intl.DateTimeFormat("en-FI", { month: "short", day: "numeric", year: "numeric" });

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PAID:      { label: "Awaiting pickup", cls: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400" },
  PICKED_UP: { label: "Key out",         cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
  RETURNED:  { label: "Returned",        cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  DISPUTED:  { label: "Disputed",        cls: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400" },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  amount,
  sub,
  tone = "zinc",
}: {
  label: string;
  amount: string;
  sub: string;
  tone?: "teal" | "amber" | "red" | "zinc";
}) {
  const tones = {
    teal:  "border-teal-200 bg-teal-50 dark:border-teal-900/50 dark:bg-teal-950/20",
    amber: "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20",
    red:   "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20",
    zinc:  "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
  };
  const labelTones = {
    teal:  "text-teal-700 dark:text-teal-400",
    amber: "text-amber-700 dark:text-amber-400",
    red:   "text-red-700 dark:text-red-400",
    zinc:  "text-zinc-400",
  };

  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
      <div className={`text-xs font-semibold uppercase tracking-widest ${labelTones[tone]}`}>{label}</div>
      <div className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{amount}</div>
      <div className="mt-1 text-xs text-zinc-500">{sub}</div>
    </div>
  );
}

function TransactionRow({ tx, now }: { tx: Transaction; now: Date }) {
  const isOverdue = tx.status === "PICKED_UP" && tx.dueAt && tx.dueAt < now;
  const badge = isOverdue
    ? { label: "Overdue", cls: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400" }
    : STATUS_BADGE[tx.status] ?? { label: tx.status, cls: "bg-zinc-100 text-zinc-500" };

  const aptLabel = `${tx.apartment.block.name} / Apt ${tx.apartment.number}`;
  const total = tx.amountCents + tx.overdueFeeCents;
  const date = tx.paidAt ?? tx.createdAt;

  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-5 py-4 sm:grid-cols-[1.8fr_1.2fr_auto_auto_auto_auto]">
      {/* Tenant */}
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{tx.requester.fullName}</div>
        <div className="mt-0.5 truncate text-xs text-zinc-400">{tx.requester.email}</div>
      </div>

      {/* Apartment + type — hidden on small screens */}
      <div className="hidden min-w-0 sm:block">
        <div className="truncate text-sm text-zinc-600 dark:text-zinc-300">{aptLabel}</div>
        <div className="mt-0.5 text-xs text-zinc-400">
          {tx.type === "FOR_OTHER" ? "For someone" : "Self"} · {dtFmt.format(date)}
        </div>
      </div>

      {/* Base fee */}
      <div className="hidden items-center sm:flex">
        <span className="tabular-nums text-sm text-zinc-600 dark:text-zinc-300">{eur(tx.amountCents)}</span>
      </div>

      {/* Overage */}
      <div className="hidden items-center sm:flex">
        {tx.overdueFeeCents > 0 ? (
          <span className="tabular-nums text-sm text-red-600 dark:text-red-400">+{eur(tx.overdueFeeCents)}</span>
        ) : (
          <span className="text-sm text-zinc-300 dark:text-zinc-600">—</span>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-end sm:justify-start">
        <span className="tabular-nums text-sm font-semibold">{eur(total)}</span>
      </div>

      {/* Status badge */}
      <div className="flex items-center justify-end">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Mobile-only apartment + date */}
      <div className="col-span-2 text-xs text-zinc-400 sm:hidden">
        {aptLabel} · {dtFmt.format(date)}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function FinancePage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const params = await searchParams;
  const monthParam = firstParam(params.month);
  const dateFilter = monthParam ? parseMonth(monthParam) : undefined;
  const filter = dateFilter ? { createdAt: dateFilter } : {};

  const [summary, transactions] = await Promise.all([
    getFinanceSummary(filter),
    getTransactions(filter),
  ]);

  const now = new Date();
  const months = recentMonths(5);
  const isFiltered = !!monthParam;

  return (
    <>
      <PageHeader
        description="Track payments, outstanding keys, and overdue charges across all requests."
        eyebrow="Money"
        title="Finance"
      />

      <Flash notice={firstParam(params.notice)} error={firstParam(params.error)} />

      {/* Month filter */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            !isFiltered
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
          href="/admin/finance"
        >
          All time
        </Link>
        {months.map((m) => (
          <Link
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              monthParam === m
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
            href={`/admin/finance?month=${m}`}
            key={m}
          >
            {monthLabel(m)}
          </Link>
        ))}
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          amount={eur(summary.collectedCents)}
          label="Collected"
          sub={`${summary.collectedCount} completed request${summary.collectedCount === 1 ? "" : "s"}`}
          tone="teal"
        />
        <SummaryCard
          amount={eur(summary.overageCents)}
          label="Overage collected"
          sub={summary.overageCents > 0 ? "Included in collected total" : "No overdue charges yet"}
          tone={summary.overageCents > 0 ? "amber" : "zinc"}
        />
        <SummaryCard
          amount={eur(summary.keysOutCents)}
          label="Keys out"
          sub={
            summary.overdueCount > 0
              ? `${summary.keysOutCount} active · ${summary.overdueCount} overdue · ~${eur(summary.overdueEstimatedCents)} accruing`
              : `${summary.keysOutCount} active, none overdue`
          }
          tone={summary.overdueCount > 0 ? "red" : "zinc"}
        />
        <SummaryCard
          amount={eur(summary.pendingCents)}
          label="Awaiting payment"
          sub={`${summary.pendingCount} request${summary.pendingCount === 1 ? "" : "s"} not yet paid`}
          tone={summary.pendingCount > 0 ? "amber" : "zinc"}
        />
      </div>

      {/* Transaction ledger */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Transactions {isFiltered ? `· ${monthLabel(monthParam!)}` : "· All time"}
          </h2>
          <span className="text-xs text-zinc-400">{transactions.length} records</span>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
            No transactions{isFiltered ? ` in ${monthLabel(monthParam!)}` : ""}.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {/* Table header — desktop only */}
            <div className="hidden grid-cols-[1.8fr_1.2fr_auto_auto_auto_auto] gap-x-4 border-b border-zinc-100 bg-zinc-50 px-5 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/50 sm:grid">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Tenant</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Apartment</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Base</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Overage</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Total</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Status</span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} now={now} tx={tx} />
              ))}
            </div>

            {/* Totals footer */}
            <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-5 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Total · {transactions.length} transactions
              </span>
              <span className="text-sm font-bold tabular-nums">
                {eur(transactions.reduce((s, t) => s + t.amountCents + t.overdueFeeCents, 0))}
              </span>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
