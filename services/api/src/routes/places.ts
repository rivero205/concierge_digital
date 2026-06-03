// services/api/src/routes/places.ts
import { Router, type Request, type Response } from 'express'
import { getPool } from '../db.js'
import type { PlaceFilters, PlaceRow, PhotoRow, HourRow } from '../types.js'

export const placesRouter = Router()

function parseFilters(query: Request['query']): PlaceFilters | { error: string } {
  const limit  = Math.min(parseInt((query.limit  as string) ?? '20'), 100)
  const offset = parseInt((query.offset as string) ?? '0')

  if (isNaN(limit) || isNaN(offset)) return { error: 'limit and offset must be numbers' }

  const minRating = query.minRating ? parseFloat(query.minRating as string) : undefined
  if (minRating !== undefined && isNaN(minRating)) return { error: 'minRating must be a number' }

  return {
    category: query.category  as string | undefined,
    zone:     query.zone      as string | undefined,
    minRating,
    openNow:  query.openNow === 'true',
    limit,
    offset,
  }
}

// GET /api/places
placesRouter.get('/', async (req: Request, res: Response) => {
  const filters = parseFilters(req.query)
  if ('error' in filters) return void res.status(400).json({ error: filters.error })

  const params: unknown[] = ['OPERATIONAL']
  const conditions        = [`p.business_status = $1`]
  let i = 2

  if (filters.category) { conditions.push(`p.platform_category = $${i++}`); params.push(filters.category) }
  if (filters.zone)     { conditions.push(`p.zone ILIKE $${i++}`);           params.push(filters.zone)     }
  if (filters.minRating){ conditions.push(`p.rating >= $${i++}`);            params.push(filters.minRating)}

  if (filters.openNow) {
    // Cartagena UTC-5
    const now  = new Date(Date.now() - 5 * 60 * 60 * 1000)
    const day  = now.getUTCDay()
    const time = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`
    conditions.push(`EXISTS (
      SELECT 1 FROM place_hours h
      WHERE h.place_id = p.id
        AND h.day_of_week = $${i++}
        AND h.open_time  <= $${i++}::time
        AND (h.close_time IS NULL OR h.close_time >= $${i++}::time)
    )`)
    params.push(day, time, time)
  }

  const where = conditions.join(' AND ')

  const countResult = await getPool().query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM places p WHERE ${where}`, params,
  )
  const total = parseInt(countResult.rows[0].count)

  params.push(filters.limit, filters.offset)
  const { rows } = await getPool().query<PlaceRow>(
    `SELECT p.*
     FROM places p
     WHERE ${where}
     ORDER BY p.rating DESC NULLS LAST, p.user_rating_count DESC NULLS LAST
     LIMIT $${i++} OFFSET $${i}`,
    params,
  )

  res.json({ data: rows, total, limit: filters.limit, offset: filters.offset })
})

// GET /api/places/:googlePlaceId
placesRouter.get('/:googlePlaceId', async (req: Request, res: Response) => {
  const { googlePlaceId } = req.params

  const { rows: placeRows } = await getPool().query<PlaceRow>(
    `SELECT * FROM places WHERE google_place_id = $1`, [googlePlaceId],
  )
  if (!placeRows.length) return void res.status(404).json({ error: 'Place not found' })

  const place = placeRows[0]
  const { rows: photos } = await getPool().query<PhotoRow>(
    `SELECT photo_name, width_px, height_px, display_order
     FROM place_photos WHERE place_id = $1 ORDER BY display_order`, [place.id],
  )
  const { rows: hours } = await getPool().query<HourRow>(
    `SELECT day_of_week, open_time, close_time
     FROM place_hours WHERE place_id = $1 ORDER BY day_of_week`, [place.id],
  )

  res.json({ ...place, photos, hours })
})

// GET /api/places/:googlePlaceId/photo/:index — proxy de imagen sin exponer API key
placesRouter.get('/:googlePlaceId/photo/:index', async (req: Request, res: Response) => {
  const { googlePlaceId, index } = req.params
  const idx = parseInt(index)
  if (isNaN(idx) || idx < 0) return void res.status(400).json({ error: 'Invalid photo index' })

  const { rows } = await getPool().query<{ photo_name: string }>(
    `SELECT ph.photo_name
     FROM place_photos ph
     JOIN places p ON p.id = ph.place_id
     WHERE p.google_place_id = $1 AND ph.display_order = $2`,
    [googlePlaceId, idx],
  )

  if (!rows.length) return void res.status(404).json({ error: 'Photo not found' })

  const photoUrl = `https://places.googleapis.com/v1/${rows[0].photo_name}/media?maxWidthPx=800&key=${process.env.GOOGLE_API_KEY}`

  try {
    const response = await fetch(photoUrl)
    if (!response.ok) return void res.status(502).json({ error: 'Could not fetch photo' })

    res.set('Cache-Control', 'public, max-age=2592000')
    res.set('Content-Type', response.headers.get('Content-Type') ?? 'image/jpeg')
    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch {
    res.status(502).json({ error: 'Could not fetch photo' })
  }
})
