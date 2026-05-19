import { getRequestByDisputeToken } from "@/app/request/_lib/data";
import { disputeKeyRequest } from "../actions";
import { SubmitButton } from "@/app/components/submit-button";

export const metadata = { title: "Key request dispute — Key Recovery" };

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

export default async function DisputePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: SearchParams;
}) {
  const { token } = await params;
  const qp = await searchParams;
  const disputed = firstParam(qp.disputed) === "1";
  const expired = firstParam(qp.expired) === "1";

  const request = await getRequestByDisputeToken(token);

  if (!request) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <p className="text-center text-sm text-zinc-400">
          This dispute link is invalid or has already been used.
        </p>
      </main>
    );
  }

  const now = new Date();
  const windowEnded = request.disputeWindowEndsAt ? now > request.disputeWindowEndsAt : false;
  const aptLabel = `${request.apartment.block.name} / Apt ${request.apartment.number}`;

  if (disputed || request.status === "DISPUTED") {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-red-200 bg-red-50 shadow-sm dark:border-red-900/70 dark:bg-red-950/20">
          <div className="border-b border-red-100 bg-red-100/70 px-6 py-3 dark:border-red-900/50 dark:bg-red-950/40">
            <span className="text-xs font-semibold uppercase tracking-widest text-red-700 dark:text-red-400">
              Dispute recorded
            </span>
          </div>
          <div className="p-6 text-center">
            <div className="text-lg font-semibold text-red-700 dark:text-red-300">Key blocked</div>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              The key request for {aptLabel} has been flagged as unauthorized and blocked.
            </p>
            <p className="mt-4 text-xs text-red-500">
              If you have concerns, contact building management directly.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (expired || windowEnded) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-6 py-3 dark:border-zinc-800">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Window closed
            </span>
          </div>
          <div className="p-6 text-center">
            <div className="text-lg font-semibold">Dispute window closed</div>
            <p className="mt-2 text-sm text-zinc-500">
              The 30-minute window to dispute the key request for {aptLabel} has passed.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (request.status !== "PAID") {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-6 text-center">
            <div className="text-base font-semibold">Nothing to dispute</div>
            <p className="mt-2 text-sm text-zinc-500">This key request is no longer active.</p>
          </div>
        </div>
      </main>
    );
  }

  const windowEnd = request.disputeWindowEndsAt ? dtFmt.format(request.disputeWindowEndsAt) : null;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-amber-100 bg-amber-50 px-6 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Resident notification
          </span>
        </div>

        <div className="p-6">
          <h1 className="text-lg font-semibold">Spare key requested for your apartment</h1>

          <div className="mt-5 divide-y divide-zinc-100 dark:divide-zinc-800">
            <div className="flex items-center justify-between gap-4 py-2.5">
              <span className="text-sm text-zinc-500">Apartment</span>
              <span className="text-sm font-medium">{aptLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2.5">
              <span className="text-sm text-zinc-500">Requested by</span>
              <span className="text-sm font-medium">{request.requester.fullName}</span>
            </div>
            {windowEnd && (
              <div className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-sm text-zinc-500">Dispute by</span>
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{windowEnd}</span>
              </div>
            )}
          </div>

          <p className="mt-5 text-sm text-zinc-500">
            If you did not authorize this request, tap below to block the key immediately.
          </p>

          <form action={disputeKeyRequest} className="mt-4">
            <input name="token" type="hidden" value={token} />
            <SubmitButton
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-red-200 bg-white px-5 text-base font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/70 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/30"
              pendingText="Blocking key…"
            >
              Dispute this request
            </SubmitButton>
          </form>

          {windowEnd && (
            <p className="mt-4 text-center text-xs text-zinc-400">
              If you authorized this, no action needed. Window closes at {windowEnd}.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
