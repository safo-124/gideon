import { updateSettings } from "../../actions";
import {
  FieldLabel,
  Flash,
  PageHeader,
  buttonClass,
  firstParam,
  inputClass,
  type AdminSearchParams,
} from "../../_components/ui";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Settings - Admin" };

function eurInput(key: string, label: string, valueCents: number, hint?: string) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500">€</span>
        <input
          className={inputClass}
          defaultValue={(valueCents / 100).toFixed(2)}
          min="0"
          name={key}
          required
          step="0.01"
          type="number"
        />
      </div>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

function intInput(key: string, label: string, value: number, unit: string, hint?: string) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          className={inputClass}
          defaultValue={value}
          min="1"
          name={key}
          required
          step="1"
          type="number"
        />
        <span className="shrink-0 text-sm text-zinc-500">{unit}</span>
      </div>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const params = await searchParams;
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        description="Configure fees and timing rules. Changes apply to new requests immediately."
        eyebrow="Configuration"
        title="Settings"
      />

      <Flash error={firstParam(params.error)} notice={firstParam(params.notice)} />

      <form action={updateSettings} className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-semibold">Fees</h2>
          <div className="grid gap-4">
            {eurInput(
              "base_fee_cents",
              "Spare key fee",
              settings.base_fee_cents,
              "Charged per request. Applied to both self and for-other flows.",
            )}
            {eurInput(
              "overage_fee_cents_per_hour",
              "Overage per hour",
              settings.overage_fee_cents_per_hour,
              "Charged for each hour (or part) the key is held past the deadline.",
            )}
            {eurInput(
              "lost_key_fee_cents",
              "Lost key fee",
              settings.lost_key_fee_cents,
              "Applied when admin marks a key as lost. Shown on the Requests page.",
            )}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-semibold">Time windows</h2>
          <div className="grid gap-4">
            {intInput(
              "hold_hours",
              "Key hold time",
              settings.hold_hours,
              "hours",
              "How long a tenant can keep the key before overage begins.",
            )}
            {intInput(
              "dispute_window_minutes",
              "Dispute window",
              settings.dispute_window_minutes,
              "minutes",
              "How long the apartment owner has to dispute a for-other request after payment.",
            )}
          </div>
        </section>

        <div className="lg:col-span-2">
          <button className={buttonClass} type="submit">
            Save settings
          </button>
        </div>
      </form>
    </>
  );
}
