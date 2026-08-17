-- CreateTable
CREATE TABLE "AvailabilityOverride" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "intervalMin" INTEGER,

    CONSTRAINT "AvailabilityOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityOverride_date_key" ON "AvailabilityOverride"("date");
