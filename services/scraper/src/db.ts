// services/scraper/src/db.ts
import pg from 'pg'
import type { GooglePlace, GooglePlaceHourPeriod } from './types.js'
import { PRICE_DISPLAY } from './categories.js'

const { Pool } = pg

export function createPool(connectionString: string) {
  return new Pool({ connectionString, max: 5 })
}

export async function upsertPlace(
  pool: pg.Pool,
  place: GooglePlace,
  category: string,
  zone: string,
  summaryEs: string | null,
): Promise<string> {
  const priceDisplay = place.priceLevel ? (PRICE_DISPLAY[place.priceLevel] ?? null) : null

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO places (
       google_place_id, platform_category, zone, primary_type, types,
       name, formatted_address, latitude, longitude,
       rating, user_rating_count, price_level, price_display,
       phone, website, editorial_summary_en, editorial_summary_es,
       business_status, last_synced_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW()
     )
     ON CONFLICT (google_place_id) DO UPDATE SET
       platform_category     = EXCLUDED.platform_category,
       zone                  = EXCLUDED.zone,
       primary_type          = EXCLUDED.primary_type,
       types                 = EXCLUDED.types,
       name                  = EXCLUDED.name,
       formatted_address     = EXCLUDED.formatted_address,
       rating                = EXCLUDED.rating,
       user_rating_count     = EXCLUDED.user_rating_count,
       price_level           = EXCLUDED.price_level,
       price_display         = EXCLUDED.price_display,
       phone                 = EXCLUDED.phone,
       website               = EXCLUDED.website,
       editorial_summary_en  = EXCLUDED.editorial_summary_en,
       editorial_summary_es  = COALESCE(EXCLUDED.editorial_summary_es, places.editorial_summary_es),
       business_status       = EXCLUDED.business_status,
       last_synced_at        = NOW()
     RETURNING id`,
    [
      place.id,
      category,
      zone,
      place.primaryType ?? null,
      place.types,
      place.displayName.text,
      place.formattedAddress ?? null,
      place.location.latitude,
      place.location.longitude,
      place.rating ?? null,
      place.userRatingCount ?? null,
      place.priceLevel ?? null,
      priceDisplay,
      place.internationalPhoneNumber ?? null,
      place.websiteUri ?? null,
      place.editorialSummary?.text ?? null,
      summaryEs,
      place.businessStatus ?? 'OPERATIONAL',
    ],
  )

  return rows[0].id
}

export async function upsertPhotos(
  pool: pg.Pool,
  placeId: string,
  photos: GooglePlace['photos'],
): Promise<void> {
  if (!photos?.length) return
  await pool.query(`DELETE FROM place_photos WHERE place_id = $1`, [placeId])
  for (let i = 0; i < Math.min(photos.length, 5); i++) {
    const p = photos[i]
    await pool.query(
      `INSERT INTO place_photos (place_id, photo_name, width_px, height_px, display_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [placeId, p.name, p.widthPx, p.heightPx, i],
    )
  }
}

export async function upsertHours(
  pool: pg.Pool,
  placeId: string,
  periods: GooglePlaceHourPeriod[] | undefined,
): Promise<void> {
  if (!periods?.length) return
  await pool.query(`DELETE FROM place_hours WHERE place_id = $1`, [placeId])
  for (const period of periods) {
    const openTime  = `${String(period.open.hour).padStart(2, '0')}:${String(period.open.minute).padStart(2, '0')}`
    const closeTime = period.close
      ? `${String(period.close.hour).padStart(2, '0')}:${String(period.close.minute).padStart(2, '0')}`
      : null
    await pool.query(
      `INSERT INTO place_hours (place_id, day_of_week, open_time, close_time)
       VALUES ($1, $2, $3, $4)`,
      [placeId, period.open.day, openTime, closeTime],
    )
  }
}
