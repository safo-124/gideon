import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { readSession } from "./session";

export async function getCurrentTenant() {
  const session = await readSession();
  if (!session || session.role !== "tenant") return null;
  return prisma.tenant.findUnique({
    where: { id: session.id },
    include: { apartment: { include: { block: true } } },
  });
}

export async function getCurrentAdmin() {
  const session = await readSession();
  if (!session || session.role !== "admin") return null;
  return prisma.admin.findUnique({ where: { id: session.id } });
}

export async function requireTenant() {
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/login");
  return tenant;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
