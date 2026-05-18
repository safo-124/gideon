-- CreateEnum
CREATE TYPE "ApartmentUnitType" AS ENUM (
    'STUDIO',
    'SHARED_ROOM',
    'ONE_BEDROOM',
    'TWO_BEDROOM',
    'THREE_BEDROOM',
    'FAMILY',
    'OTHER'
);

-- AlterTable
ALTER TABLE "Apartment"
ADD COLUMN "unitType" "ApartmentUnitType" NOT NULL DEFAULT 'STUDIO',
ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "notes" TEXT;
