import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const [tenants, apartments, keys, cabinets] = await Promise.all([
      prisma.tenant.count(),
      prisma.apartment.count(),
      prisma.key.count(),
      prisma.cabinet.count(),
    ]);
    console.log(
      `✅ Connected — ${tenants} tenant(s), ${apartments} apartment(s), ${keys} key(s), ${cabinets} cabinet(s)`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
