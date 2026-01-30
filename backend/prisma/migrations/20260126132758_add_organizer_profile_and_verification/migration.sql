/*
  Warnings:

  - You are about to alter the column `title` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to alter the column `venue` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to alter the column `address` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `city` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `state` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `country` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `currency` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(10)`.
  - You are about to alter the column `imageUrl` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `organizerContact` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `organizerName` on the `events` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.

*/
-- CreateEnum
CREATE TYPE "OrganizerVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- DropIndex
DROP INDEX "events_isFeatured_idx";

-- AlterTable
ALTER TABLE "events" ALTER COLUMN "title" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "venue" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "address" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "city" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "state" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "country" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "currency" SET DATA TYPE VARCHAR(10),
ALTER COLUMN "imageUrl" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "organizerContact" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "organizerName" SET DATA TYPE VARCHAR(200);

-- CreateTable
CREATE TABLE "organizer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" VARCHAR(200) NOT NULL,
    "businessRegistration" VARCHAR(100),
    "taxId" VARCHAR(100),
    "website" VARCHAR(500),
    "socialMediaLinks" JSONB,
    "description" TEXT NOT NULL,
    "businessAddress" VARCHAR(500),
    "businessCity" VARCHAR(100),
    "businessState" VARCHAR(100),
    "businessCountry" VARCHAR(100),
    "verificationStatus" "OrganizerVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationDocuments" TEXT[],
    "rejectionReason" TEXT,
    "eventsCreated" INTEGER NOT NULL DEFAULT 0,
    "eventsCompleted" INTEGER NOT NULL DEFAULT 0,
    "eventsPublished" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "suspendedBy" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizer_profiles_userId_key" ON "organizer_profiles"("userId");

-- CreateIndex
CREATE INDEX "organizer_profiles_userId_idx" ON "organizer_profiles"("userId");

-- CreateIndex
CREATE INDEX "organizer_profiles_verificationStatus_idx" ON "organizer_profiles"("verificationStatus");

-- CreateIndex
CREATE INDEX "events_createdBy_idx" ON "events"("createdBy");

-- AddForeignKey
ALTER TABLE "organizer_profiles" ADD CONSTRAINT "organizer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer_profiles" ADD CONSTRAINT "organizer_profiles_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
