import {
  EmptyState,
  FieldLabel,
  Flash,
  PageHeader,
  Pill,
  RowList,
  StatCard,
  firstParam,
  type AdminSearchParams,
} from "../../_components/ui";
import { getTenants } from "../../_lib/data";

export const metadata = { title: "Tenants - Admin" };

const columns = "md:grid-cols-[1.2fr_1.5fr_1fr_8rem_8rem_8rem] md:items-center md:gap-3";
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const params = await searchParams;
  const tenants = await getTenants();
  const activeUnits = new Set(tenants.map((tenant) => tenant.apartmentId)).size;
  const totalRequests = tenants.reduce((sum, tenant) => sum + tenant._count.requests, 0);
  const sharedRooms = tenants.filter((tenant) => tenant.apartment._count.tenants > 1).length;

  return (
    <>
      <PageHeader
        description="Review tenant records, contact details, assigned units, and request activity."
        eyebrow="People"
        title="Tenants"
      />

      <Flash error={firstParam(params.error)} notice={firstParam(params.notice)} />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard helper={`${activeUnits} occupied units`} label="Tenants" tone="teal" value={tenants.length} />
        <StatCard helper="Across all tenants" label="Requests" tone="amber" value={totalRequests} />
        <StatCard helper="Tenants in shared units" label="Shared living" tone="zinc" value={sharedRooms} />
      </div>

      {tenants.length === 0 ? (
        <EmptyState>No tenants yet.</EmptyState>
      ) : (
        <RowList columns={columns} headers={["Tenant", "Email", "Unit", "Capacity", "Requests", "Created"]}>
          {tenants.map((tenant) => {
            const overCapacity = tenant.apartment._count.tenants > tenant.apartment.capacity;
            const fullUnit = `${tenant.apartment.block.name} / Apt ${tenant.apartment.number}`;

            return (
              <div className={`grid gap-3 p-4 ${columns}`} key={tenant.id}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                    {initials(tenant.fullName)}
                  </div>
                  <div className="min-w-0">
                    <FieldLabel>Name</FieldLabel>
                    <div className="truncate text-sm font-medium">{tenant.fullName}</div>
                  </div>
                </div>

                <div className="min-w-0">
                  <FieldLabel>Email</FieldLabel>
                  <a className="block truncate text-sm text-teal-700 hover:underline dark:text-teal-300" href={`mailto:${tenant.email}`}>
                    {tenant.email}
                  </a>
                </div>

                <div className="min-w-0">
                  <FieldLabel>Unit</FieldLabel>
                  <div className="truncate text-sm font-medium">{fullUnit}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">{tenant.apartment._count.keys} key assignment{tenant.apartment._count.keys === 1 ? "" : "s"}</div>
                </div>

                <div>
                  <FieldLabel>Capacity</FieldLabel>
                  <Pill tone={overCapacity ? "red" : tenant.apartment._count.tenants === tenant.apartment.capacity ? "amber" : "teal"}>
                    {tenant.apartment._count.tenants}/{tenant.apartment.capacity}
                  </Pill>
                </div>

                <div>
                  <FieldLabel>Requests</FieldLabel>
                  <div className="text-sm font-medium tabular-nums">{tenant._count.requests}</div>
                </div>

                <div>
                  <FieldLabel>Created</FieldLabel>
                  <div className="text-sm text-zinc-600 dark:text-zinc-300">{dateFormatter.format(tenant.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </RowList>
      )}
    </>
  );
}
