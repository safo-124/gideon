import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logoutAdmin } from "./login/actions";
import {
  createApartment,
  createBlock,
  createCabinet,
  createKey,
  deleteApartment,
  deleteBlock,
  deleteCabinet,
  deleteKey,
  updateApartment,
  updateBlock,
  updateCabinet,
  updateKey,
} from "./actions";

export const metadata = { title: "Admin - Key Recovery" };

const inputClass =
  "h-9 w-full rounded-md border border-zinc-300 bg-white px-2.5 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";
const buttonClass =
  "inline-flex h-9 items-center justify-center rounded-md bg-teal-700 px-3 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40";
const subtleButtonClass =
  "inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900";
const dangerButtonClass =
  "inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/70 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950/30";
const unitTypeOptions = [
  { value: "STUDIO", label: "Studio" },
  { value: "SHARED_ROOM", label: "Shared room" },
  { value: "ONE_BEDROOM", label: "1 bedroom" },
  { value: "TWO_BEDROOM", label: "2 bedroom" },
  { value: "THREE_BEDROOM", label: "3 bedroom" },
  { value: "FAMILY", label: "Family unit" },
  { value: "OTHER", label: "Other" },
] as const;

async function getAdminData() {
  const [blocks, apartments, cabinets, keys] = await Promise.all([
    prisma.block.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { apartments: true } } },
    }),
    prisma.apartment.findMany({
      orderBy: [{ blockId: "asc" }, { number: "asc" }],
      include: {
        block: true,
        _count: { select: { tenants: true, keys: true, requests: true } },
      },
    }),
    prisma.cabinet.findMany({
      orderBy: { number: "asc" },
      include: { _count: { select: { keys: true } } },
    }),
    prisma.key.findMany({
      orderBy: { code: "asc" },
      include: {
        cabinet: true,
        apartments: {
          orderBy: { apartmentId: "asc" },
          include: { apartment: { include: { block: true } } },
        },
        _count: { select: { requests: true } },
      },
    }),
  ]);

  return { blocks, apartments, cabinets, keys };
}

type AdminData = Awaited<ReturnType<typeof getAdminData>>;
type BlockRow = AdminData["blocks"][number];
type ApartmentRow = AdminData["apartments"][number];
type CabinetRow = AdminData["cabinets"][number];
type KeyRow = AdminData["keys"][number];
type AdminSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function unitTypeLabel(value: string) {
  return unitTypeOptions.find((option) => option.value === value)?.label ?? "Other";
}

function bedsLabel(capacity: number) {
  return `${capacity} bed${capacity === 1 ? "" : "s"}`;
}

function apartmentLabel(apartment: Pick<ApartmentRow, "number" | "block" | "unitType" | "capacity">) {
  return `${apartment.block.name} / Apt ${apartment.number} - ${unitTypeLabel(apartment.unitType)}, ${bedsLabel(apartment.capacity)}`;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-xs font-medium text-zinc-500">{children}</span>;
}

function Pill({
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

function SectionHeader({
  id,
  title,
  count,
  children,
}: {
  id: string;
  title: string;
  count: number;
  children?: ReactNode;
}) {
  return (
    <div id={id} className="mb-4 scroll-mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <Pill>{count}</Pill>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Flash({ notice, error }: { notice?: string; error?: string }) {
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

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "teal" | "amber" | "red" | "zinc";
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
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
      {children}
    </div>
  );
}

function AddPanel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {children}
    </div>
  );
}

function RowList({
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
        {headers.map((header) => (
          <div key={header}>{header}</div>
        ))}
      </div>
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">{children}</div>
    </div>
  );
}

function DeleteForm({
  id,
  action,
  disabled,
}: {
  id: number;
  action: (formData: FormData) => Promise<void>;
  disabled?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className={dangerButtonClass} disabled={disabled} title={disabled ? "Record has linked data" : undefined} type="submit">
        Delete
      </button>
    </form>
  );
}

