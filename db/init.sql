-- db/init.sql

CREATE TABLE IF NOT EXISTS places (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id       TEXT UNIQUE NOT NULL,
  platform_category     TEXT NOT NULL,
  zone                  TEXT NOT NULL,
  primary_type          TEXT,
  types                 TEXT[] DEFAULT '{}',
  name                  TEXT NOT NULL,
  formatted_address     TEXT,
  latitude              DECIMAL(10,7) NOT NULL,
  longitude             DECIMAL(10,7) NOT NULL,
  rating                DECIMAL(3,1),
  user_rating_count     INTEGER,
  price_level           TEXT,
  price_display         TEXT,
  phone                 TEXT,
  website               TEXT,
  editorial_summary_en  TEXT,
  editorial_summary_es  TEXT,
  business_status       TEXT DEFAULT 'OPERATIONAL',
  last_synced_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS place_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  photo_name      TEXT NOT NULL,
  width_px        INTEGER,
  height_px       INTEGER,
  display_order   INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS place_hours (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time       TIME,
  close_time      TIME
);

CREATE INDEX IF NOT EXISTS idx_places_category ON places(platform_category);
CREATE INDEX IF NOT EXISTS idx_places_zone     ON places(zone);
CREATE INDEX IF NOT EXISTS idx_places_rating   ON places(rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_places_status   ON places(business_status);
CREATE INDEX IF NOT EXISTS idx_photos_place    ON place_photos(place_id, display_order);
CREATE INDEX IF NOT EXISTS idx_hours_place     ON place_hours(place_id, day_of_week);
