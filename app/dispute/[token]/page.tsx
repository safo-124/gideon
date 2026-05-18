import { getRequestByDisputeToken } from "@/app/request/_lib/data";
import { disputeKeyRequest } from "../actions";

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
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16 text-center">
        <div className="text-zinc-400">This dispute link is invalid or has already been used.</div>
      </main>
    );
  }

  const now = new Date();
  const windowEnded = request.disputeWindowEndsAt ? now > request.disputeWindowEndsAt : false;
  const aptLabel = `${request.apartment.block.name} / Apt ${request.apartment.number}`;

  if (disputed || request.status === "DISPUTED") {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-900/70 dark:bg-red-950/20">
          <div className="text-lg font-semibold text-red-700 dark:text-red-300">
            Dispute recorded
          </div>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            The key request for {aptLabel} has been flagged as unauthorized. The key has been blocked.
          </p>
          <p className="mt-4 text-xs text-red-500">
            If you have concerns, contact building management directly.
          </p>
        </div>
      </main>
    );
  }

  if (expired || windowEnded) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-lg font-semibold">Dispute window closed</div>
          <p className="mt-2 text-sm text-zinc-500">
            The 30-minute window to dispute the key request for {aptLabel} has passed.
          </p>
        </div>
      </main>
    );
  }

  if (request.status !== "PAID") {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-base font-semibold">Nothing to dispute</div>
          <p className="mt-2 text-sm text-zinc-500">
            This key request is no longer active.
          </p>
        </div>
      </main>
    );
  }

  const windowEnd = request.disputeWindowEndsAt ? dtFmt.format(request.disputeWindowEndsAt) : null;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
          Resident notification
        </div>
        <h1 className="text-lg font-semibold">Spare key requested for your apartment</h1>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Apartment</span>
            <span className="font-medium">{aptLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Requested by</span>
            <span className="font-medium">{request.requester.fullName}</span>
          </div>
          {windowEnd && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Dispute by</span>
              <span className="font-medium">{windowEnd}</span>
            </div>
          )}
        </div>

        <p className="mt-4 text-sm text-zinc-500">
          If you did not authorize this request, click below to block the key immediately.
        </p>

        <form action={disputeKeyRequest} className="mt-5">
          <input name="token" type="hidden" value={token} />
          <button
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-900/70 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950/30"
            type="submit"
          >
            Dispute this request
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-400">
          If you authorized this request, no action is needed. The window closes at {windowEnd}.
        </p>
      </div>
    </main>
  );
}
