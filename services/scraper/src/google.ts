// services/scraper/src/google.ts
import type { GooglePlace, GooglePlacesResponse } from './types.js'

const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchNearby'

const FIELD_MASK = [
  'places.id', 'places.displayName', 'places.formattedAddress',
  'places.location', 'places.rating', 'places.userRatingCount',
  'places.priceLevel', 'places.primaryType', 'places.types',
  'places.businessStatus', 'places.internationalPhoneNumber',
  'places.websiteUri', 'places.editorialSummary',
  'places.currentOpeningHours', 'places.photos',
].join(',')

export function meetsQualityThreshold(place: GooglePlace): boolean {
  if (place.businessStatus === 'PERMANENTLY_CLOSED') return false
  if (place.businessStatus === 'CLOSED_PERMANENTLY')  return false
  if (place.rating !== undefined && place.rating < 3.5) return false
  if (place.userRatingCount !== undefined && place.userRatingCount < 30) return false
  return true
}

export function buildSearchBody(
  zone: { lat: number; lng: number; radius: number },
  primaryTypes: string[],
  excludeTypes: string[],
) {
  return {
    includedPrimaryTypes: primaryTypes,
    excludedTypes: excludeTypes.length ? excludeTypes : undefined,
    maxResultCount: 20,
    rankPreference: 'POPULARITY',
    locationRestriction: {
      circle: {
        center: { latitude: zone.lat, longitude: zone.lng },
        radius: zone.radius,
      },
    },
  }
}

export async function searchNearby(
  apiKey: string,
  zone: { lat: number; lng: number; radius: number },
  primaryTypes: string[],
  excludeTypes: string[],
): Promise<GooglePlace[]> {
  const body = buildSearchBody(zone, primaryTypes, excludeTypes)

  const response = await fetch(PLACES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Google Places API error ${response.status}: ${text}`)
  }

  const data = await response.json() as GooglePlacesResponse
  return data.places ?? []
}
