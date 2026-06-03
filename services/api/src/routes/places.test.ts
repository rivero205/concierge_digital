import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { placesRouter } from './places.js'

const mockRow = {
  count: '1',
  id: 'uuid-1',
  google_place_id: 'ChIJabc',
  platform_category: 'restaurants',
  zone: 'Bocagrande',
  primary_type: 'restaurant',
  types: ['restaurant'],
  name: 'Test Restaurant',
  formatted_address: 'Calle 1 #2-3',
  latitude: '10.4236',
  longitude: '-75.5516',
  rating: '4.5',
  user_rating_count: 100,
  price_level: 'PRICE_LEVEL_MODERATE',
  price_display: '$$',
  phone: '+57 600 1234567',
  website: 'https://example.com',
  editorial_summary_en: 'Great food',
  editorial_summary_es: 'Excelente comida',
  business_status: 'OPERATIONAL',
  last_synced_at: '2026-06-02T00:00:00Z',
}

vi.mock('../db.js', () => ({
  getPool: vi.fn(() => ({
    query: vi.fn().mockResolvedValue({ rows: [mockRow] }),
  })),
}))

const app = express()
app.use('/api/places', placesRouter)

describe('GET /api/places', () => {
  it('returns 200 with data array and total', async () => {
    const res = await request(app).get('/api/places')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body).toHaveProperty('total')
  })

  it('accepts category filter without error', async () => {
    const res = await request(app).get('/api/places?category=restaurants')
    expect(res.status).toBe(200)
  })

  it('returns 400 for invalid minRating', async () => {
    const res = await request(app).get('/api/places?minRating=abc')
    expect(res.status).toBe(400)
  })

  it('accepts valid minRating', async () => {
    const res = await request(app).get('/api/places?minRating=4.5')
    expect(res.status).toBe(200)
  })
})

describe('GET /api/places/:id', () => {
  it('returns 200 for existing place', async () => {
    const res = await request(app).get('/api/places/ChIJabc')
    expect(res.status).toBe(200)
  })
})
