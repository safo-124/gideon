import type { ReactNode } from "react";
import type { BlockRow, CabinetRow, UnitRow } from "../_lib/data";
import { bedsLabel, unitTypeLabel, unitTypeOptions } from "../_lib/data";

export const inputClass =
  "h-9 w-full rounded-md border border-zinc-300 bg-white px-2.5 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";
export const buttonClass =
  "inline-flex h-9 items-center justify-center rounded-md bg-teal-700 px-3 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40";
export const subtleButtonClass =
  "inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900";
export const dangerButtonClass =
  "inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/70 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950/30";

export type AdminSearchParams = Promise<Record<string, string | string[] | undefined>>;

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function PageHeader({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow && <div className="mb-2 text-xs font-medium uppercase tracking-wide text-teal-700">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-zinc-500">{description}</p>}
      </div>
      {children}
    </header>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-xs font-medium text-zinc-500">{children}</span>;
}

export function Pill({
  children,
  tone = "zinc",
}: {
  children: ReactNode;
  tone?: "zinc" | "teal" | "amber" | "red";
}) {
  const classes = {
    zinc: "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
    teal: "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/70 dark:bg-teal-950/30 dark:text-teal-300",
    amber:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300",
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300",
  };

  return (
    <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium ${classes[tone]}`}>
      {children}
    </span>
  );
}

export function Flash({ notice, error }: { notice?: string; error?: string }) {
  if (!notice && !error) return null;

  return (
    <div
      className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
        error
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300"
          : "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/70 dark:bg-teal-950/30 dark:text-teal-300"
      }`}
      role="status"
    >
      {error ?? notice}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone,
  helper,
}: {
  label: string;
  value: number;
  tone: "teal" | "amber" | "red" | "zinc";
  helper?: string;
}) {
  const dotClass = {
    teal: "bg-teal-600",
    amber: "bg-amber-500",
    red: "bg-red-500",
    zinc: "bg-zinc-400",
  }[tone];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-4">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </div>
      <div className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      {helper && <div className="mt-1 text-xs text-zinc-500">{helper}</div>}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
      {children}
    </div>
  );
}

export function AddPanel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {children}
    </div>
  );
}

export function RowList({
  headers,
  children,
  columns,
}: {
  headers: string[];
  children: ReactNode;
  columns: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div
        className={`hidden border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 md:grid ${columns}`}
      >
        {headers.map((header, index) => (
          <div key={`${header}-${index}`}>{header}</div>
        ))}
      </div>
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">{children}</div>
    </div>
  );
}

export function ReturnTo({ value }: { value: string }) {
  return <input type="hidden" name="returnTo" value={value} />;
}

export function DeleteForm({
  id,
  action,
  disabled,
  returnTo,
}: {
  id: number;
  action: (formData: FormData) => Promise<void>;
  disabled?: boolean;
  returnTo: string;
}) {
  return (
    <form action={action}>
      <ReturnTo value={returnTo} />
      <input type="hidden" name="id" value={id} />
      <button
        className={dangerButtonClass}
        disabled={disabled}
        title={disabled ? "Record has linked data" : undefined}
        type="submit"
      >
        Delete
      </button>
    </form>
  );
}

export function UnitTypeSelect({ defaultValue = "STUDIO" }: { defaultValue?: string }) {
  return (
    <select className={inputClass} defaultValue={defaultValue} name="unitType" required>
      {unitTypeOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function BlockSelect({
  blocks,
  defaultValue,
  name = "blockId",
}: {
  blocks: BlockRow[];
  defaultValue?: number;
  name?: string;
}) {
  return (
    <select className={inputClass} defaultValue={defaultValue?.toString()} name={name} required>
      <option value="">Block</option>
      {blocks.map((block) => (
        <option key={block.id} value={block.id}>
          {block.name}
        </option>
      ))}
    </select>
  );
}

export function CabinetSelect({
  cabinets,
  defaultValue,
}: {
  cabinets: CabinetRow[];
  defaultValue?: number;
}) {
  return (
    <select className={inputClass} defaultValue={defaultValue?.toString()} name="cabinetId" required>
      <option value="">Cabinet</option>
      {cabinets.map((cabinet) => (
        <option key={cabinet.id} value={cabinet.id}>
          Cabinet {cabinet.number} / {cabinet.currentCode}
        </option>
      ))}
    </select>
  );
}

export function UnitChecklist({
  units,
  selectedIds = [],
}: {
  units: UnitRow[];
  selectedIds?: number[];
}) {
  const selected = new Set(selectedIds);

  return (
    <div className="max-h-64 overflow-auto rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {units.map((unit) => (
          <label
            className="flex min-h-12 items-center gap-2 rounded-md px-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
            key={unit.id}
          >
            <input
              className="h-4 w-4 rounded border-zinc-300 accent-teal-700"
              defaultChecked={selected.has(unit.id)}
              name="apartmentIds"
              type="checkbox"
              value={unit.id}
            />
            <span className="grid">
              <span>
                {unit.block.name} / Apt {unit.number}
              </span>
              <span className="text-xs text-zinc-500">
                {unitTypeLabel(unit.unitType)} - {bedsLabel(unit.capacity)}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
