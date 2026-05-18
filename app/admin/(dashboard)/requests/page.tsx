import Link from "next/link";
import { adminCancelRequest, adminMarkLost, adminMarkReturned } from "../../actions";
import {
  DeleteForm,
  EmptyState,
  FieldLabel,
  Flash,
  PageHeader,
  Pill,
  ReturnTo,
  StatCard,
  dangerButtonClass,
  firstParam,
  subtleButtonClass,
  type AdminSearchParams,
} from "../../_components/ui";
import { getRequests, getRequestStats } from "../../_lib/data";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Requests - Admin" };

const RETURN_TO = "/admin/requests";

const dtFmt = new Intl.DateTimeFormat("en-FI", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function centsToEur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

const STATUS_LABELS: Record<string, { label: string; tone: "zinc" | "teal" | "amber" | "red" }> = {
  PENDING_AUTH: { label: "Pending auth", tone: "amber" },
  AWAITING_PAYMENT: { label: "Awaiting payment", tone: "zinc" },
  PAID: { label: "Paid — awaiting pickup", tone: "teal" },
  PICKED_UP: { label: "Picked up", tone: "amber" },
  RETURNED: { label: "Returned", tone: "zinc" },
  CANCELLED: { label: "Cancelled", tone: "zinc" },
  DISPUTED: { label: "Disputed", tone: "red" },
};

const FILTERS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
];

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const params = await searchParams;
  const filter = firstParam(params.filter) ?? "";
  const notice = firstParam(params.notice);
  const error = firstParam(params.error);

  const [requests, stats, settings] = await Promise.all([
    getRequests(filter),
    getRequestStats(),
    getSettings(),
  ]);

  const now = new Date();

  return (
    <>
      <PageHeader
        description="Track every key request from creation through return or dispute."
        eyebrow="Operations"
        title="Requests"
      />

      <Flash error={error} notice={notice} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard helper="All time" label="Total" tone="zinc" value={stats.total} />
        <StatCard helper="In progress" label="Active" tone="teal" value={stats.active} />
        <StatCard helper="Past due time" label="Overdue" tone={stats.overdue > 0 ? "red" : "zinc"} value={stats.overdue} />
        <StatCard helper="Owner disputed" label="Disputed" tone={stats.disputed > 0 ? "red" : "zinc"} value={stats.disputed} />
      </div>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition ${
              filter === f.value
                ? "bg-teal-700 text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
            href={f.value ? `/admin/requests?filter=${f.value}` : "/admin/requests"}
            key={f.value}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState>No requests found.</EmptyState>
      ) : (
        <div className="grid gap-3">
          {requests.map((req) => {
            const status = STATUS_LABELS[req.status] ?? { label: req.status, tone: "zinc" as const };
            const isOverdue = req.status === "PICKED_UP" && req.dueAt && now > req.dueAt;
            const overdueTone = isOverdue ? "red" : status.tone;
            const overduePill = isOverdue
              ? { label: "Overdue", tone: "red" as const }
              : null;

            const hoursOver =
              isOverdue && req.dueAt
                ? Math.max(0, (now.getTime() - req.dueAt.getTime()) / 3_600_000)
                : 0;

            return (
              <div
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                key={req.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={overdueTone}>{overduePill?.label ?? status.label}</Pill>
                      <Pill tone="zinc">{req.type === "FOR_OTHER" ? "For someone" : "Self"}</Pill>
                    </div>
                    <div className="mt-2 text-sm font-semibold">
                      {req.requester.fullName}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">{req.requester.email}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-zinc-500">Request #{req.id}</div>
                    <div className="mt-1 text-xs text-zinc-400">{dtFmt.format(req.createdAt)}</div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <FieldLabel>Apartment</FieldLabel>
                    <div className="font-medium">
                      {req.apartment.block.name} / Apt {req.apartment.number}
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Key / Cabinet</FieldLabel>
                    {req.key ? (
                      <div>
                        <span className="font-medium">{req.key.code}</span>
                        <span className="ml-1.5 text-zinc-500">cab #{req.key.cabinet.number}</span>
                      </div>
                    ) : (
                      <div className="text-zinc-400">Not yet assigned</div>
                    )}
                  </div>

                  <div>
                    <FieldLabel>Amount</FieldLabel>
                    <div>
                      <span className="font-medium">{centsToEur(req.amountCents)}</span>
                      {req.overdueFeeCents > 0 && (
                        <span className="ml-1.5 text-red-600 dark:text-red-400">
                          +{centsToEur(req.overdueFeeCents)} overage
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <FieldLabel>
                      {req.status === "PICKED_UP" ? "Due" : req.status === "RETURNED" ? "Returned" : "Paid"}
                    </FieldLabel>
                    <div className={isOverdue ? "font-medium text-red-600 dark:text-red-400" : ""}>
                      {req.status === "PICKED_UP" && req.dueAt
                        ? dtFmt.format(req.dueAt)
                        : req.status === "RETURNED" && req.returnedAt
                          ? dtFmt.format(req.returnedAt)
                          : req.paidAt
                            ? dtFmt.format(req.paidAt)
                            : "—"}
                    </div>
                    {isOverdue && (
                      <div className="text-xs text-red-500">
                        {Math.floor(hoursOver)}h {Math.round((hoursOver % 1) * 60)}m over
                      </div>
                    )}
                  </div>
                </div>

                {(req.status === "AWAITING_PAYMENT" ||
                  req.status === "PAID" ||
                  req.status === "PICKED_UP") && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    {req.status === "PICKED_UP" && (
                      <>
                        <form action={adminMarkReturned}>
                          <ReturnTo value={RETURN_TO} />
                          <input name="id" type="hidden" value={req.id} />
                          <button className={subtleButtonClass} type="submit">
                            Mark returned
                          </button>
                        </form>
                        <form action={adminMarkLost}>
                          <ReturnTo value={RETURN_TO} />
                          <input name="id" type="hidden" value={req.id} />
                          <input name="lostFeeCents" type="hidden" value={settings.lost_key_fee_cents} />
                          <button className={dangerButtonClass} type="submit">
                            Mark lost ({centsToEur(settings.lost_key_fee_cents)})
                          </button>
                        </form>
                      </>
                    )}
                    {(req.status === "AWAITING_PAYMENT" || req.status === "PAID") && (
                      <form action={adminCancelRequest}>
                        <ReturnTo value={RETURN_TO} />
                        <input name="id" type="hidden" value={req.id} />
                        <button className={dangerButtonClass} type="submit">
                          Cancel request
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
