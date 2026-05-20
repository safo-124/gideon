import { getRequestByApprovalToken } from "@/app/request/_lib/data";
import { approveResidentAccess, denyResidentAccess } from "../actions";
import { ThemeToggle } from "@/app/components/theme-toggle";

export const metadata = { title: "Resident approval — Key Recovery" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function centsToEur(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

const dtFmt = new Intl.DateTimeFormat("en-FI", {
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  day: "numeric",
});

const reasonLabels: Record<string, string> = {
  caregiver: "Family or caregiver access",
  locked_out: "Resident is locked out",
  other: "Other approved reason",
  resident_asked: "Resident asked me to help",
};

function StatusCard({
  children,
  tone = "zinc",
  title,
}: {
  children: React.ReactNode;
  tone?: "teal" | "red" | "zinc";
  title: string;
}) {
  const toneClass = {
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300",
    teal: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/70 dark:bg-teal-950/30 dark:text-teal-300",
    zinc: "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300",
  }[tone];

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6">
      <div className="mx-auto flex w-full max-w-md justify-end">
        <ThemeToggle />
      </div>
      <section className={`tenant-dashboard-card mx-auto mt-8 max-w-md rounded-lg border p-5 shadow-sm ${toneClass}`}>
        <h1 className="text-lg font-semibold">{title}</h1>
        <div className="mt-2 text-sm leading-6">{children}</div>
      </section>
    </main>
  );
}

export default async function ResidentApprovalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: SearchParams;
}) {
  const { token } = await params;
  const qp = await searchParams;
  const approved = firstParam(qp.approved) === "1";
  const denied = firstParam(qp.denied) === "1";
  const expired = firstParam(qp.expired) === "1";
  const error = firstParam(qp.error);

  const request = await getRequestByApprovalToken(token);

  if (!request) {
    return (
      <StatusCard title="Invalid approval link">
        This approval link is invalid or has already been removed.
      </StatusCard>
    );
  }

  const aptLabel = `${request.apartment.block.name} / Apt ${request.apartment.number}`;
  const reason = request.requestReason ? reasonLabels[request.requestReason] ?? request.requestReason : "Resident-assisted access";
  const approvalExpired = request.approvalExpiresAt ? new Date() > request.approvalExpiresAt : false;

  if (approved || request.status === "AWAITING_PAYMENT") {
    return (
      <StatusCard title="Request approved" tone="teal">
        The requester can now continue to payment. They will not receive a cabinet code until payment is complete.
      </StatusCard>
    );
  }

  if (denied || request.status === "DISPUTED") {
    return (
      <StatusCard title="Request denied" tone="red">
        The request for {aptLabel} has been blocked. No payment or cabinet code will be released.
      </StatusCard>
    );
  }

  if (expired || approvalExpired || request.status === "CANCELLED") {
    return (
      <StatusCard title="Approval window closed">
        This approval link is no longer active. The requester will need to start a new request.
      </StatusCard>
    );
  }

  if (request.status !== "PENDING_AUTH") {
    return (
      <StatusCard title="No approval needed">
        This request is no longer waiting for resident approval.
      </StatusCard>
    );
  }

  const expiresAt = request.approvalExpiresAt ? dtFmt.format(request.approvalExpiresAt) : "Soon";

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-5 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl justify-end">
        <ThemeToggle />
      </div>

      <section className="tenant-dashboard-card mx-auto mt-8 max-w-3xl rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">Resident approval</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Approve or deny spare key access</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Only approve if you asked this person to help you. The requester cannot pay or receive a cabinet code unless you approve.
        </p>

        {error && (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Apartment</span>
            <span className="text-right text-sm font-medium">{aptLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Requested by</span>
            <span className="text-right text-sm font-medium">{request.requester.fullName}</span>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Reason</span>
            <span className="text-right text-sm font-medium">{reason}</span>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Fee paid by requester</span>
            <span className="text-right text-sm font-bold">{centsToEur(request.amountCents)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Approval expires</span>
            <span className="text-right text-sm font-semibold text-amber-700 dark:text-amber-300">{expiresAt}</span>
          </div>
        </div>

        <form className="mt-6 grid gap-4">
          <input name="token" type="hidden" value={token} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">6-digit code</span>
            <input
              autoComplete="one-time-code"
              className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-center text-xl font-semibold tracking-[0.3em] outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              inputMode="numeric"
              maxLength={6}
              name="code"
              pattern="[0-9]{6}"
              placeholder="000000"
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className="inline-flex h-11 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/70 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950/30"
              formAction={denyResidentAccess}
              type="submit"
            >
              Deny request
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
              formAction={approveResidentAccess}
              type="submit"
            >
              Approve request
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
