"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

function newCabinetCode() {
  return Array.from({ length: 4 }, () => randomInt(10)).join("");
}
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SETTING_KEYS } from "@/lib/settings";

class ActionError extends Error {}

const ADMIN_PATH = "/admin";
const ADMIN_ROUTES = new Set([
  "/admin",
  "/admin/blocks",
  "/admin/units",
  "/admin/tenants",
  "/admin/cabinets",
  "/admin/keys",
  "/admin/requests",
  "/admin/settings",
]);
const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const APARTMENT_UNIT_TYPES = [
  "STUDIO",
  "SHARED_ROOM",
  "ONE_BEDROOM",
  "TWO_BEDROOM",
  "THREE_BEDROOM",
  "FAMILY",
  "OTHER",
] as const;

type ApartmentUnitTypeValue = (typeof APARTMENT_UNIT_TYPES)[number];

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function idField(formData: FormData, name = "id"): number {
  const value = Number(field(formData, name));
  if (!Number.isInteger(value) || value <= 0) {
    throw new ActionError("Missing or invalid record id.");
  }
  return value;
}

function intField(formData: FormData, name: string, label: string): number {
  const value = Number(field(formData, name));
  if (!Number.isInteger(value) || value <= 0) {
    throw new ActionError(`${label} must be a positive whole number.`);
  }
  return value;
}

function apartmentUnitTypeField(formData: FormData): ApartmentUnitTypeValue {
  const value = field(formData, "unitType");
  if (APARTMENT_UNIT_TYPES.includes(value as ApartmentUnitTypeValue)) {
    return value as ApartmentUnitTypeValue;
  }
  throw new ActionError("Choose a valid unit type.");
}

function apartmentNotesField(formData: FormData): string | null {
  const notes = field(formData, "notes");
  if (notes.length > 240) {
    throw new ActionError("Notes must be 240 characters or fewer.");
  }
  return notes || null;
}

function requiredField(formData: FormData, name: string, label: string): string {
  const value = field(formData, name);
  if (!value) throw new ActionError(`${label} is required.`);
  return value;
}

function selectedIds(formData: FormData, name: string): number[] {
  const values = formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  return [...new Set(values)];
}

function randomDigits(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += randomInt(10).toString();
  return out;
}

function randomKeyCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += KEY_ALPHABET[randomInt(KEY_ALPHABET.length)];
  }
  return out;
}

function normalizeKeyCode(value: string): string {
  return value.trim().toUpperCase();
}

function returnPath(formData: FormData, fallbackPath: string) {
  const value = field(formData, "returnTo");
  if (ADMIN_ROUTES.has(value)) return value;
  return fallbackPath;
}

function redirectBack(path: string, type: "notice" | "error", message: string): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`${path}?${params.toString()}`);
}

function actionMessage(error: unknown): string {
  if (error instanceof ActionError) return error.message;

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") return "That value is already in use.";
    if (code === "P2003" || code === "P2014") {
      return "This record is still connected to other data.";
    }
    if (code === "P2025") return "That record no longer exists.";
  }

  console.error(error);
  return "Could not save changes. Please try again.";
}

async function runAdminAction(
  formData: FormData,
  fallbackPath: string,
  successMessage: string,
  mutation: () => Promise<void>,
) {
  await requireAdmin();
  const path = returnPath(formData, fallbackPath);

  try {
    await mutation();
  } catch (error) {
    redirectBack(path, "error", actionMessage(error));
  }

  revalidatePath(ADMIN_PATH);
  revalidatePath(path);
  redirectBack(path, "notice", successMessage);
}

export async function createBlock(formData: FormData) {
  await runAdminAction(formData, "/admin/blocks", "Block created.", async () => {
    await prisma.block.create({
      data: {
        name: requiredField(formData, "name", "Block name"),
        streetName: requiredField(formData, "streetName", "Street name"),
        zip: requiredField(formData, "zip", "ZIP"),
      },
    });
  });
}

export async function updateBlock(formData: FormData) {
  await runAdminAction(formData, "/admin/blocks", "Block updated.", async () => {
    await prisma.block.update({
      where: { id: idField(formData) },
      data: {
        name: requiredField(formData, "name", "Block name"),
        streetName: requiredField(formData, "streetName", "Street name"),
        zip: requiredField(formData, "zip", "ZIP"),
      },
    });
  });
}

