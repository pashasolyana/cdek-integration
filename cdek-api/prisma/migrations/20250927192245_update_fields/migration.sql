/*
  Warnings:

  - You are about to drop the `cdek_orders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."cdek_orders";

-- CreateTable
CREATE TABLE "public"."CdekOrder" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT,
    "cdekNumber" TEXT,
    "type" INTEGER NOT NULL,
    "additionalTypes" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "number" TEXT,
    "accompanyingNumber" TEXT,
    "tariffCode" INTEGER NOT NULL,
    "comment" TEXT,
    "shipmentPoint" TEXT,
    "deliveryPoint" TEXT,
    "dateInvoice" TIMESTAMP(3),
    "shipperName" TEXT,
    "shipperAddress" TEXT,
    "isClientReturn" BOOLEAN,
    "hasReverseOrder" BOOLEAN,
    "developerKey" TEXT,
    "printType" TEXT,
    "widgetToken" TEXT,
    "senderJson" JSONB,
    "recipientJson" JSONB,
    "fromLocationJson" JSONB,
    "toLocationJson" JSONB,
    "servicesJson" JSONB,
    "rawRequest" JSONB NOT NULL,
    "rawResponse" JSONB NOT NULL,
    "requestState" TEXT,
    "statusNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CdekOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CdekOrderPackage" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "number" TEXT,
    "weight" INTEGER,
    "length" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "comment" TEXT,
    "packageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CdekOrderPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CdekOrderItem" (
    "id" SERIAL NOT NULL,
    "packageId" INTEGER NOT NULL,
    "name" TEXT,
    "wareKey" TEXT,
    "marking" TEXT,
    "payment" JSONB,
    "weight" INTEGER,
    "weightGross" INTEGER,
    "amount" INTEGER,
    "nameI18n" TEXT,
    "brand" TEXT,
    "countryCode" TEXT,
    "material" TEXT,
    "wifiGsm" BOOLEAN,
    "url" TEXT,
    "sellerJson" JSONB,
    "cost" INTEGER,
    "feacnCode" TEXT,
    "jewelUin" TEXT,
    "used" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CdekOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CdekOrderRequest" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "requestUuid" TEXT,
    "type" TEXT,
    "dateTime" TIMESTAMP(3),
    "state" TEXT,
    "errorsJson" JSONB,
    "warningsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CdekOrderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CdekOrderRelated" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "uuid" TEXT,
    "type" TEXT,
    "url" TEXT,
    "createTime" TIMESTAMP(3),
    "cdekNumber" TEXT,
    "date" TIMESTAMP(3),
    "timeFrom" TEXT,
    "timeTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CdekOrderRelated_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CdekOrder_uuid_key" ON "public"."CdekOrder"("uuid");

-- AddForeignKey
ALTER TABLE "public"."CdekOrderPackage" ADD CONSTRAINT "CdekOrderPackage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."CdekOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CdekOrderItem" ADD CONSTRAINT "CdekOrderItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."CdekOrderPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CdekOrderRequest" ADD CONSTRAINT "CdekOrderRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."CdekOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CdekOrderRelated" ADD CONSTRAINT "CdekOrderRelated_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."CdekOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
