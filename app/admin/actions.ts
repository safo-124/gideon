"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomInt } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

class ActionError extends Error {}

const ADMIN_PATH = "/admin";
const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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

function redirectWith(section: string, type: "notice" | "error", message: string): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`${ADMIN_PATH}?${params.toString()}#${section}`);
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
  section: string,
  successMessage: string,
  mutation: () => Promise<void>,
) {
  await requireAdmin();

  try {
    await mutation();
  } catch (error) {
    redirectWith(section, "error", actionMessage(error));
  }

  revalidatePath(ADMIN_PATH);
  redirectWith(section, "notice", successMessage);
}

export async function createBlock(formData: FormData) {
  await runAdminAction("blocks", "Block created.", async () => {
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
  await runAdminAction("blocks", "Block updated.", async () => {
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
  await runAdminAction("blocks", "Block deleted.", async () => {
    await prisma.block.delete({ where: { id: idField(formData) } });
  });
}

export async function createApartment(formData: FormData) {
  await runAdminAction("apartments", "Apartment created.", async () => {
    await prisma.apartment.create({
      data: {
        number: intField(formData, "number", "Apartment number"),
        blockId: idField(formData, "blockId"),
      },
    });
  });
}

export async function updateApartment(formData: FormData) {
  await runAdminAction("apartments", "Apartment updated.", async () => {
    await prisma.apartment.update({
      where: { id: idField(formData) },
      data: {
        number: intField(formData, "number", "Apartment number"),
        blockId: idField(formData, "blockId"),
      },
    });
  });
}

export async function deleteApartment(formData: FormData) {
  await runAdminAction("apartments", "Apartment deleted.", async () => {
    await prisma.apartment.delete({ where: { id: idField(formData) } });
  });
}

export async function createCabinet(formData: FormData) {
  await runAdminAction("cabinets", "Cabinet created.", async () => {
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
  await runAdminAction("cabinets", "Cabinet updated.", async () => {
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
  await runAdminAction("cabinets", "Cabinet deleted.", async () => {
    await prisma.cabinet.delete({ where: { id: idField(formData) } });
  });
}

export async function createKey(formData: FormData) {
  await runAdminAction("keys", "Key created.", async () => {
    const apartmentIds = selectedIds(formData, "apartmentIds");
    if (apartmentIds.length === 0) {
      throw new ActionError("Select at least one apartment for this key.");
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
  await runAdminAction("keys", "Key updated.", async () => {
    const keyId = idField(formData);
    const apartmentIds = selectedIds(formData, "apartmentIds");
    if (apartmentIds.length === 0) {
      throw new ActionError("Select at least one apartment for this key.");
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
  await runAdminAction("keys", "Key deleted.", async () => {
    await prisma.key.delete({ where: { id: idField(formData) } });
  });
}
