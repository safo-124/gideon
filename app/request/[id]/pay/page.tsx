import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTenant } from "@/lib/auth";
import { getRequest } from "../../_lib/data";
import { cancelRequest, payRequest } from "../../actions";
import { SubmitButton } from "@/app/components/submit-button";

export const metadata = { title: "Payment — Key Recovery" };

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await requireTenant();
  const request = await getRequest(Number(id), tenant.id);

  if (!request || request.status !== "AWAITING_PAYMENT") redirect("/");

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <Link
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        href="/"
      >
        ← Back
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Payment</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Spare key for {request.apartment.block.name} / Apt {request.apartment.number}
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-5 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Card details
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-zinc-500">Card number</span>
              <input
                className="h-10 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
                defaultValue="4242 4242 4242 4242"
                disabled
                type="text"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-zinc-500">Expiry</span>
                <input
                  className="h-10 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
                  defaultValue="12/26"
                  disabled
                  type="text"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-zinc-500">CVC</span>
                <input
                  className="h-10 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
                  defaultValue="•••"
                  disabled
                  type="text"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 h-px bg-zinc-100 dark:bg-zinc-800" />

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-zinc-500">Total due</span>
            <span className="text-base font-semibold">€20.00</span>
          </div>
        </div>

        <form action={payRequest}>
          <input name="id" type="hidden" value={request.id} />
          <SubmitButton
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed"
            pendingText="Processing payment…"
          >
            Pay €20.00
          </SubmitButton>
        </form>

        <form action={cancelRequest}>
          <input name="id" type="hidden" value={request.id} />
          <SubmitButton
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
            pendingText="Cancelling…"
          >
            Cancel request
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
