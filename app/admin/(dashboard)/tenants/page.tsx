import { createTenant, deleteTenant, updateTenant } from "../../actions";
import {
  AddPanel,
  BlockSelect,
  DeleteForm,
  EmptyState,
  FieldLabel,
  Flash,
  PageHeader,
  Pill,
  ReturnTo,
  RowList,
  StatCard,
  buttonClass,
  firstParam,
  inputClass,
  subtleButtonClass,
  type AdminSearchParams,
} from "../../_components/ui";
import { getBlocks, getTenants } from "../../_lib/data";

export const metadata = { title: "Tenants - Admin" };

const RETURN_TO = "/admin/tenants";
const dateFormatter = new Intl.DateTimeFormat("en-FI", {
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

function UnitSelect({
  blocks,
  defaultValue,
}: {
  blocks: Awaited<ReturnType<typeof getBlocks>>;
  defaultValue?: number;
}) {
  return (
    <select
      className={inputClass}
      defaultValue={defaultValue?.toString()}
      name="apartmentId"
      required
    >
      <option value="">Apartment</option>
      {blocks.map((block) =>
        block.apartments?.map((apt) => (
          <option key={apt.id} value={apt.id}>
            {block.name} / Apt {apt.number}
          </option>
        )),
      )}
    </select>
  );
}

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const params = await searchParams;
  const [tenants, blocks] = await Promise.all([
    getTenants(),
    // fetch blocks with apartments for the unit selector
    import("@/lib/prisma").then(({ prisma }) =>
      prisma.block.findMany({
        orderBy: { name: "asc" },
        include: { apartments: { orderBy: { number: "asc" }, select: { id: true, number: true } } },
      }),
    ),
  ]);

  const activeUnits = new Set(tenants.map((t) => t.apartmentId)).size;
  const totalRequests = tenants.reduce((sum, t) => sum + t._count.requests, 0);
  const sharedRooms = tenants.filter((t) => t.apartment._count.tenants > 1).length;

  return (
    <>
      <PageHeader
        description="Create tenant accounts, update profiles, and manage apartment assignments."
        eyebrow="People"
        title="Tenants"
      />

      <Flash error={firstParam(params.error)} notice={firstParam(params.notice)} />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard helper={`${activeUnits} occupied units`} label="Tenants" tone="teal" value={tenants.length} />
        <StatCard helper="Across all tenants" label="Requests" tone="amber" value={totalRequests} />
        <StatCard helper="In shared units" label="Shared living" tone="zinc" value={sharedRooms} />
      </div>

      <AddPanel>
        <p className="mb-3 text-xs font-medium text-zinc-500">Add tenant</p>
        <form
          action={createTenant}
          className="grid gap-3 md:grid-cols-[1.2fr_1.4fr_1fr_1fr_1fr_auto] md:items-end"
        >
          <ReturnTo value={RETURN_TO} />
          <label>
            <FieldLabel>Full name</FieldLabel>
            <input className={inputClass} name="fullName" placeholder="Jane Doe" required />
          </label>
          <label>
            <FieldLabel>Email</FieldLabel>
            <input className={inputClass} name="email" placeholder="jane@example.com" required type="email" />
          </label>
          <label>
            <FieldLabel>Password</FieldLabel>
            <input className={inputClass} minLength={8} name="password" placeholder="Min 8 chars" required type="password" />
          </label>
          <label>
            <FieldLabel>Apartment</FieldLabel>
            <UnitSelect blocks={blocks} />
          </label>
          <button className={buttonClass} disabled={blocks.length === 0} type="submit">
            Add tenant
          </button>
        </form>
      </AddPanel>

      {tenants.length === 0 ? (
        <EmptyState>No tenants yet.</EmptyState>
      ) : (
        <div className="grid gap-4">
          {tenants.map((tenant) => {
            const overCapacity = tenant.apartment._count.tenants > tenant.apartment.capacity;
            const occupancyTone = overCapacity
              ? "red"
              : tenant.apartment._count.tenants === tenant.apartment.capacity
                ? "amber"
                : "teal";

            return (
              <div
                className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                key={tenant.id}
              >
                {/* Profile header */}
                <div className="flex items-start gap-4 border-b border-zinc-100 p-4 dark:border-zinc-800">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-base font-semibold text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                    {initials(tenant.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{tenant.fullName}</div>
                    <a
                      className="text-xs text-teal-700 hover:underline dark:text-teal-400"
                      href={`mailto:${tenant.email}`}
                    >
                      {tenant.email}
                    </a>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Pill tone={occupancyTone}>
                        {tenant.apartment.block.name} / Apt {tenant.apartment.number}
                      </Pill>
                      <span className="text-xs text-zinc-400">
                        {tenant._count.requests} request{tenant._count.requests === 1 ? "" : "s"}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Joined {dateFormatter.format(tenant.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit form */}
                <div className="p-4">
                  <form
                    action={updateTenant}
                    className="grid gap-3 md:grid-cols-[1.2fr_1.4fr_1fr_1fr_auto_auto] md:items-end"
                  >
                    <ReturnTo value={RETURN_TO} />
                    <input name="id" type="hidden" value={tenant.id} />
                    <label>
                      <FieldLabel>Full name</FieldLabel>
                      <input className={inputClass} defaultValue={tenant.fullName} name="fullName" required />
                    </label>
                    <label>
                      <FieldLabel>Email</FieldLabel>
                      <input
                        className={inputClass}
                        defaultValue={tenant.email}
                        name="email"
                        required
                        type="email"
                      />
                    </label>
                    <label>
                      <FieldLabel>New password</FieldLabel>
                      <input
                        className={inputClass}
                        minLength={8}
                        name="password"
                        placeholder="Leave blank to keep"
                        type="password"
                      />
                    </label>
                    <label>
                      <FieldLabel>Apartment</FieldLabel>
                      <UnitSelect blocks={blocks} defaultValue={tenant.apartmentId} />
                    </label>
                    <button className={subtleButtonClass} type="submit">
                      Save
                    </button>
                  </form>
                </div>

                <div className="flex justify-end border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <DeleteForm
                    action={deleteTenant}
                    disabled={tenant._count.requests > 0}
                    id={tenant.id}
                    returnTo={RETURN_TO}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
