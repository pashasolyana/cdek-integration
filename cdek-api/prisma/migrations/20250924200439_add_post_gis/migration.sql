-- This is an empty migration.-- 002_postgis_and_geo.sql
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "CdekDeliveryPoint"
  ADD COLUMN IF NOT EXISTS "geo" geography(Point, 4326)
  GENERATED ALWAYS AS (
    CASE
      WHEN "longitude" IS NOT NULL AND "latitude" IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint("longitude","latitude"),4326)::geography
      ELSE NULL
    END
  ) STORED;

CREATE INDEX IF NOT EXISTS "cdek_dp_geo_gix"
  ON "CdekDeliveryPoint" USING GIST ("geo");
