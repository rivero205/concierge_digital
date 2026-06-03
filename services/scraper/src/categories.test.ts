import { describe, it, expect } from 'vitest'
import { CATEGORIES, PRICE_DISPLAY } from './categories.js'
import { ZONES } from './zones.js'

describe('ZONES', () => {
  it('has 7 zones with valid coordinates', () => {
    expect(ZONES).toHaveLength(7)
    ZONES.forEach(z => {
      expect(z.lat).toBeGreaterThan(10)
      expect(z.lat).toBeLessThan(11)
      expect(z.lng).toBeGreaterThan(-76)
      expect(z.lng).toBeLessThan(-75)
      expect(z.radius).toBeGreaterThan(0)
    })
  })
})

describe('CATEGORIES', () => {
  it('has 8 categories with unique slugs', () => {
    expect(CATEGORIES).toHaveLength(8)
    const slugs = CATEGORIES.map(c => c.slug)
    expect(new Set(slugs).size).toBe(8)
  })

  it('each category has at least one primaryType', () => {
    CATEGORIES.forEach(c => {
      expect(c.primaryTypes.length).toBeGreaterThan(0)
    })
  })
})

describe('PRICE_DISPLAY', () => {
  it('maps all price levels', () => {
    expect(PRICE_DISPLAY['PRICE_LEVEL_MODERATE']).toBe('$$')
    expect(PRICE_DISPLAY['PRICE_LEVEL_EXPENSIVE']).toBe('$$$')
    expect(PRICE_DISPLAY['PRICE_LEVEL_INEXPENSIVE']).toBe('$')
  })
})
