import { createApartment, deleteApartment, updateApartment } from "../../actions";
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
  UnitTypeSelect,
  buttonClass,
  firstParam,
  inputClass,
  type AdminSearchParams,
} from "../../_components/ui";
import { getBlocks, getUnits, unitTypeLabel } from "../../_lib/data";

export const metadata = { title: "Units - Admin" };

const RETURN_TO = "/admin/units";
const columns = "md:grid-cols-[1fr_6rem_10rem_7rem_8rem_minmax(10rem,1fr)_6rem_6rem] md:items-end md:gap-3";

export default async function UnitsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const params = await searchParams;
  const [blocks, units] = await Promise.all([getBlocks(), getUnits()]);
  const totalCapacity = units.reduce((sum, unit) => sum + unit.capacity, 0);
  const occupiedBeds = units.reduce((sum, unit) => sum + unit._count.tenants, 0);
  const openBeds = Math.max(totalCapacity - occupiedBeds, 0);
  const overCapacity = units.filter((unit) => unit._count.tenants > unit.capacity).length;

  return (
    <>
      <PageHeader
        description="Use unit type and capacity to support studios, shared rooms, family units, and anything in between."
        eyebrow="Housing"
        title="Units"
      />

      <Flash error={firstParam(params.error)} notice={firstParam(params.notice)} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard helper={`${blocks.length} blocks`} label="Units" tone="teal" value={units.length} />
        <StatCard helper={`${openBeds} open`} label="Bed capacity" tone="amber" value={totalCapacity} />
        <StatCard helper="Tenant records" label="Occupied" tone="zinc" value={occupiedBeds} />
        <StatCard helper={overCapacity > 0 ? "Needs review" : "No issues"} label="Over capacity" tone={overCapacity > 0 ? "red" : "teal"} value={overCapacity} />
      </div>

      <AddPanel>
        <form action={createApartment} className="grid gap-3 md:grid-cols-[1fr_7rem_10rem_7rem_minmax(12rem,1fr)_7rem] md:items-end">
          <ReturnTo value={RETURN_TO} />
          <label>
            <FieldLabel>Block</FieldLabel>
            <BlockSelect blocks={blocks} />
          </label>
          <label>
            <FieldLabel>Unit</FieldLabel>
            <input className={inputClass} min={1} name="number" placeholder="101" required type="number" />
          </label>
          <label>
            <FieldLabel>Type</FieldLabel>
            <UnitTypeSelect />
          </label>
          <label>
            <FieldLabel>Beds</FieldLabel>
            <input className={inputClass} defaultValue={1} min={1} name="capacity" required type="number" />
          </label>
          <label>
            <FieldLabel>Notes</FieldLabel>
            <input className={inputClass} maxLength={240} name="notes" placeholder="Optional" />
          </label>
          <button className={buttonClass} disabled={blocks.length === 0} type="submit">
            Add unit
          </button>
        </form>
      </AddPanel>

      {blocks.length === 0 ? (
        <EmptyState>Add a block before creating units.</EmptyState>
      ) : units.length === 0 ? (
        <EmptyState>No units yet. Add studios, shared rooms, or apartments from the form above.</EmptyState>
      ) : (
        <RowList columns={columns} headers={["Block", "Unit", "Type", "Beds", "Occupancy", "Notes", "", ""]}>
          {units.map((unit) => {
            const occupancyTone =
              unit._count.tenants > unit.capacity
                ? "red"
                : unit._count.tenants === unit.capacity
                  ? "amber"
                  : unit._count.tenants === 0
                    ? "zinc"
                    : "teal";
            const linkedRecords = unit._count.tenants + unit._count.keys + unit._count.requests;

            return (
              <div className={`grid gap-3 p-4 ${columns}`} key={unit.id}>
                <form action={updateApartment} className="contents">
                  <ReturnTo value={RETURN_TO} />
                  <input name="id" type="hidden" value={unit.id} />
                  <label>
                    <FieldLabel>Block</FieldLabel>
                    <BlockSelect blocks={blocks} defaultValue={unit.blockId} />
                  </label>
                  <label>
                    <FieldLabel>Unit</FieldLabel>
                    <input className={inputClass} defaultValue={unit.number} min={1} name="number" required type="number" />
                  </label>
                  <label>
                    <FieldLabel>Type</FieldLabel>
                    <UnitTypeSelect defaultValue={unit.unitType} />
                  </label>
                  <label>
                    <FieldLabel>Beds</FieldLabel>
                    <input className={inputClass} defaultValue={unit.capacity} min={1} name="capacity" required type="number" />
                  </label>
                  <div>
                    <FieldLabel>Occupancy</FieldLabel>
                    <div className="flex h-9 items-center">
                      <Pill tone={occupancyTone}>
                        {unit._count.tenants}/{unit.capacity}
                      </Pill>
                    </div>
                  </div>
                  <label>
                    <FieldLabel>Notes</FieldLabel>
                    <input className={inputClass} defaultValue={unit.notes ?? ""} maxLength={240} name="notes" placeholder={unitTypeLabel(unit.unitType)} />
                  </label>
                  <button className={buttonClass} type="submit">
                    Save
                  </button>
                </form>
                <DeleteForm action={deleteApartment} disabled={linkedRecords > 0} id={unit.id} returnTo={RETURN_TO} />
              </div>
            );
          })}
        </RowList>
      )}
    </>
  );
}