function BlockSelect({
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

function UnitTypeSelect({ defaultValue = "STUDIO" }: { defaultValue?: string }) {
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

function CabinetSelect({
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

function ApartmentChecklist({
  apartments,
  selectedIds = [],
}: {
  apartments: ApartmentRow[];
  selectedIds?: number[];
}) {
  const selected = new Set(selectedIds);

  return (
    <div className="max-h-48 overflow-auto rounded-md border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {apartments.map((apartment) => (
          <label
            className="flex min-h-12 items-center gap-2 rounded-md px-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
            key={apartment.id}
          >
            <input
              className="h-4 w-4 rounded border-zinc-300 accent-teal-700"
              defaultChecked={selected.has(apartment.id)}
              name="apartmentIds"
              type="checkbox"
              value={apartment.id}
            />
            <span className="grid">
              <span>
                {apartment.block.name} / Apt {apartment.number}
              </span>
              <span className="text-xs text-zinc-500">
                {unitTypeLabel(apartment.unitType)} - {bedsLabel(apartment.capacity)}
              </span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function BlocksSection({ blocks }: { blocks: BlockRow[] }) {
  return (
    <section>
      <SectionHeader count={blocks.length} id="blocks" title="Blocks" />
      <AddPanel>
        <form action={createBlock} className="grid gap-3 lg:grid-cols-[1fr_1.5fr_9rem_auto]">
          <label>
            <FieldLabel>Name</FieldLabel>
            <input className={inputClass} name="name" placeholder="Mikontalo" required />
          </label>
          <label>
            <FieldLabel>Street</FieldLabel>
            <input className={inputClass} name="streetName" placeholder="Insinoorinkatu 60" required />
          </label>
          <label>
            <FieldLabel>ZIP</FieldLabel>
            <input className={inputClass} name="zip" placeholder="33720" required />
          </label>
          <div className="flex items-end">
            <button className={buttonClass} type="submit">
              Add block
            </button>
          </div>
        </form>
      </AddPanel>

      {blocks.length === 0 ? (
        <EmptyState>No blocks yet.</EmptyState>
      ) : (
        <RowList columns="grid-cols-[1fr_1.5fr_9rem_8rem_8rem_8rem]" headers={["Name", "Street", "ZIP", "Apts", "", ""]}>
          {blocks.map((block) => (
            <div className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_1.5fr_9rem_8rem_8rem_8rem] md:items-end" key={block.id}>
              <form action={updateBlock} className="contents">
                <input type="hidden" name="id" value={block.id} />
                <label>
                  <FieldLabel>Name</FieldLabel>
                  <input className={inputClass} defaultValue={block.name} name="name" required />
                </label>
                <label>
                  <FieldLabel>Street</FieldLabel>
                  <input className={inputClass} defaultValue={block.streetName} name="streetName" required />
                </label>
                <label>
                  <FieldLabel>ZIP</FieldLabel>
                  <input className={inputClass} defaultValue={block.zip} name="zip" required />
                </label>
                <div>
                  <FieldLabel>Apts</FieldLabel>
                  <div className="flex h-9 items-center text-sm tabular-nums">{block._count.apartments}</div>
                </div>
                <button className={subtleButtonClass} type="submit">
                  Save
                </button>
              </form>
              <DeleteForm action={deleteBlock} disabled={block._count.apartments > 0} id={block.id} />
            </div>
          ))}
        </RowList>
      )}
    </section>
  );
}

function ApartmentsSection({
  apartments,
  blocks,
}: {
  apartments: ApartmentRow[];
  blocks: BlockRow[];
}) {
  return (
    <section>
      <SectionHeader count={apartments.length} id="apartments" title="Housing units" />
      <AddPanel>
        <form action={createApartment} className="grid gap-3 xl:grid-cols-[1fr_7rem_12rem_8rem_minmax(12rem,1fr)_auto]">
          <label>
            <FieldLabel>Block</FieldLabel>
            <BlockSelect blocks={blocks} />
          </label>
          <label>
            <FieldLabel>Apt</FieldLabel>
            <input className={inputClass} min="1" name="number" required type="number" />
          </label>
          <label>
            <FieldLabel>Layout</FieldLabel>
            <UnitTypeSelect />
          </label>
          <label>
            <FieldLabel>Capacity</FieldLabel>
            <input className={inputClass} defaultValue={1} min="1" name="capacity" required type="number" />
          </label>
          <label>
            <FieldLabel>Notes</FieldLabel>
            <input className={inputClass} maxLength={240} name="notes" placeholder="2 in a room, accessible, etc." />
          </label>
          <div className="flex items-end">
            <button className={buttonClass} disabled={blocks.length === 0} type="submit">
              Add unit
            </button>
          </div>
        </form>
      </AddPanel>

      {apartments.length === 0 ? (
        <EmptyState>No housing units yet.</EmptyState>
      ) : (
        <RowList
          columns="grid-cols-[1fr_7rem_12rem_10rem_minmax(12rem,1fr)_7rem_7rem]"
          headers={["Block", "Apt", "Layout", "Capacity", "Notes", "", ""]}
        >
          {apartments.map((apartment) => {
            const linkedCount =
              apartment._count.tenants + apartment._count.keys + apartment._count.requests;
            const occupancyTone =
              apartment._count.tenants > apartment.capacity
                ? "red"
                : apartment._count.tenants === apartment.capacity
                  ? "amber"
                  : apartment._count.tenants === 0
                    ? "zinc"
                    : "teal";

            return (
              <div
                className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_7rem_12rem_10rem_minmax(12rem,1fr)_7rem_7rem] md:items-end"
                key={apartment.id}
              >
                <form action={updateApartment} className="contents">
                  <input type="hidden" name="id" value={apartment.id} />
                  <label>
                    <FieldLabel>Block</FieldLabel>
                    <BlockSelect blocks={blocks} defaultValue={apartment.blockId} />
                  </label>
                  <label>
                    <FieldLabel>Apt</FieldLabel>
                    <input className={inputClass} defaultValue={apartment.number} min="1" name="number" required type="number" />
                  </label>
                  <label>
                    <FieldLabel>Layout</FieldLabel>
                    <UnitTypeSelect defaultValue={apartment.unitType} />
                  </label>
                  <label>
                    <FieldLabel>Capacity</FieldLabel>
                    <div className="flex items-center gap-2">
                      <input
                        className="h-9 w-16 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                        defaultValue={apartment.capacity}
                        min="1"
                        name="capacity"
                        required
                        type="number"
                      />
                      <Pill tone={occupancyTone}>
                        {apartment._count.tenants}/{apartment.capacity}
                      </Pill>
                    </div>
                  </label>
                  <label>
                    <FieldLabel>Notes</FieldLabel>
                    <input
                      className={inputClass}
                      defaultValue={apartment.notes ?? ""}
                      maxLength={240}
                      name="notes"
                      placeholder="Optional"
                    />
                  </label>
                  <button className={subtleButtonClass} type="submit">
                    Save
                  </button>
                </form>
                <DeleteForm action={deleteApartment} disabled={linkedCount > 0} id={apartment.id} />
              </div>
            );
          })}
        </RowList>
      )}
    </section>
  );
}

function CabinetsSection({ cabinets }: { cabinets: CabinetRow[] }) {
  return (
    <section>
      <SectionHeader count={cabinets.length} id="cabinets" title="Cabinets" />
      <AddPanel>
        <form action={createCabinet} className="grid gap-3 lg:grid-cols-[10rem_10rem_auto]">
          <label>
            <FieldLabel>Cabinet</FieldLabel>
            <input className={inputClass} min="1" name="number" required type="number" />
          </label>
          <label>
            <FieldLabel>Code</FieldLabel>
            <input className={inputClass} inputMode="numeric" maxLength={4} name="currentCode" placeholder="Auto" />
          </label>
          <div className="flex items-end">
            <button className={buttonClass} type="submit">
              Add cabinet
            </button>
          </div>
        </form>
      </AddPanel>

      {cabinets.length === 0 ? (
        <EmptyState>No cabinets yet.</EmptyState>
      ) : (
        <RowList columns="grid-cols-[10rem_10rem_8rem_8rem_8rem]" headers={["Cabinet", "Code", "Keys", "", ""]}>
          {cabinets.map((cabinet) => (
            <div className="grid gap-3 px-4 py-3 md:grid-cols-[10rem_10rem_8rem_8rem_8rem] md:items-end" key={cabinet.id}>
              <form action={updateCabinet} className="contents">
                <input type="hidden" name="id" value={cabinet.id} />
                <label>
                  <FieldLabel>Cabinet</FieldLabel>
                  <input className={inputClass} defaultValue={cabinet.number} min="1" name="number" required type="number" />
                </label>
                <label>
                  <FieldLabel>Code</FieldLabel>
                  <input className={inputClass} defaultValue={cabinet.currentCode} inputMode="numeric" maxLength={4} name="currentCode" required />
                </label>
                <div>
                  <FieldLabel>Keys</FieldLabel>
                  <div className="flex h-9 items-center text-sm tabular-nums">{cabinet._count.keys}</div>
                </div>
                <button className={subtleButtonClass} type="submit">
                  Save
                </button>
              </form>
              <DeleteForm action={deleteCabinet} disabled={cabinet._count.keys > 0} id={cabinet.id} />
            </div>
          ))}
        </RowList>
      )}
    </section>
  );
}

function KeyCard({
  apartments,
  cabinets,
  keyRecord,
}: {
  apartments: ApartmentRow[];
  cabinets: CabinetRow[];
  keyRecord: KeyRow;
}) {
  const selectedIds = keyRecord.apartments.map((mapping) => mapping.apartmentId);
  const mappedApartments = keyRecord.apartments.map((mapping) => apartmentLabel(mapping.apartment));

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-sm font-semibold tracking-wide">{keyRecord.code}</div>
          <div className="mt-1 text-sm text-zinc-500">Cabinet {keyRecord.cabinet.number}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill tone="teal">{mappedApartments.length} units</Pill>
          <Pill tone={keyRecord._count.requests > 0 ? "amber" : "zinc"}>
            {keyRecord._count.requests} requests
          </Pill>
        </div>
      </div>

      <form action={updateKey} className="grid gap-3 lg:grid-cols-[10rem_1fr_2fr_8rem]">
        <input type="hidden" name="id" value={keyRecord.id} />
        <label>
          <FieldLabel>Code</FieldLabel>
          <input className={inputClass} defaultValue={keyRecord.code} maxLength={16} name="code" required />
        </label>
        <label>
          <FieldLabel>Cabinet</FieldLabel>
          <CabinetSelect cabinets={cabinets} defaultValue={keyRecord.cabinetId} />
        </label>
        <label>
          <FieldLabel>Units</FieldLabel>
          <ApartmentChecklist apartments={apartments} selectedIds={selectedIds} />
        </label>
        <div className="flex items-end">
          <button className={subtleButtonClass} type="submit">
            Save
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-col gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-zinc-500">{mappedApartments.join(", ") || "No units assigned"}</div>
        <DeleteForm action={deleteKey} disabled={keyRecord._count.requests > 0} id={keyRecord.id} />
      </div>
    </div>
  );
}

function KeysSection({
  apartments,
  cabinets,
  keys,
}: {
  apartments: ApartmentRow[];
  cabinets: CabinetRow[];
  keys: KeyRow[];
}) {
  const canCreateKey = apartments.length > 0 && cabinets.length > 0;

  return (
    <section>
      <SectionHeader count={keys.length} id="keys" title="Keys" />
      <AddPanel>
        <form action={createKey} className="grid gap-3 lg:grid-cols-[10rem_1fr_2fr_auto]">
          <label>
            <FieldLabel>Code</FieldLabel>
            <input className={inputClass} maxLength={16} name="code" placeholder="Auto" />
          </label>
          <label>
            <FieldLabel>Cabinet</FieldLabel>
            <CabinetSelect cabinets={cabinets} />
          </label>
          <label>
            <FieldLabel>Units</FieldLabel>
            <ApartmentChecklist apartments={apartments} />
          </label>
          <div className="flex items-end">
            <button className={buttonClass} disabled={!canCreateKey} type="submit">
              Add key
            </button>
          </div>
        </form>
      </AddPanel>

      {keys.length === 0 ? (
        <EmptyState>No keys yet.</EmptyState>
      ) : (
        <div className="grid gap-3">{keys.map((keyRecord) => (
          <KeyCard apartments={apartments} cabinets={cabinets} key={keyRecord.id} keyRecord={keyRecord} />
        ))}</div>
      )}
    </section>
  );
}

function AdminNav({
  blocks,
  apartments,
  cabinets,
  keys,
}: {
  blocks: number;
  apartments: number;
  cabinets: number;
  keys: number;
}) {
  const items = [
    ["blocks", "Blocks", blocks],
    ["apartments", "Units", apartments],
    ["cabinets", "Cabinets", cabinets],
    ["keys", "Keys", keys],
  ] as const;

  return (
    <nav className="grid gap-1">
      {items.map(([id, label, count]) => (
        <a
          className="flex h-10 items-center justify-between rounded-md px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
          href={`#${id}`}
          key={id}
        >
          <span>{label}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs tabular-nums text-zinc-500 dark:bg-zinc-900">
            {count}
          </span>
        </a>
      ))}
    </nav>
  );
}

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const notice = firstParam(params.notice);
  const error = firstParam(params.error);
  const { blocks, apartments, cabinets, keys } = await getAdminData();

  const totalCapacity = apartments.reduce((sum, apartment) => sum + apartment.capacity, 0);
  const occupiedBeds = apartments.reduce((sum, apartment) => sum + apartment._count.tenants, 0);
  const openBeds = Math.max(totalCapacity - occupiedBeds, 0);
  const overcrowdedUnits = apartments.filter(
    (apartment) => apartment._count.tenants > apartment.capacity,
  ).length;

  return (
    <main className="min-h-full flex-1 bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[15rem_1fr]">
        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:sticky lg:top-6">
          <div className="border-b border-zinc-200 px-2 pb-3 dark:border-zinc-800">
            <div className="text-sm font-semibold">Key Recovery</div>
            <div className="mt-1 text-xs text-zinc-500">{admin.username}</div>
          </div>
          <div className="py-3">
            <AdminNav
              apartments={apartments.length}
              blocks={blocks.length}
              cabinets={cabinets.length}
              keys={keys.length}
            />
          </div>
          <form action={logoutAdmin} className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <button className="h-9 w-full rounded-md text-left text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-white">
              Sign out
            </button>
          </form>
        </aside>

        <div>
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
              <p className="mt-1 text-sm text-zinc-500">Housing capacity, access codes, and key coverage.</p>
            </div>
          </header>

          <Flash error={error} notice={notice} />

          <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Units" tone="teal" value={apartments.length} />
            <StatCard label="Bed capacity" tone="amber" value={totalCapacity} />
            <StatCard label="Occupied beds" tone="zinc" value={occupiedBeds} />
            <StatCard
              label={overcrowdedUnits > 0 ? "Over capacity" : "Open beds"}
              tone={overcrowdedUnits > 0 ? "red" : "teal"}
              value={overcrowdedUnits || openBeds}
            />
          </div>

          <div className="space-y-10">
            <BlocksSection blocks={blocks} />
            <ApartmentsSection apartments={apartments} blocks={blocks} />
            <CabinetsSection cabinets={cabinets} />
            <KeysSection apartments={apartments} cabinets={cabinets} keys={keys} />
          </div>
        </div>
      </div>
    </main>
  );
}
