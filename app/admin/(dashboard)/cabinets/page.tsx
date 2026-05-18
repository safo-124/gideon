import { createCabinet, deleteCabinet, updateCabinet } from "../../actions";
import {
  AddPanel,
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
  type AdminSearchParams,
} from "../../_components/ui";
import { getCabinets } from "../../_lib/data";

export const metadata = { title: "Cabinets - Admin" };

const RETURN_TO = "/admin/cabinets";
const columns = "md:grid-cols-[8rem_8rem_9rem_1fr_6rem_6rem] md:items-end md:gap-3";

export default async function CabinetsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const params = await searchParams;
  const cabinets = await getCabinets();
  const cabinetsInUse = cabinets.filter((cabinet) => cabinet._count.keys > 0).length;
  const emptyCabinets = cabinets.length - cabinetsInUse;
  const keySlots = cabinets.reduce((sum, cabinet) => sum + cabinet._count.keys, 0);

  return (
    <>
      <PageHeader
        description="Keep each physical cabinet number and current access code in one predictable list."
        eyebrow="Storage"
        title="Cabinets"
      />

      <Flash error={firstParam(params.error)} notice={firstParam(params.notice)} />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard helper={`${emptyCabinets} empty`} label="Cabinets" tone="teal" value={cabinets.length} />
        <StatCard helper="Holding keys" label="In use" tone="amber" value={cabinetsInUse} />
        <StatCard helper="Assigned key records" label="Keys stored" tone="zinc" value={keySlots} />
      </div>

      <AddPanel>
        <form action={createCabinet} className="grid gap-3 md:grid-cols-[8rem_8rem_7rem] md:items-end">
          <ReturnTo value={RETURN_TO} />
          <label>
            <FieldLabel>Cabinet</FieldLabel>
            <input className={inputClass} min={1} name="number" placeholder="1" required type="number" />
          </label>
          <label>
            <FieldLabel>Code</FieldLabel>
            <input className={inputClass} inputMode="numeric" maxLength={4} name="currentCode" pattern="[0-9]{4}" placeholder="Auto" />
          </label>
          <button className={buttonClass} type="submit">
            Add cabinet
          </button>
        </form>
      </AddPanel>

      {cabinets.length === 0 ? (
        <EmptyState>No cabinets yet. Add cabinet slots before assigning keys.</EmptyState>
      ) : (
        <RowList columns={columns} headers={["Cabinet", "Code", "Keys", "Status", "", ""]}>
          {cabinets.map((cabinet) => {
            const hasKeys = cabinet._count.keys > 0;

            return (
              <div className={`grid gap-3 p-4 ${columns}`} key={cabinet.id}>
                <form action={updateCabinet} className="contents">
                  <ReturnTo value={RETURN_TO} />
                  <input name="id" type="hidden" value={cabinet.id} />
                  <label>
                    <FieldLabel>Cabinet</FieldLabel>
                    <input className={inputClass} defaultValue={cabinet.number} min={1} name="number" required type="number" />
                  </label>
                  <label>
                    <FieldLabel>Code</FieldLabel>
                    <input className={inputClass} defaultValue={cabinet.currentCode} inputMode="numeric" maxLength={4} name="currentCode" pattern="[0-9]{4}" required />
                  </label>
                  <div>
                    <FieldLabel>Keys</FieldLabel>
                    <div className="flex h-9 items-center rounded-md bg-zinc-50 px-2.5 text-sm font-medium tabular-nums text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                      {cabinet._count.keys}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Status</FieldLabel>
                    <div className="flex h-9 items-center">
                      <Pill tone={hasKeys ? "teal" : "zinc"}>{hasKeys ? "In use" : "Empty"}</Pill>
                    </div>
                  </div>
                  <button className={buttonClass} type="submit">
                    Save
                  </button>
                </form>
                <DeleteForm action={deleteCabinet} disabled={hasKeys} id={cabinet.id} returnTo={RETURN_TO} />
              </div>
            );
          })}
        </RowList>
      )}
    </>
  );
}
