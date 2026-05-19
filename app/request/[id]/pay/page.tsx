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
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6 sm:py-12">
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

      <div className="mt-8 space-y-3">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Card details</span>
          </div>

          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-500">Card number</span>
              <input
                className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-base text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
                defaultValue="4242 4242 4242 4242"
                disabled
                type="text"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-500">Expiry</span>
                <input
                  className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-base text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
                  defaultValue="12/26"
                  disabled
                  type="text"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-zinc-500">CVC</span>
                <input
                  className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-base text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
                  defaultValue="•••"
                  disabled
                  type="text"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <span className="text-sm text-zinc-500">Total due</span>
            <span className="text-xl font-bold">€20.00</span>
          </div>
        </div>

        <form action={payRequest}>
          <input name="id" type="hidden" value={request.id} />
          <SubmitButton
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-base font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            pendingText="Processing payment…"
          >
            Pay €20.00
          </SubmitButton>
        </form>

        <form action={cancelRequest}>
          <input name="id" type="hidden" value={request.id} />
          <SubmitButton
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-base font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            pendingText="Cancelling…"
          >
            Cancel request
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
