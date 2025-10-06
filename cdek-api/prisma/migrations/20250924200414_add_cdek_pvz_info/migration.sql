-- CreateEnum
CREATE TYPE "public"."CdekOfficeType" AS ENUM ('PVZ', 'POSTAMAT', 'UNKNOWN');

-- CreateTable
CREATE TABLE "public"."CdekDeliveryPoint" (
    "uuid" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerCode" TEXT,
    "type" "public"."CdekOfficeType" DEFAULT 'UNKNOWN',
    "countryCode" TEXT,
    "regionCode" INTEGER,
    "cityCode" INTEGER,
    "city" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "addressFull" TEXT,
    "weightMin" DOUBLE PRECISION,
    "weightMax" DOUBLE PRECISION,
    "takeOnly" BOOLEAN,
    "isHandout" BOOLEAN,
    "isReception" BOOLEAN,
    "isDressingRoom" BOOLEAN,
    "isMarketplace" BOOLEAN,
    "isLtl" BOOLEAN,
    "haveCashless" BOOLEAN,
    "haveCash" BOOLEAN,
    "haveFastPaymentSystem" BOOLEAN,
    "allowedCod" BOOLEAN,
    "fulfillment" BOOLEAN,
    "distance" DOUBLE PRECISION,
    "lastSeenAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "raw" JSONB NOT NULL,

    CONSTRAINT "CdekDeliveryPoint_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."CdekDPPhone" (
    "id" TEXT NOT NULL,
    "dpUuid" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "addl" TEXT,

    CONSTRAINT "CdekDPPhone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CdekDPImage" (
    "id" TEXT NOT NULL,
    "dpUuid" TEXT NOT NULL,
    "number" INTEGER,
    "url" TEXT NOT NULL,

    CONSTRAINT "CdekDPImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CdekDPWorkTime" (
    "id" TEXT NOT NULL,
    "dpUuid" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "CdekDPWorkTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CdekDPWorkTimeException" (
    "id" TEXT NOT NULL,
    "dpUuid" TEXT NOT NULL,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "dateEnd" TIMESTAMP(3) NOT NULL,
    "timeStart" TEXT,
    "timeEnd" TEXT,
    "isWorking" BOOLEAN NOT NULL,

    CONSTRAINT "CdekDPWorkTimeException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CdekDPDimension" (
    "id" TEXT NOT NULL,
    "dpUuid" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "depth" INTEGER NOT NULL,

    CONSTRAINT "CdekDPDimension_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CdekDeliveryPoint_cityCode_idx" ON "public"."CdekDeliveryPoint"("cityCode");

-- CreateIndex
CREATE INDEX "CdekDeliveryPoint_type_idx" ON "public"."CdekDeliveryPoint"("type");

-- CreateIndex
CREATE INDEX "CdekDeliveryPoint_deletedAt_idx" ON "public"."CdekDeliveryPoint"("deletedAt");

-- CreateIndex
CREATE INDEX "CdekDeliveryPoint_latitude_longitude_idx" ON "public"."CdekDeliveryPoint"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "CdekDeliveryPoint_code_ownerCode_key" ON "public"."CdekDeliveryPoint"("code", "ownerCode");

-- CreateIndex
CREATE INDEX "CdekDPPhone_dpUuid_idx" ON "public"."CdekDPPhone"("dpUuid");

-- CreateIndex
CREATE INDEX "CdekDPImage_dpUuid_idx" ON "public"."CdekDPImage"("dpUuid");

-- CreateIndex
CREATE INDEX "CdekDPWorkTime_dpUuid_idx" ON "public"."CdekDPWorkTime"("dpUuid");

-- CreateIndex
CREATE INDEX "CdekDPWorkTimeException_dpUuid_idx" ON "public"."CdekDPWorkTimeException"("dpUuid");

-- CreateIndex
CREATE INDEX "CdekDPDimension_dpUuid_idx" ON "public"."CdekDPDimension"("dpUuid");

-- AddForeignKey
ALTER TABLE "public"."CdekDPPhone" ADD CONSTRAINT "CdekDPPhone_dpUuid_fkey" FOREIGN KEY ("dpUuid") REFERENCES "public"."CdekDeliveryPoint"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CdekDPImage" ADD CONSTRAINT "CdekDPImage_dpUuid_fkey" FOREIGN KEY ("dpUuid") REFERENCES "public"."CdekDeliveryPoint"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CdekDPWorkTime" ADD CONSTRAINT "CdekDPWorkTime_dpUuid_fkey" FOREIGN KEY ("dpUuid") REFERENCES "public"."CdekDeliveryPoint"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CdekDPWorkTimeException" ADD CONSTRAINT "CdekDPWorkTimeException_dpUuid_fkey" FOREIGN KEY ("dpUuid") REFERENCES "public"."CdekDeliveryPoint"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CdekDPDimension" ADD CONSTRAINT "CdekDPDimension_dpUuid_fkey" FOREIGN KEY ("dpUuid") REFERENCES "public"."CdekDeliveryPoint"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
