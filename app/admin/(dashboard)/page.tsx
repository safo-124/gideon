import Link from "next/link";
import {
  EmptyState,
  Flash,
  PageHeader,
  Pill,
  StatCard,
  type AdminSearchParams,
  firstParam,
} from "../_components/ui";
import { getOverviewData, unitTypeLabel } from "../_lib/data";

export const metadata = { title: "Admin - Key Recovery" };

const quickLinks = [
  {
    href: "/admin/blocks",
    title: "Blocks",
    description: "Maintain building names and addresses.",
  },
  {
    href: "/admin/units",
    title: "Housing units",
    description: "Track studios, shared rooms, capacity, and occupancy.",
  },
  {
    href: "/admin/cabinets",
    title: "Cabinets",
    description: "Manage physical cabinet slots and active codes.",
  },
  {
    href: "/admin/keys",
    title: "Keys",
    description: "Assign keys to cabinets and housing units.",
  },
];

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const params = await searchParams;
  const notice = firstParam(params.notice);
  const error = firstParam(params.error);
  const { blocks, units, cabinets, keys } = await getOverviewData();

  const totalCapacity = units.reduce((sum, unit) => sum + unit.capacity, 0);
  const occupiedBeds = units.reduce((sum, unit) => sum + unit._count.tenants, 0);
  const openBeds = Math.max(totalCapacity - occupiedBeds, 0);
  const overCapacity = units.filter((unit) => unit._count.tenants > unit.capacity);
  const cabinetsInUse = cabinets.filter((cabinet) => cabinet._count.keys > 0).length;
  const assignedUnitLinks = keys.reduce((sum, key) => sum + key.apartments.length, 0);

  return (
    <>
      <PageHeader
        description="A quick read on housing capacity, access codes, and key coverage."
        eyebrow="Operations"
        title="Admin overview"
      />

      <Flash error={error} notice={notice} />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard helper={`${blocks.length} blocks`} label="Units" tone="teal" value={units.length} />
        <StatCard helper={`${openBeds} open`} label="Bed capacity" tone="amber" value={totalCapacity} />
        <StatCard helper="Tenant records" label="Occupied beds" tone="zinc" value={occupiedBeds} />
        <StatCard
          helper={overCapacity.length > 0 ? "Needs review" : "Available capacity"}
          label={overCapacity.length > 0 ? "Over capacity" : "Open beds"}
          tone={overCapacity.length > 0 ? "red" : "teal"}
          value={overCapacity.length || openBeds}
        />
      </div>

      <div className="mb-8 grid gap-3 lg:grid-cols-4">
        {quickLinks.map((item) => (
          <Link
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-teal-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            href={item.href}
            key={item.href}
          >
            <div className="text-sm font-semibold">{item.title}</div>
            <p className="mt-2 text-sm text-zinc-500">{item.description}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Capacity watch</h2>
            <Pill tone={overCapacity.length > 0 ? "red" : "teal"}>
              {overCapacity.length > 0 ? `${overCapacity.length} over` : `${openBeds} open beds`}
            </Pill>
          </div>
          {units.length === 0 ? (
            <EmptyState>No units yet.</EmptyState>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {units.slice(0, 8).map((unit) => {
                const tone =
                  unit._count.tenants > unit.capacity
                    ? "red"
                    : unit._count.tenants === unit.capacity
                      ? "amber"
                      : unit._count.tenants === 0
                        ? "zinc"
                        : "teal";
                return (
                  <div className="flex items-center justify-between gap-4 py-3" key={unit.id}>
                    <div>
                      <div className="text-sm font-medium">
                        {unit.block.name} / Apt {unit.number}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">{unitTypeLabel(unit.unitType)}</div>
                    </div>
                    <Pill tone={tone}>
                      {unit._count.tenants}/{unit.capacity}
                    </Pill>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-base font-semibold">Key coverage</h2>
          <div className="mt-4 grid gap-3">
            <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900">
              <span>Keys</span>
              <span className="font-medium tabular-nums">{keys.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900">
              <span>Unit assignments</span>
              <span className="font-medium tabular-nums">{assignedUnitLinks}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900">
              <span>Cabinets in use</span>
              <span className="font-medium tabular-nums">
                {cabinetsInUse}/{cabinets.length}
              </span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
