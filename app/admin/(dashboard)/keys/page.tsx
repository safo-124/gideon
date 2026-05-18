import { createKey, deleteKey, updateKey } from "../../actions";
import {
  AddPanel,
  CabinetSelect,
  DeleteForm,
  EmptyState,
  FieldLabel,
  Flash,
  PageHeader,
  Pill,
  ReturnTo,
  UnitChecklist,
  buttonClass,
  firstParam,
  inputClass,
  type AdminSearchParams,
} from "../../_components/ui";
import { getCabinets, getKeys, getUnits, unitLabel } from "../../_lib/data";

export const metadata = { title: "Keys - Admin" };

const RETURN_TO = "/admin/keys";

export default async function KeysPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const params = await searchParams;
  const [cabinets, keys, units] = await Promise.all([getCabinets(), getKeys(), getUnits()]);
  const canCreate = cabinets.length > 0 && units.length > 0;
  const unassignedKeys = keys.filter((key) => key.apartments.length === 0).length;

  return (
    <>
      <PageHeader
        description="Assign each spare key to a cabinet and the units it can open."
        eyebrow="Access"
        title="Keys"
      >
        <Pill tone={unassignedKeys > 0 ? "amber" : "teal"}>{unassignedKeys} unassigned</Pill>
      </PageHeader>

      <Flash error={firstParam(params.error)} notice={firstParam(params.notice)} />

      <AddPanel>
        <form action={createKey} className="grid gap-4">
          <ReturnTo value={RETURN_TO} />
          <div className="grid gap-3 md:grid-cols-[12rem_14rem_8rem] md:items-end">
            <label>
              <FieldLabel>Key code</FieldLabel>
              <input className={inputClass} maxLength={16} name="code" placeholder="Auto" />
            </label>
            <label>
              <FieldLabel>Cabinet</FieldLabel>
              <CabinetSelect cabinets={cabinets} />
            </label>
            <button className={buttonClass} disabled={!canCreate} type="submit">
              Add key
            </button>
          </div>
          <div>
            <FieldLabel>Units this key opens</FieldLabel>
            {units.length === 0 ? <EmptyState>Add units before creating keys.</EmptyState> : <UnitChecklist units={units} />}
          </div>
        </form>
      </AddPanel>

      {cabinets.length === 0 ? (
        <EmptyState>Add a cabinet before creating keys.</EmptyState>
      ) : keys.length === 0 ? (
        <EmptyState>No keys yet. Add the first key and connect it to one or more units.</EmptyState>
      ) : (
        <div className="grid gap-4">
          {keys.map((key) => {
            const selectedIds = key.apartments.map((link) => link.apartmentId);
            const linkedRequests = key._count.requests;

            return (
              <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950" key={key.id}>
                <div className="mb-4 flex flex-col gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-base font-semibold">{key.code}</div>
                    <div className="mt-1 text-sm text-zinc-500">
                      Cabinet {key.cabinet.number} / code {key.cabinet.currentCode}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={key.apartments.length > 0 ? "teal" : "amber"}>
                      {key.apartments.length} unit{key.apartments.length === 1 ? "" : "s"}
                    </Pill>
                    <Pill tone={linkedRequests > 0 ? "amber" : "zinc"}>
                      {linkedRequests} request{linkedRequests === 1 ? "" : "s"}
                    </Pill>
                  </div>
                </div>

                <form action={updateKey} className="grid gap-4">
                  <ReturnTo value={RETURN_TO} />
                  <input name="id" type="hidden" value={key.id} />
                  <div className="grid gap-3 md:grid-cols-[12rem_14rem_6rem] md:items-end">
                    <label>
                      <FieldLabel>Key code</FieldLabel>
                      <input className={inputClass} defaultValue={key.code} maxLength={16} name="code" required />
                    </label>
                    <label>
                      <FieldLabel>Cabinet</FieldLabel>
                      <CabinetSelect cabinets={cabinets} defaultValue={key.cabinetId} />
                    </label>
                    <button className={buttonClass} type="submit">
                      Save
                    </button>
                  </div>
                  <div>
                    <FieldLabel>Assigned units</FieldLabel>
                    <UnitChecklist selectedIds={selectedIds} units={units} />
                  </div>
                </form>

                <div className="mt-4 flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-zinc-500">
                    {key.apartments.length > 0
                      ? key.apartments.map((link) => unitLabel(link.apartment)).join(", ")
                      : "No unit assignment yet."}
                  </div>
                  <DeleteForm action={deleteKey} disabled={linkedRequests > 0} id={key.id} returnTo={RETURN_TO} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
