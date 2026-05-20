import type { ReactNode } from "react";
import Link from "next/link";
import { requireTenant } from "@/lib/auth";
import { getSettings, type SettingsMap } from "@/lib/settings";
import { getActiveRequest, getPastRequests, type ActiveRequest, type PastRequest } from "./request/_lib/data";
import { logout } from "./login/actions";
import { cancelRequest, markPickedUp, returnKey } from "./request/actions";
import { KeyDoorAnimation } from "./components/key-door-animation";
import { SubmitButton } from "./components/submit-button";
import { ThemeToggle } from "./components/theme-toggle";

export const metadata = { title: "Key Recovery" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type ActiveRequestRecord = NonNullable<ActiveRequest>;

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

const REQUEST_REASON_LABELS: Record<string, string> = {
  caregiver: "Family or caregiver access",
  locked_out: "Resident is locked out",
  other: "Other approved reason",
  resident_asked: "Resident asked me to help",
};

function activeStatusCopy(request: ActiveRequestRecord | null, now: Date) {
  if (!request) {
    return {
      label: "No active request",
      title: "Request access without waiting at the office.",
      detail: "Start a spare key handoff for your apartment or help another resident with approval.",
      tone: "teal",
    };
  }

  if (request.status === "PENDING_AUTH") {
    return {
      label: "Resident approval needed",
      title: "Waiting for the resident to approve.",
      detail: "We sent the resident an approval link and 6-digit code. Payment opens after they approve.",
      tone: "amber",
    };
  }

  if (request.status === "AWAITING_PAYMENT") {
    return {
      label: "Payment needed",
      title: "Your request is waiting for payment.",
      detail: "Complete payment now so the spare key can be reserved for pickup.",
      tone: "amber",
    };
  }

  if (request.status === "PAID") {
    return {
      label: "Ready for pickup",
      title: "Your cabinet code is ready.",
      detail: "Collect the key, confirm pickup, and keep the return window in view.",
      tone: "teal",
    };
  }

  if (request.status === "PICKED_UP" && request.dueAt) {
    const isOverdue = overdueHours(request.dueAt, now) > 0;
    return {
      label: isOverdue ? "Return overdue" : "Key checked out",
      title: isOverdue ? "Return the spare key now." : "You have the spare key.",
      detail: isOverdue
        ? "Overage is being estimated until the key is returned."
        : `Return it by ${dtFmt.format(request.dueAt)} to avoid extra fees.`,
      tone: isOverdue ? "red" : "amber",
    };
  }

  return {
    label: "Request active",
    title: "Your key handoff is in motion.",
    detail: "Follow the current action below to keep the request moving.",
    tone: "zinc",
  };
}

function toneClasses(tone: string) {
  const map = {
    amber: {
      badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300",
      dot: "bg-amber-500",
      soft: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    },
    red: {
      badge: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300",
      dot: "bg-red-500",
      soft: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
    },
    teal: {
      badge: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/70 dark:bg-teal-950/30 dark:text-teal-300",
      dot: "bg-teal-600",
      soft: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300",
    },
    zinc: {
      badge: "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
      dot: "bg-zinc-500",
      soft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    },
  } as const;

  return map[(tone as keyof typeof map) || "zinc"] ?? map.zinc;
}

function IconShell({ children, tone = "teal" }: { children: ReactNode; tone?: "teal" | "amber" | "zinc" }) {
  const color = {
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    teal: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300",
    zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  }[tone];

  return <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${color}`}>{children}</div>;
}

function KeyIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path
        d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.03 5.91c-.56-.1-1.16.03-1.56.43l-2.66 2.66H8.25v2.25H6v2.25H2.25v-2.82c0-.6.24-1.17.66-1.59l6.5-6.5c.4-.4.53-1 .43-1.56A6 6 0 0 1 21.75 8.25Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path
        d="M15 19.13a9.4 9.4 0 0 0 2.63.37 9.34 9.34 0 0 0 4.12-.95 4.13 4.13 0 0 0-7.54-2.5M15 19.13v.1A12.32 12.32 0 0 1 8.62 21a12.32 12.32 0 0 1-6.37-1.77v-.1a6.38 6.38 0 0 1 11.96-3.08M12 6.38a3.38 3.38 0 1 1-6.75 0 3.38 3.38 0 0 1 6.75 0Zm8.25 2.25a2.63 2.63 0 1 1-5.25 0 2.63 2.63 0 0 1 5.25 0Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path d="M12 6v6l3.75 2.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path
        d="M12 3.75 5.25 6v5.25c0 4.2 2.82 8.12 6.75 9.38 3.93-1.26 6.75-5.18 6.75-9.38V6L12 3.75Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m9.75 12 1.5 1.5 3.25-3.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AccessSummary({
  activeRequest,
  firstName,
  now,
  settings,
}: {
  activeRequest: ActiveRequestRecord | null;
  firstName: string;
  now: Date;
  settings: SettingsMap;
}) {
  const copy = activeStatusCopy(activeRequest, now);
  const tone = toneClasses(copy.tone);

  return (
    <section className="tenant-dashboard-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>
            <span className={`dashboard-status-dot h-2 w-2 rounded-full ${tone.dot}`} />
            {copy.label}
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
            {copy.title}
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            {firstName}, {copy.detail}
          </p>
        </div>
        <KeyDoorAnimation className="self-start" tone="teal" />
      </div>

      <div className="mt-6 grid overflow-hidden rounded-lg border border-zinc-200 text-sm dark:border-zinc-800 sm:grid-cols-3">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:border-b-0 sm:border-r">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Base fee</div>
          <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">{centsToEur(settings.base_fee_cents)}</div>
        </div>
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:border-b-0 sm:border-r">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Return window</div>
          <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">{settings.hold_hours} hours</div>
        </div>
        <div className="px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Overage</div>
          <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
            {centsToEur(settings.overage_fee_cents_per_hour)}/hr
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoPanel({
  apartmentLabel,
  address,
  activeRequest,
  now,
}: {
  apartmentLabel: string;
  address: string;
  activeRequest: ActiveRequestRecord | null;
  now: Date;
}) {
  return (
    <aside className="tenant-dashboard-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Residence</div>
          <div className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">{apartmentLabel}</div>
          <div className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-400">{address}</div>
        </div>
        <IconShell tone="zinc">
          <ShieldIcon />
        </IconShell>
      </div>

      <div className="mt-5 space-y-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-500 dark:text-zinc-400">Request status</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {activeRequest ? activeStatusCopy(activeRequest, now).label : "Available"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-500 dark:text-zinc-400">Support</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Building manager</span>
        </div>
      </div>
    </aside>
  );
}

function RequestPanel({ request, now }: { request: ActiveRequestRecord; now: Date }) {
  const { id, status, apartment, key } = request;
  const aptLabel = `${apartment.block.name} / Apt ${apartment.number}`;
  const reason = request.requestReason ? REQUEST_REASON_LABELS[request.requestReason] ?? request.requestReason : null;

  if (status === "PENDING_AUTH") {
    return (
      <section className="tenant-dashboard-card overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm dark:border-amber-900/60 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-4 border-b border-amber-100 bg-amber-50 px-5 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Waiting for resident approval</span>
          {request.approvalExpiresAt && (
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-zinc-900 dark:text-amber-300">
              Expires {dtFmt.format(request.approvalExpiresAt)}
            </span>
          )}
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{aptLabel}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                The resident must approve with their 6-digit code before you can pay or receive a cabinet code.
              </p>
            </div>
            <IconShell tone="amber">
              <ShieldIcon />
            </IconShell>
          </div>

          <div className="mt-5 grid gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Reason</div>
              <div className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{reason ?? "Resident-assisted access"}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Payment</div>
              <div className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">Locked until approved</div>
            </div>
          </div>

          <form action={cancelRequest} className="mt-5">
            <input name="id" type="hidden" value={id} />
            <SubmitButton
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
              pendingText="Cancelling..."
            >
              Cancel request
            </SubmitButton>
          </form>
        </div>
      </section>
    );
  }

  if (status === "AWAITING_PAYMENT") {
    return (
      <section className="tenant-dashboard-card overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm dark:border-amber-900/60 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-4 border-b border-amber-100 bg-amber-50 px-5 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Pending payment</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-zinc-900 dark:text-amber-300">
            {centsToEur(request.amountCents)} due
          </span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{aptLabel}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Payment confirms the cabinet reservation.</p>
            </div>
            <IconShell tone="amber">
              <ClockIcon />
            </IconShell>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800"
              href={`/request/${id}/pay`}
            >
              Continue to payment
            </Link>
            <form action={cancelRequest} className="flex-1">
              <input name="id" type="hidden" value={id} />
              <SubmitButton
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                pendingText="Cancelling..."
              >
                Cancel
              </SubmitButton>
            </form>
          </div>
        </div>
      </section>
    );
  }

  if (status === "PAID" && key) {
    return (
      <section className="tenant-dashboard-card overflow-hidden rounded-lg border border-teal-200 bg-white shadow-sm dark:border-teal-900/60 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-4 border-b border-teal-100 bg-teal-50 px-5 py-3 dark:border-teal-900/50 dark:bg-teal-950/20">
          <span className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">Ready for pickup</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-zinc-900 dark:text-teal-300">Reserved</span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{aptLabel}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {request.type === "FOR_OTHER"
                  ? "Pick up the key and pass it to the approved resident."
                  : "Pick up the key and confirm when it is in your hand."}
              </p>
            </div>
            <IconShell>
              <KeyIcon />
            </IconShell>
          </div>

          <div className="mt-5 grid overflow-hidden rounded-lg border border-teal-100 dark:border-teal-900/40 sm:grid-cols-2">
            <div className="border-b border-teal-100 px-5 py-4 dark:border-teal-900/40 sm:border-b-0 sm:border-r">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Cabinet</div>
              <div className="mt-1 text-3xl font-bold tabular-nums text-zinc-950 dark:text-zinc-50">{key.cabinet.number}</div>
            </div>
            <div className="px-5 py-4">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Code</div>
              <div className="mt-1 text-3xl font-bold tabular-nums tracking-[0.14em] text-zinc-950 dark:text-zinc-50">{key.cabinet.currentCode}</div>
            </div>
          </div>

          <form action={markPickedUp} className="mt-5">
            <input name="id" type="hidden" value={id} />
            <SubmitButton
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              pendingText="Confirming..."
            >
              I picked it up
            </SubmitButton>
          </form>
        </div>
      </section>
    );
  }

  if (status === "PICKED_UP" && request.dueAt && key) {
    const hoursOver = overdueHours(request.dueAt, now);
    const isOverdue = hoursOver > 0;
    const estimatedFee = Math.ceil(hoursOver) * 500;
    const border = isOverdue ? "border-red-200 dark:border-red-900/60" : "border-amber-200 dark:border-amber-900/60";
    const band = isOverdue
      ? "border-red-100 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300"
      : "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300";

    return (
      <section className={`tenant-dashboard-card overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-zinc-950 ${border}`}>
        <div className={`flex items-center justify-between gap-4 border-b px-5 py-3 ${band}`}>
          <span className="text-xs font-semibold uppercase tracking-wide">
            {isOverdue ? "Overdue - return now" : "Key checked out"}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold dark:bg-zinc-900">
            {isOverdue ? centsToEur(estimatedFee) : dtFmt.format(request.dueAt)}
          </span>
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{aptLabel}</h2>
              {isOverdue ? (
                <p className="mt-1 text-sm font-medium text-red-700 dark:text-red-300">
                  Overdue by {Math.floor(hoursOver)}h {Math.round((hoursOver % 1) * 60)}m.
                </p>
              ) : (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Return by <span className="font-semibold text-zinc-900 dark:text-zinc-100">{dtFmt.format(request.dueAt)}</span>.
                </p>
              )}
            </div>
            <IconShell tone={isOverdue ? "amber" : "zinc"}>
              <ClockIcon />
            </IconShell>
          </div>

          <div className="mt-5 grid overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 sm:grid-cols-2">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:border-b-0 sm:border-r">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Cabinet</div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-950 dark:text-zinc-50">{key.cabinet.number}</div>
            </div>
            <div className="px-5 py-4">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">Code</div>
              <div className="mt-1 text-2xl font-bold tabular-nums tracking-[0.14em] text-zinc-950 dark:text-zinc-50">{key.cabinet.currentCode}</div>
            </div>
          </div>

          <form action={returnKey} className="mt-5">
            <input name="id" type="hidden" value={id} />
            <SubmitButton
              className={`inline-flex h-11 w-full items-center justify-center rounded-md px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isOverdue ? "bg-red-600 hover:bg-red-700" : "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              }`}
              pendingText="Returning..."
            >
              Return key
            </SubmitButton>
          </form>
        </div>
      </section>
    );
  }

  return null;
}