export async function deleteBlock(formData: FormData) {
  await runAdminAction(formData, "/admin/blocks", "Block deleted.", async () => {
    await prisma.block.delete({ where: { id: idField(formData) } });
  });
}

export async function createApartment(formData: FormData) {
  await runAdminAction(formData, "/admin/units", "Unit created.", async () => {
    await prisma.apartment.create({
      data: {
        number: intField(formData, "number", "Apartment number"),
        blockId: idField(formData, "blockId"),
        unitType: apartmentUnitTypeField(formData),
        capacity: intField(formData, "capacity", "Capacity"),
        notes: apartmentNotesField(formData),
      },
    });
  });
}

export async function updateApartment(formData: FormData) {
  await runAdminAction(formData, "/admin/units", "Unit updated.", async () => {
    await prisma.apartment.update({
      where: { id: idField(formData) },
      data: {
        number: intField(formData, "number", "Apartment number"),
        blockId: idField(formData, "blockId"),
        unitType: apartmentUnitTypeField(formData),
        capacity: intField(formData, "capacity", "Capacity"),
        notes: apartmentNotesField(formData),
      },
    });
  });
}

export async function deleteApartment(formData: FormData) {
  await runAdminAction(formData, "/admin/units", "Unit deleted.", async () => {
    await prisma.apartment.delete({ where: { id: idField(formData) } });
  });
}

export async function createCabinet(formData: FormData) {
  await runAdminAction(formData, "/admin/cabinets", "Cabinet created.", async () => {
    const currentCode = field(formData, "currentCode") || randomDigits(4);
    if (!/^\d{4}$/.test(currentCode)) {
      throw new ActionError("Cabinet code must be exactly 4 digits.");
    }

    await prisma.cabinet.create({
      data: {
        number: intField(formData, "number", "Cabinet number"),
        currentCode,
      },
    });
  });
}

export async function updateCabinet(formData: FormData) {
  await runAdminAction(formData, "/admin/cabinets", "Cabinet updated.", async () => {
    const currentCode = requiredField(formData, "currentCode", "Cabinet code");
    if (!/^\d{4}$/.test(currentCode)) {
      throw new ActionError("Cabinet code must be exactly 4 digits.");
    }

    await prisma.cabinet.update({
      where: { id: idField(formData) },
      data: {
        number: intField(formData, "number", "Cabinet number"),
        currentCode,
      },
    });
  });
}

export async function deleteCabinet(formData: FormData) {
  await runAdminAction(formData, "/admin/cabinets", "Cabinet deleted.", async () => {
    await prisma.cabinet.delete({ where: { id: idField(formData) } });
  });
}

export async function createKey(formData: FormData) {
  await runAdminAction(formData, "/admin/keys", "Key created.", async () => {
    const apartmentIds = selectedIds(formData, "apartmentIds");
    if (apartmentIds.length === 0) {
      throw new ActionError("Select at least one unit for this key.");
    }

    await prisma.key.create({
      data: {
        code: normalizeKeyCode(field(formData, "code") || randomKeyCode(8)),
        cabinetId: idField(formData, "cabinetId"),
        apartments: {
          create: apartmentIds.map((apartmentId) => ({ apartmentId })),
        },
      },
    });
  });
}

export async function updateKey(formData: FormData) {
  await runAdminAction(formData, "/admin/keys", "Key updated.", async () => {
    const keyId = idField(formData);
    const apartmentIds = selectedIds(formData, "apartmentIds");
    if (apartmentIds.length === 0) {
      throw new ActionError("Select at least one unit for this key.");
    }

    await prisma.$transaction([
      prisma.key.update({
        where: { id: keyId },
        data: {
          code: normalizeKeyCode(requiredField(formData, "code", "Key code")),
          cabinetId: idField(formData, "cabinetId"),
        },
      }),
      prisma.keyApartment.deleteMany({ where: { keyId } }),
      prisma.keyApartment.createMany({
        data: apartmentIds.map((apartmentId) => ({ keyId, apartmentId })),
      }),
    ]);
  });
}

export async function deleteKey(formData: FormData) {
  await runAdminAction(formData, "/admin/keys", "Key deleted.", async () => {
    await prisma.key.delete({ where: { id: idField(formData) } });
  });
}

// ── Tenants ──────────────────────────────────────────────────────────────────

