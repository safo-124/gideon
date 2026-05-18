import { prisma } from "@/lib/prisma";

export const unitTypeOptions = [
  { value: "STUDIO", label: "Studio" },
  { value: "SHARED_ROOM", label: "Shared room" },
  { value: "ONE_BEDROOM", label: "1 bedroom" },
  { value: "TWO_BEDROOM", label: "2 bedroom" },
  { value: "THREE_BEDROOM", label: "3 bedroom" },
  { value: "FAMILY", label: "Family unit" },
  { value: "OTHER", label: "Other" },
] as const;

export async function getAdminCounts() {
  const [blocks, units, cabinets, keys, tenants] = await Promise.all([
    prisma.block.count(),
    prisma.apartment.count(),
    prisma.cabinet.count(),
    prisma.key.count(),
    prisma.tenant.count(),
  ]);

  return { blocks, units, cabinets, keys, tenants };
}

export async function getBlocks() {
  return prisma.block.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { apartments: true } } },
  });
}

export async function getUnits() {
  return prisma.apartment.findMany({
    orderBy: [{ blockId: "asc" }, { number: "asc" }],
    include: {
      block: true,
      _count: { select: { tenants: true, keys: true, requests: true } },
    },
  });
}

export async function getCabinets() {
  return prisma.cabinet.findMany({
    orderBy: { number: "asc" },
    include: { _count: { select: { keys: true } } },
  });
}

export async function getKeys() {
  return prisma.key.findMany({
    orderBy: { code: "asc" },
    include: {
      cabinet: true,
      apartments: {
        orderBy: { apartmentId: "asc" },
        include: { apartment: { include: { block: true } } },
      },
      _count: { select: { requests: true } },
    },
  });
}

export async function getOverviewData() {
  const [blocks, units, cabinets, keys] = await Promise.all([
    getBlocks(),
    getUnits(),
    getCabinets(),
    getKeys(),
  ]);

  return { blocks, units, cabinets, keys };
}

export type BlockRow = Awaited<ReturnType<typeof getBlocks>>[number];
export type UnitRow = Awaited<ReturnType<typeof getUnits>>[number];
export type CabinetRow = Awaited<ReturnType<typeof getCabinets>>[number];
export type KeyRow = Awaited<ReturnType<typeof getKeys>>[number];

export function unitTypeLabel(value: string) {
  return unitTypeOptions.find((option) => option.value === value)?.label ?? "Other";
}

export function bedsLabel(capacity: number) {
  return `${capacity} bed${capacity === 1 ? "" : "s"}`;
}

export function unitLabel(unit: Pick<UnitRow, "number" | "block" | "unitType" | "capacity">) {
  return `${unit.block.name} / Apt ${unit.number} - ${unitTypeLabel(unit.unitType)}, ${bedsLabel(unit.capacity)}`;
}