function ActionCard({
  description,
  href,
  icon,
  meta,
  title,
}: {
  description: string;
  href: string;
  icon: ReactNode;
  meta: string;
  title: string;
}) {
  return (
    <Link
      className="tenant-dashboard-card group rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-teal-700"
      href={href}
    >
      <div className="flex items-start justify-between gap-4">
        <IconShell>{icon}</IconShell>
        <span className="mt-2 text-sm font-semibold text-teal-700 transition group-hover:translate-x-0.5 dark:text-teal-300">→</span>
      </div>
      <div className="mt-5 text-base font-semibold text-zinc-950 dark:text-zinc-50">{title}</div>
      <p className="mt-1.5 min-h-10 text-sm leading-5 text-zinc-500 dark:text-zinc-400">{description}</p>
      <div className="mt-5 border-t border-zinc-100 pt-3 text-xs font-medium text-zinc-400 dark:border-zinc-800">{meta}</div>
    </Link>
  );
}

function ActionGrid({ settings }: { settings: SettingsMap }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <ActionCard
        description="Get temporary access to your apartment."
        href="/request/new"
        icon={<KeyIcon />}
        meta={`${centsToEur(settings.base_fee_cents)} · ${settings.hold_hours}-hour hold`}
        title="Request spare key"
      />
      <ActionCard
        description="Request a spare key on behalf of another resident."
        href="/request/for-someone"
        icon={<PeopleIcon />}
        meta="Resident approval required"
        title="Request for someone"
      />
    </section>
  );
}

