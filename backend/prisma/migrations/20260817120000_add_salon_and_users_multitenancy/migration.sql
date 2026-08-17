-- CreateTable "Salon"
CREATE TABLE "Salon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Salon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Salon_slug_key" ON "Salon"("slug");

-- CreateTable "User"
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

ALTER TABLE "User" ADD CONSTRAINT "User_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default tenant so existing rows have an owner to backfill into
INSERT INTO "Salon" ("id", "name", "slug", "createdAt")
VALUES ('default-salon', 'Amanda Mendes Studio', 'amanda-mendes', CURRENT_TIMESTAMP);

-- Backfill "Service"
ALTER TABLE "Service" ADD COLUMN "salonId" TEXT;
UPDATE "Service" SET "salonId" = 'default-salon';
ALTER TABLE "Service" ALTER COLUMN "salonId" SET NOT NULL;
ALTER TABLE "Service" ADD CONSTRAINT "Service_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Service_salonId_idx" ON "Service"("salonId");
DROP INDEX "Service_name_key";
CREATE UNIQUE INDEX "Service_salonId_name_key" ON "Service"("salonId", "name");

-- Backfill "Appointment"
ALTER TABLE "Appointment" ADD COLUMN "salonId" TEXT;
UPDATE "Appointment" SET "salonId" = 'default-salon';
ALTER TABLE "Appointment" ALTER COLUMN "salonId" SET NOT NULL;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Appointment_salonId_idx" ON "Appointment"("salonId");

-- Backfill "WorkingHours"
ALTER TABLE "WorkingHours" ADD COLUMN "salonId" TEXT;
UPDATE "WorkingHours" SET "salonId" = 'default-salon';
ALTER TABLE "WorkingHours" ALTER COLUMN "salonId" SET NOT NULL;
ALTER TABLE "WorkingHours" ADD CONSTRAINT "WorkingHours_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "WorkingHours_salonId_idx" ON "WorkingHours"("salonId");
DROP INDEX "WorkingHours_weekday_key";
CREATE UNIQUE INDEX "WorkingHours_salonId_weekday_key" ON "WorkingHours"("salonId", "weekday");

-- Backfill "AvailabilityOverride"
ALTER TABLE "AvailabilityOverride" ADD COLUMN "salonId" TEXT;
UPDATE "AvailabilityOverride" SET "salonId" = 'default-salon';
ALTER TABLE "AvailabilityOverride" ALTER COLUMN "salonId" SET NOT NULL;
ALTER TABLE "AvailabilityOverride" ADD CONSTRAINT "AvailabilityOverride_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "AvailabilityOverride_salonId_idx" ON "AvailabilityOverride"("salonId");
DROP INDEX "AvailabilityOverride_date_key";
CREATE UNIQUE INDEX "AvailabilityOverride_salonId_date_key" ON "AvailabilityOverride"("salonId", "date");

-- Backfill "Transaction"
ALTER TABLE "Transaction" ADD COLUMN "salonId" TEXT;
UPDATE "Transaction" SET "salonId" = 'default-salon';
ALTER TABLE "Transaction" ALTER COLUMN "salonId" SET NOT NULL;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Transaction_salonId_idx" ON "Transaction"("salonId");
