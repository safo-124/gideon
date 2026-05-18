import { createBlock, deleteBlock, updateBlock } from "../../actions";
import {
  AddPanel,
  DeleteForm,
  EmptyState,
  FieldLabel,
  Flash,
  PageHeader,
  ReturnTo,
  RowList,
  buttonClass,
  firstParam,
  inputClass,
  type AdminSearchParams,
} from "../../_components/ui";
import { getBlocks } from "../../_lib/data";

export const metadata = { title: "Blocks - Admin" };

const RETURN_TO = "/admin/blocks";
const columns = "md:grid-cols-[1.1fr_1.4fr_7rem_7rem_6rem_6rem] md:items-end md:gap-3";

export default async function BlocksPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const params = await searchParams;
  const blocks = await getBlocks();

  return (
    <>
      <PageHeader
        description="Create the buildings that units belong to, then keep addresses and ZIP codes current."
        eyebrow="Inventory"
        title="Blocks"
      />

      <Flash error={firstParam(params.error)} notice={firstParam(params.notice)} />

      <AddPanel>
        <form action={createBlock} className="grid gap-3 md:grid-cols-[1.1fr_1.4fr_7rem_7rem] md:items-end">
          <ReturnTo value={RETURN_TO} />
          <label>
            <FieldLabel>Block name</FieldLabel>
            <input className={inputClass} name="name" placeholder="Block A" required />
          </label>
          <label>
            <FieldLabel>Street</FieldLabel>
            <input className={inputClass} name="streetName" placeholder="Main Street" required />
          </label>
          <label>
            <FieldLabel>ZIP</FieldLabel>
            <input className={inputClass} name="zip" placeholder="10001" required />
          </label>
          <button className={buttonClass} type="submit">
            Add block
          </button>
        </form>
      </AddPanel>

      {blocks.length === 0 ? (
        <EmptyState>No blocks yet. Add the first block to start organizing units.</EmptyState>
      ) : (
        <RowList columns={columns} headers={["Block", "Street", "ZIP", "Units", "", ""]}>
          {blocks.map((block) => {
            const hasUnits = block._count.apartments > 0;

            return (
              <div className={`grid gap-3 p-4 ${columns}`} key={block.id}>
                <form action={updateBlock} className="contents">
                  <ReturnTo value={RETURN_TO} />
                  <input name="id" type="hidden" value={block.id} />
                  <label>
                    <FieldLabel>Block</FieldLabel>
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
                    <FieldLabel>Units</FieldLabel>
                    <div className="flex h-9 items-center rounded-md bg-zinc-50 px-2.5 text-sm font-medium tabular-nums text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                      {block._count.apartments}
                    </div>
                  </div>
                  <button className={buttonClass} type="submit">
                    Save
                  </button>
                </form>
                <DeleteForm action={deleteBlock} disabled={hasUnits} id={block.id} returnTo={RETURN_TO} />
              </div>
            );
          })}
        </RowList>
      )}
    </>
  );
}
