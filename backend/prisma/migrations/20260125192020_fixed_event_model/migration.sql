/*
  Warnings:

  - You are about to drop the column `available_seats` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `event_date` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `event_end_date` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `is_featured` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `total_seats` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `events` table. All the data in the column will be lost.
  - Added the required column `availableSeats` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventDate` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizerContact` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizerName` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricePerSeat` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalSeats` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `events` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `events` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `events` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `events` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `events` required. This step will fail if there are existing NULL values in that column.
  - Made the column `country` on table `events` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "events_event_date_idx";

-- DropIndex
DROP INDEX "events_is_active_idx";

-- DropIndex
DROP INDEX "events_is_featured_idx";

-- DropIndex
DROP INDEX "events_venue_idx";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "available_seats",
DROP COLUMN "created_at",
DROP COLUMN "created_by",
DROP COLUMN "event_date",
DROP COLUMN "event_end_date",
DROP COLUMN "image_url",
DROP COLUMN "is_active",
DROP COLUMN "is_featured",
DROP COLUMN "price",
DROP COLUMN "total_seats",
DROP COLUMN "updated_at",
ADD COLUMN     "availableSeats" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "eventDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "organizerContact" TEXT NOT NULL,
ADD COLUMN     "organizerName" TEXT NOT NULL,
ADD COLUMN     "pricePerSeat" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "totalSeats" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL,
ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "country" DROP DEFAULT,
ALTER COLUMN "category" DROP DEFAULT,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "events_eventDate_idx" ON "events"("eventDate");

-- CreateIndex
CREATE INDEX "events_isFeatured_idx" ON "events"("isFeatured");
