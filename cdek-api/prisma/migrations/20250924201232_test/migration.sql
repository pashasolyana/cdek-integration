/*
  Warnings:

  - You are about to drop the column `geo` on the `CdekDeliveryPoint` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."cdek_dp_geo_gix";

-- AlterTable
ALTER TABLE "public"."CdekDeliveryPoint" DROP COLUMN "geo";
