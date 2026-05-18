import { prisma } from "@/lib/prisma";

export async function getActiveRequest(tenantId: number) {
  return prisma.keyRequest.findFirst({
    where: {
      requesterId: tenantId,
      status: { notIn: ["RETURNED", "CANCELLED"] },
    },
    include: {
      key: { include: { cabinet: true } },
      apartment: { include: { block: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRequest(id: number, tenantId: number) {
  return prisma.keyRequest.findFirst({
    where: { id, requesterId: tenantId },
    include: {
      key: { include: { cabinet: true } },
      apartment: { include: { block: true } },
    },
  });
}

export async function findAvailableKey(apartmentId: number) {
  return prisma.key.findFirst({
    where: {
      apartments: { some: { apartmentId } },
      requests: { none: { status: { in: ["PAID", "PICKED_UP"] } } },
    },
    include: { cabinet: true },
  });
}

export type ActiveRequest = Awaited<ReturnType<typeof getActiveRequest>>;
export type RequestDetail = Awaited<ReturnType<typeof getRequest>>;
