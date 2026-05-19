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

export async function getBlocks() {
  return prisma.block.findMany({ orderBy: { name: "asc" } });
}

export async function getBlocksForSignup() {
  return prisma.block.findMany({
    orderBy: { name: "asc" },
    include: {
      apartments: {
        select: { id: true, number: true },
        orderBy: { number: "asc" },
      },
    },
  });
}

export type BlocksForSignup = Awaited<ReturnType<typeof getBlocksForSignup>>;

export async function getApartmentByBlockAndNumber(blockId: number, number: number) {
  return prisma.apartment.findFirst({
    where: { blockId, number },
    include: {
      block: true,
      _count: { select: { tenants: true } },
    },
  });
}

export async function getRequestByDisputeToken(token: string) {
  return prisma.keyRequest.findUnique({
    where: { disputeToken: token },
    include: {
      apartment: { include: { block: true } },
      requester: { select: { fullName: true } },
    },
  });
}

export async function getPastRequests(tenantId: number) {
  return prisma.keyRequest.findMany({
    where: {
      requesterId: tenantId,
      status: { in: ["RETURNED", "CANCELLED", "DISPUTED"] },
    },
    include: { apartment: { include: { block: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export type ActiveRequest = Awaited<ReturnType<typeof getActiveRequest>>;
export type RequestDetail = Awaited<ReturnType<typeof getRequest>>;
export type ApartmentWithBlock = Awaited<ReturnType<typeof getApartmentByBlockAndNumber>>;
export type PastRequest = Awaited<ReturnType<typeof getPastRequests>>[number];