export async function createTenant(formData: FormData) {
  await runAdminAction(formData, "/admin/tenants", "Tenant created.", async () => {
    const password = requiredField(formData, "password", "Password");
    if (password.length < 8) throw new ActionError("Password must be at least 8 characters.");
    await prisma.tenant.create({
      data: {
        fullName: requiredField(formData, "fullName", "Full name"),
        email: requiredField(formData, "email", "Email"),
        passwordHash: await bcrypt.hash(password, 10),
        apartmentId: idField(formData, "apartmentId"),
      },
    });
  });
}

export async function updateTenant(formData: FormData) {
  await runAdminAction(formData, "/admin/tenants", "Tenant updated.", async () => {
    const newPassword = field(formData, "password");
    const data: Record<string, unknown> = {
      fullName: requiredField(formData, "fullName", "Full name"),
      email: requiredField(formData, "email", "Email"),
      apartmentId: idField(formData, "apartmentId"),
    };
    if (newPassword) {
      if (newPassword.length < 8) throw new ActionError("Password must be at least 8 characters.");
      data.passwordHash = await bcrypt.hash(newPassword, 10);
    }
    await prisma.tenant.update({ where: { id: idField(formData) }, data });
  });
}

export async function deleteTenant(formData: FormData) {
  await runAdminAction(formData, "/admin/tenants", "Tenant deleted.", async () => {
    await prisma.tenant.delete({ where: { id: idField(formData) } });
  });
}

// ── Key requests ─────────────────────────────────────────────────────────────

export async function adminCancelRequest(formData: FormData) {
  await runAdminAction(formData, "/admin/requests", "Request cancelled.", async () => {
    const id = idField(formData);
    const req = await prisma.keyRequest.findUnique({ where: { id } });
    if (!req || !["AWAITING_PAYMENT", "PAID", "PENDING_AUTH"].includes(req.status)) {
      throw new ActionError("This request cannot be cancelled.");
    }
    await prisma.keyRequest.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
  });
}

export async function adminMarkReturned(formData: FormData) {
  await runAdminAction(formData, "/admin/requests", "Request marked as returned.", async () => {
    const id = idField(formData);
    const req = await prisma.keyRequest.findUnique({ where: { id }, include: { key: { include: { cabinet: true } } } });
    if (!req || req.status !== "PICKED_UP") {
      throw new ActionError("Only picked-up requests can be marked as returned.");
    }
    await prisma.$transaction([
      prisma.keyRequest.update({ where: { id }, data: { status: "RETURNED", returnedAt: new Date() } }),
      ...(req.key ? [prisma.cabinet.update({ where: { id: req.key.cabinet.id }, data: { currentCode: newCabinetCode() } })] : []),
    ]);
  });
}

export async function adminMarkLost(formData: FormData) {
  await runAdminAction(formData, "/admin/requests", "Key marked as lost.", async () => {
    const id = idField(formData);
    const lostFeeCents = Number(field(formData, "lostFeeCents")) || 10000;
    const req = await prisma.keyRequest.findUnique({ where: { id }, include: { key: { include: { cabinet: true } } } });
    if (!req || req.status !== "PICKED_UP") {
      throw new ActionError("Only picked-up requests can be marked as lost.");
    }
    await prisma.$transaction([
      prisma.keyRequest.update({ where: { id }, data: { status: "RETURNED", returnedAt: new Date(), overdueFeeCents: lostFeeCents } }),
      // Rotate code even for lost keys — the old code must be invalidated
      ...(req.key ? [prisma.cabinet.update({ where: { id: req.key.cabinet.id }, data: { currentCode: newCabinetCode() } })] : []),
    ]);
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────

// Fee keys: admin inputs euros, stored as cents
const CENTS_KEYS = new Set(["base_fee_cents", "overage_fee_cents_per_hour", "lost_key_fee_cents"]);

export async function updateSettings(formData: FormData) {
  await requireAdmin();

  const updates: { key: string; value: string }[] = [];

  for (const key of SETTING_KEYS) {
    const raw = field(formData, key);
    const num = Number(raw);
    if (!raw || !Number.isFinite(num) || num < 0) {
      const params = new URLSearchParams({ error: `Invalid value for ${key.replace(/_/g, " ")}.` });
      redirect(`/admin/settings?${params}`);
    }
    const stored = CENTS_KEYS.has(key) ? Math.round(num * 100) : Math.round(num);
    updates.push({ key, value: String(stored) });
  }

  await prisma.$transaction(
    updates.map(({ key, value }) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  );

  revalidatePath(ADMIN_PATH);
  const params = new URLSearchParams({ notice: "Settings saved." });
  redirect(`/admin/settings?${params}`);
}
