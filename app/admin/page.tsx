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
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 shadow-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";
const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-950";
const subtleButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200";
const dangerButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/70 dark:text-red-300";

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

function apartmentLabel(apartment: Pick<ApartmentRow, "number" | "block">) {
  return `${apartment.block.name} / Apt ${apartment.number}`;
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-xs font-medium text-zinc-500">{children}</span>;
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
      <button className={dangerButtonClass} disabled={disabled} type="submit">
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
      <option value="">Choose block</option>
      {blocks.map((block) => (
        <option key={block.id} value={block.id}>
          {block.name}
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
      <option value="">Choose cabinet</option>
      {cabinets.map((cabinet) => (
        <option key={cabinet.id} value={cabinet.id}>
          Cabinet {cabinet.number} - code {cabinet.currentCode}
        </option>
      ))}
    </select>
  );
}

function ApartmentMultiSelect({
  apartments,
  selectedIds = [],
}: {
  apartments: ApartmentRow[];
  selectedIds?: number[];
}) {
  return (
    <select
      className={`${inputClass} min-h-36`}
      defaultValue={selectedIds.map(String)}
      multiple
      name="apartmentIds"
      required
      size={Math.min(8, Math.max(4, apartments.length))}
    >
      {apartments.map((apartment) => (
        <option key={apartment.id} value={apartment.id}>
          {apartmentLabel(apartment)}
        </option>
      ))}
    </select>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase text-zinc-500">{label}</div>
    </div>
  );
}

function Flash({ notice, error }: { notice?: string; error?: string }) {
  if (!notice && !error) return null;

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        error
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300"
          : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300"
      }`}
      role="status"
    >
      {error ?? notice}
    </div>
  );
}

function BlocksSection({ blocks }: { blocks: BlockRow[] }) {
  return (
    <Section
      id="blocks"
      title="Blocks"
      description="Create residential blocks and maintain their address details."
    >
      <form
        action={createBlock}
        className="mb-4 grid gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 md:grid-cols-[1fr_1.4fr_8rem_auto]"
      >
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
            Add
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {blocks.map((block) => (
          <div key={block.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <form action={updateBlock} className="grid gap-3 lg:grid-cols-[1fr_1.4fr_8rem_8rem_auto]">
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
                <FieldLabel>Apartments</FieldLabel>
                <div className="flex min-h-10 items-center text-sm tabular-nums">
                  {block._count.apartments}
                </div>
              </div>
              <div className="flex items-end">
                <button className={subtleButtonClass} type="submit">
                  Save
                </button>
              </div>
            </form>
            <div className="mt-3 flex justify-end">
              <DeleteForm action={deleteBlock} disabled={block._count.apartments > 0} id={block.id} />
            </div>
          </div>
        ))}
      </div>
    </Section>
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
    <Section
      id="apartments"
      title="Apartments"
      description="Create apartments within blocks and move them when corrections are needed."
    >
      <form
        action={createApartment}
        className="mb-4 grid gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 md:grid-cols-[1fr_10rem_auto]"
      >
        <label>
          <FieldLabel>Block</FieldLabel>
          <BlockSelect blocks={blocks} />
        </label>
        <label>
          <FieldLabel>Apartment</FieldLabel>
          <input className={inputClass} min="1" name="number" required type="number" />
        </label>
        <div className="flex items-end">
          <button className={buttonClass} disabled={blocks.length === 0} type="submit">
            Add
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {apartments.map((apartment) => {
          const hasConnections =
            apartment._count.tenants + apartment._count.keys + apartment._count.requests > 0;

          return (
            <div key={apartment.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <form action={updateApartment} className="grid gap-3 lg:grid-cols-[1fr_10rem_13rem_auto]">
                <input type="hidden" name="id" value={apartment.id} />
                <label>
                  <FieldLabel>Block</FieldLabel>
                  <BlockSelect blocks={blocks} defaultValue={apartment.blockId} />
                </label>
                <label>
                  <FieldLabel>Apartment</FieldLabel>
                  <input
                    className={inputClass}
                    defaultValue={apartment.number}
                    min="1"
                    name="number"
                    required
                    type="number"
                  />
                </label>
                <div>
                  <FieldLabel>Connections</FieldLabel>
                  <div className="flex min-h-10 items-center text-sm text-zinc-600 dark:text-zinc-400">
                    {apartment._count.tenants} tenants, {apartment._count.keys} keys,{" "}
                    {apartment._count.requests} requests
                  </div>
                </div>
                <div className="flex items-end">
                  <button className={subtleButtonClass} type="submit">
                    Save
                  </button>
                </div>
              </form>
              <div className="mt-3 flex justify-end">
                <DeleteForm action={deleteApartment} disabled={hasConnections} id={apartment.id} />
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function CabinetsSection({ cabinets }: { cabinets: CabinetRow[] }) {
  return (
    <Section
      id="cabinets"
      title="Cabinets"
      description="Manage physical cabinet slots and their active four-digit access codes."
    >
      <form
        action={createCabinet}
        className="mb-4 grid gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 md:grid-cols-[10rem_10rem_auto]"
      >
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
            Add
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {cabinets.map((cabinet) => (
          <div key={cabinet.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <form action={updateCabinet} className="grid gap-3 lg:grid-cols-[10rem_10rem_8rem_auto]">
              <input type="hidden" name="id" value={cabinet.id} />
              <label>
                <FieldLabel>Cabinet</FieldLabel>
                <input
                  className={inputClass}
                  defaultValue={cabinet.number}
                  min="1"
                  name="number"
                  required
                  type="number"
                />
              </label>
              <label>
                <FieldLabel>Code</FieldLabel>
                <input
                  className={inputClass}
                  defaultValue={cabinet.currentCode}
                  inputMode="numeric"
                  maxLength={4}
                  name="currentCode"
                  required
                />
              </label>
              <div>
                <FieldLabel>Keys</FieldLabel>
                <div className="flex min-h-10 items-center text-sm tabular-nums">{cabinet._count.keys}</div>
              </div>
              <div className="flex items-end">
                <button className={subtleButtonClass} type="submit">
                  Save
                </button>
              </div>
            </form>
            <div className="mt-3 flex justify-end">
              <DeleteForm action={deleteCabinet} disabled={cabinet._count.keys > 0} id={cabinet.id} />
            </div>
          </div>
        ))}
      </div>
    </Section>
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
    <Section
      id="keys"
      title="Keys"
      description="Assign each physical key to a cabinet and to the apartments it can unlock."
    >
      <form
        action={createKey}
        className="mb-4 grid gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 lg:grid-cols-[10rem_1fr_1.3fr_auto]"
      >
        <label>
          <FieldLabel>Code</FieldLabel>
          <input className={inputClass} maxLength={16} name="code" placeholder="Auto" />
        </label>
        <label>
          <FieldLabel>Cabinet</FieldLabel>
          <CabinetSelect cabinets={cabinets} />
        </label>
        <label>
          <FieldLabel>Apartments</FieldLabel>
          <ApartmentMultiSelect apartments={apartments} />
        </label>
        <div className="flex items-end">
          <button className={buttonClass} disabled={!canCreateKey} type="submit">
            Add
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {keys.map((key) => {
          const selectedIds = key.apartments.map((mapping) => mapping.apartmentId);
          const mappedApartments = key.apartments
            .map((mapping) => apartmentLabel(mapping.apartment))
            .join(", ");

          return (
            <div key={key.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                Cabinet {key.cabinet.number} - {mappedApartments || "No apartments assigned"}
              </div>
              <form action={updateKey} className="grid gap-3 lg:grid-cols-[10rem_1fr_1.3fr_7rem_auto]">
                <input type="hidden" name="id" value={key.id} />
                <label>
                  <FieldLabel>Code</FieldLabel>
                  <input className={inputClass} defaultValue={key.code} maxLength={16} name="code" required />
                </label>
                <label>
                  <FieldLabel>Cabinet</FieldLabel>
                  <CabinetSelect cabinets={cabinets} defaultValue={key.cabinetId} />
                </label>
                <label>
                  <FieldLabel>Apartments</FieldLabel>
                  <ApartmentMultiSelect apartments={apartments} selectedIds={selectedIds} />
                </label>
                <div>
                  <FieldLabel>Requests</FieldLabel>
                  <div className="flex min-h-10 items-center text-sm tabular-nums">{key._count.requests}</div>
                </div>
                <div className="flex items-end">
                  <button className={subtleButtonClass} type="submit">
                    Save
                  </button>
                </div>
              </form>
              <div className="mt-3 flex justify-end">
                <DeleteForm action={deleteKey} disabled={key._count.requests > 0} id={key.id} />
              </div>
            </div>
          );
        })}
      </div>
    </Section>
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

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as {admin.username}
          </p>
        </div>
        <form action={logoutAdmin}>
          <button className="text-sm text-zinc-500 underline">Sign out</button>
        </form>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Blocks" value={blocks.length} />
        <StatCard label="Apartments" value={apartments.length} />
        <StatCard label="Cabinets" value={cabinets.length} />
        <StatCard label="Keys" value={keys.length} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <a className={subtleButtonClass} href="#blocks">
          Blocks
        </a>
        <a className={subtleButtonClass} href="#apartments">
          Apartments
        </a>
        <a className={subtleButtonClass} href="#cabinets">
          Cabinets
        </a>
        <a className={subtleButtonClass} href="#keys">
          Keys
        </a>
      </div>

      <div className="mb-8">
        <Flash error={error} notice={notice} />
      </div>

      <div className="space-y-10">
        <BlocksSection blocks={blocks} />
        <ApartmentsSection apartments={apartments} blocks={blocks} />
        <CabinetsSection cabinets={cabinets} />
        <KeysSection apartments={apartments} cabinets={cabinets} keys={keys} />
      </div>
    </main>
  );
}
