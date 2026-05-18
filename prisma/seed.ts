import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/1/O/I to avoid confusion

function randomCode(len: number, alphabet = ALPHANUM): string {
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function randomDigits(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) out += Math.floor(Math.random() * 10).toString();
  return out;
}

// Pick 2 apartments per key such that they are either in different blocks
// or numerically >= MIN_GAP apart in the same block. Anti-walk-around constraint.
const MIN_GAP = 8;

function pickPair(apartments: Array<{ id: number; number: number; blockId: number }>, used: Set<string>) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const a = apartments[Math.floor(Math.random() * apartments.length)];
    const b = apartments[Math.floor(Math.random() * apartments.length)];
    if (a.id === b.id) continue;
    const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
    if (used.has(key)) continue;
    const farEnough = a.blockId !== b.blockId || Math.abs(a.number - b.number) >= MIN_GAP;
    if (!farEnough) continue;
    used.add(key);
    return [a, b];
  }
  throw new Error("Could not find a valid apartment pair under the spacing constraint");
}

type ApartmentSeedProfile = {
  unitType:
    | "STUDIO"
    | "SHARED_ROOM"
    | "ONE_BEDROOM"
    | "TWO_BEDROOM"
    | "THREE_BEDROOM"
    | "FAMILY"
    | "OTHER";
  capacity: number;
  notes?: string;
};

function apartmentProfile(number: number): ApartmentSeedProfile {
  if (number % 10 === 0) return { unitType: "FAMILY", capacity: 4, notes: "Family unit" };
  if (number % 8 === 0) return { unitType: "THREE_BEDROOM", capacity: 3, notes: "Three-person room" };
  if (number % 5 === 0) return { unitType: "SHARED_ROOM", capacity: 2, notes: "Two-person shared room" };
  if (number % 4 === 0) return { unitType: "TWO_BEDROOM", capacity: 2 };
  return { unitType: "STUDIO", capacity: 1 };
}

async function main() {
  // Wipe in dependency order (safe on a freshly migrated DB too)
  await prisma.keyRequest.deleteMany();
  await prisma.keyApartment.deleteMany();
  await prisma.key.deleteMany();
  await prisma.cabinet.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.apartment.deleteMany();
  await prisma.block.deleteMany();
  await prisma.admin.deleteMany();

  // Admin
  await prisma.admin.create({
    data: {
      username: "org_admin",
      passwordHash: await bcrypt.hash("DeepThink12", 10),
    },
  });

  // Blocks
  const mikontalo = await prisma.block.create({
    data: { name: "Mikontalo", streetName: "Insinöörinkatu 60", zip: "33720" },
  });
  const paawola = await prisma.block.create({
    data: { name: "Paawola", streetName: "Insinöörinkatu 20", zip: "33700" },
  });

  // Apartments: 1-23 in Mikontalo, 24-40 in Paawola
  const apartments: Array<{ id: number; number: number; blockId: number }> = [];
  for (let n = 1; n <= 23; n++) {
    const apt = await prisma.apartment.create({
      data: { number: n, blockId: mikontalo.id, ...apartmentProfile(n) },
    });
    apartments.push({ id: apt.id, number: apt.number, blockId: apt.blockId });
  }
  for (let n = 24; n <= 40; n++) {
    const apt = await prisma.apartment.create({
      data: { number: n, blockId: paawola.id, ...apartmentProfile(n) },
    });
    apartments.push({ id: apt.id, number: apt.number, blockId: apt.blockId });
  }

  // 10 cabinets, each with a starting 4-digit code
  const cabinets = [];
  for (let i = 1; i <= 10; i++) {
    const cab = await prisma.cabinet.create({
      data: { number: i, currentCode: randomDigits(4) },
    });
    cabinets.push(cab);
  }

  // 10 keys, each in its own cabinet, mapped to 2 apartments under MIN_GAP constraint
  const usedPairs = new Set<string>();
  const usedKeyCodes = new Set<string>();
  for (let i = 0; i < 10; i++) {
    let code: string;
    do {
      code = randomCode(8);
    } while (usedKeyCodes.has(code));
    usedKeyCodes.add(code);

    const [aptA, aptB] = pickPair(apartments, usedPairs);
    await prisma.key.create({
      data: {
        code,
        cabinetId: cabinets[i].id,
        apartments: {
          create: [{ apartmentId: aptA.id }, { apartmentId: aptB.id }],
        },
      },
    });
  }

  // Tenants
  // Gideon: apt 25 (Paawola — apt number trumps block per user decision)
  const apt25 = apartments.find((a) => a.number === 25)!;
  // Nana: apt 38 (Paawola)
  const apt38 = apartments.find((a) => a.number === 38)!;

  await prisma.tenant.create({
    data: {
      fullName: "Gideon Ofori",
      email: "ayidzim@gmail.com",
      passwordHash: await bcrypt.hash("deepthink12", 10),
      apartmentId: apt25.id,
    },
  });
  await prisma.tenant.create({
    data: {
      fullName: "Nana Bonah",
      email: "kofiobg39@gmail.com",
      passwordHash: await bcrypt.hash("deepthink23", 10),
      apartmentId: apt38.id,
    },
  });

  // Report
  const keysWithMap = await prisma.key.findMany({
    include: { apartments: { include: { apartment: { include: { block: true } } } }, cabinet: true },
    orderBy: { id: "asc" },
  });
  console.log("Seeded:");
  console.log(`  • 1 admin (org_admin)`);
  console.log(`  • 2 blocks, ${apartments.length} apartments`);
  console.log(`  • ${cabinets.length} cabinets`);
  console.log(`  • ${keysWithMap.length} keys:`);
  for (const k of keysWithMap) {
    const map = k.apartments
      .map((ka) => `${ka.apartment.block.name} #${ka.apartment.number}`)
      .join(", ");
    console.log(`      ${k.code}  cab#${k.cabinet.number}  →  ${map}`);
  }
  console.log(`  • 2 tenants (Gideon@Paawola 25, Nana@Paawola 38)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