const STATUS_STYLE: Record<string, string> = {
  RETURNED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  CANCELLED: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
  DISPUTED: "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300",
};

const STATUS_LABEL: Record<string, string> = {
  RETURNED: "Returned",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};

function HistorySection({ requests }: { requests: PastRequest[] }) {
  return (
    <section className="tenant-dashboard-card rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Recent activity</h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{requests.length} completed request{requests.length === 1 ? "" : "s"}</p>
        </div>
        <IconShell tone="zinc">
          <ClockIcon />
        </IconShell>
      </div>

      {requests.length === 0 ? (
        <div className="px-5 py-8 text-sm text-zinc-500 dark:text-zinc-400">No completed key requests yet.</div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {requests.map((req) => {
            const aptLabel = `${req.apartment.block.name} / Apt ${req.apartment.number}`;
            const date = req.returnedAt ?? req.cancelledAt ?? req.createdAt;
            const statusClass = STATUS_STYLE[req.status] ?? "bg-zinc-100 text-zinc-500";
            const label = STATUS_LABEL[req.status] ?? req.status;
            const total = req.amountCents + req.overdueFeeCents;

            return (
              <div className="flex items-center justify-between gap-4 px-5 py-4" key={req.id}>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{aptLabel}</div>
                  <div className="mt-0.5 text-xs text-zinc-400">
                    {req.type === "FOR_OTHER" ? "For someone · " : ""}
                    {shortFmt.format(date)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {req.overdueFeeCents > 0 && <span className="text-xs font-medium text-red-500">{centsToEur(total)}</span>}
                  {req.overdueFeeCents === 0 && req.status === "RETURNED" && (
                    <span className="text-xs text-zinc-400">{centsToEur(req.amountCents)}</span>
                  )}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SupportPanel() {
  return (
    <section className="tenant-dashboard-card rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start gap-3">
        <IconShell tone="amber">
          <ShieldIcon />
        </IconShell>
        <div>
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Building support</h2>
          <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-400">For urgent lockouts, contact the building manager before starting a new request.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-500 dark:text-zinc-400">Cabinet code</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Private</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-500 dark:text-zinc-400">After return</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Mark complete</span>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const error = firstParam(params.error);

  const tenant = await requireTenant();
  const [activeRequest, pastRequests, settings] = await Promise.all([
    getActiveRequest(tenant.id),
    getPastRequests(tenant.id),
    getSettings(),
  ]);
  const now = new Date();

  const firstName = tenant.fullName.split(" ")[0];
  const initials = tenant.fullName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();
  const apartmentLabel = `${tenant.apartment.block.name} / Apt ${tenant.apartment.number}`;
  const address = `${tenant.apartment.block.streetName} ${tenant.apartment.block.zip}`;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 pb-24 sm:px-6 sm:py-8 sm:pb-10 lg:px-8">
        <header className="tenant-dashboard-enter flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white shadow-sm dark:bg-teal-500 dark:text-zinc-950">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">Key Recovery</p>
              <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
                Welcome, {firstName}
              </h1>
              <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                {apartmentLabel} · {address}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ThemeToggle />
            <form action={logout}>
              <SubmitButton
                className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-50"
                pendingText="..."
              >
                Sign out
              </SubmitButton>
            </form>
          </div>
        </header>

        {error && (
          <div className="tenant-dashboard-card rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
          <AccessSummary activeRequest={activeRequest} firstName={firstName} now={now} settings={settings} />
          <InfoPanel activeRequest={activeRequest} address={address} apartmentLabel={apartmentLabel} now={now} />
        </div>

        {activeRequest ? <RequestPanel now={now} request={activeRequest} /> : <ActionGrid settings={settings} />}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
          <HistorySection requests={pastRequests} />
          <SupportPanel />
        </div>
      </div>

      {!activeRequest && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 sm:hidden">
          <Link
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm"
            href="/request/new"
          >
            Request spare key
          </Link>
        </div>
      )}
    </main>
  );
}
