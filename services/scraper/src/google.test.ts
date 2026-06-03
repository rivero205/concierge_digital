import { describe, it, expect } from 'vitest'
import { meetsQualityThreshold, buildSearchBody } from './google.js'
import type { GooglePlace } from './types.js'

const basePlace: GooglePlace = {
  id: 'abc123',
  displayName: { text: 'Test Place', languageCode: 'es' },
  location: { latitude: 10.4, longitude: -75.5 },
  types: ['restaurant'],
  businessStatus: 'OPERATIONAL',
  rating: 4.5,
  userRatingCount: 100,
}

describe('meetsQualityThreshold', () => {
  it('accepts a good place', () => {
    expect(meetsQualityThreshold(basePlace)).toBe(true)
  })

  it('rejects permanently closed', () => {
    expect(meetsQualityThreshold({ ...basePlace, businessStatus: 'PERMANENTLY_CLOSED' })).toBe(false)
  })

  it('rejects low rating', () => {
    expect(meetsQualityThreshold({ ...basePlace, rating: 3.0 })).toBe(false)
  })

  it('rejects too few reviews', () => {
    expect(meetsQualityThreshold({ ...basePlace, userRatingCount: 15 })).toBe(false)
  })

  it('accepts place with no rating (unrated new place)', () => {
    expect(meetsQualityThreshold({ ...basePlace, rating: undefined, userRatingCount: undefined })).toBe(true)
  })
})

describe('buildSearchBody', () => {
  it('includes includedPrimaryTypes and excludedTypes', () => {
    const body = buildSearchBody(
      { lat: 10.42, lng: -75.55, radius: 1500 },
      ['restaurant'],
      ['lodging'],
    )
    expect(body.includedPrimaryTypes).toEqual(['restaurant'])
    expect(body.excludedTypes).toEqual(['lodging'])
    expect(body.maxResultCount).toBe(20)
    expect(body.locationRestriction.circle.center.latitude).toBe(10.42)
  })

  it('omits excludedTypes when empty', () => {
    const body = buildSearchBody({ lat: 10.42, lng: -75.55, radius: 1500 }, ['museum'], [])
    expect(body.excludedTypes).toBeUndefined()
  })
})
