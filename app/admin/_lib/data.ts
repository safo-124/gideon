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
  const [blocks, units, cabinets, keys, tenants, requests] = await Promise.all([
    prisma.block.count(),
    prisma.apartment.count(),
    prisma.cabinet.count(),
    prisma.key.count(),
    prisma.tenant.count(),
    prisma.keyRequest.count({ where: { status: { in: ["AWAITING_PAYMENT", "PAID", "PICKED_UP"] } } }),
  ]);

  return { blocks, units, cabinets, keys, tenants, requests };
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

export async function getTenants() {
  return prisma.tenant.findMany({
    orderBy: { fullName: "asc" },
    include: {
      apartment: {
        include: {
          block: true,
          _count: { select: { tenants: true, keys: true } },
        },
      },
      _count: { select: { requests: true } },
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

export async function getRequests(statusFilter?: string) {
  const activeStatuses = ["AWAITING_PAYMENT", "PAID", "PICKED_UP"] as const;

  const where =
    statusFilter === "active"
      ? { status: { in: activeStatuses } }
      : statusFilter === "overdue"
        ? { status: "PICKED_UP" as const, dueAt: { lt: new Date() } }
        : statusFilter === "completed"
          ? { status: { in: ["RETURNED", "CANCELLED", "DISPUTED"] as const } }
          : undefined;

  return prisma.keyRequest.findMany({
    where,
    include: {
      requester: { select: { id: true, fullName: true, email: true } },
      apartment: { include: { block: true } },
      key: { include: { cabinet: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRequestStats() {
  const now = new Date();
  const [total, active, overdue, disputed] = await Promise.all([
    prisma.keyRequest.count(),
    prisma.keyRequest.count({ where: { status: { in: ["AWAITING_PAYMENT", "PAID", "PICKED_UP"] } } }),
    prisma.keyRequest.count({ where: { status: "PICKED_UP", dueAt: { lt: now } } }),
    prisma.keyRequest.count({ where: { status: "DISPUTED" } }),
  ]);
  return { total, active, overdue, disputed };
}

export async function getBlocksWithApartments() {
  return prisma.block.findMany({
    orderBy: { name: "asc" },
    include: {
      apartments: { orderBy: { number: "asc" }, select: { id: true, number: true } },
    },
  });
}

export async function getOverviewData() {
  const [blocks, units, tenants, cabinets, keys] = await Promise.all([
    getBlocks(),
    getUnits(),
    getTenants(),
    getCabinets(),
    getKeys(),
  ]);

  return { blocks, units, tenants, cabinets, keys };
}

export type BlockRow = Awaited<ReturnType<typeof getBlocks>>[number];
export type UnitRow = Awaited<ReturnType<typeof getUnits>>[number];
export type TenantRow = Awaited<ReturnType<typeof getTenants>>[number];
export type CabinetRow = Awaited<ReturnType<typeof getCabinets>>[number];
export type KeyRow = Awaited<ReturnType<typeof getKeys>>[number];
export type RequestRow = Awaited<ReturnType<typeof getRequests>>[number];

export function unitTypeLabel(value: string) {
  return unitTypeOptions.find((option) => option.value === value)?.label ?? "Other";
}

export function bedsLabel(capacity: number) {
  return `${capacity} bed${capacity === 1 ? "" : "s"}`;
}

export function unitLabel(unit: Pick<UnitRow, "number" | "block" | "unitType" | "capacity">) {
  return `${unit.block.name} / Apt ${unit.number} - ${unitTypeLabel(unit.unitType)}, ${bedsLabel(unit.capacity)}`;
}
