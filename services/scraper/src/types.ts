// services/scraper/src/types.ts

export interface GooglePlacePhoto {
  name: string       // "places/{id}/photos/{ref}"
  widthPx: number
  heightPx: number
}

export interface GooglePlaceHourPeriod {
  open:   { day: number; hour: number; minute: number }
  close?: { day: number; hour: number; minute: number }
}

export interface GooglePlace {
  id: string
  displayName: { text: string; languageCode: string }
  formattedAddress?: string
  location: { latitude: number; longitude: number }
  rating?: number
  userRatingCount?: number
  priceLevel?: string
  primaryType?: string
  types: string[]
  businessStatus?: string
  internationalPhoneNumber?: string
  websiteUri?: string
  editorialSummary?: { text: string; languageCode: string }
  currentOpeningHours?: {
    openNow?: boolean
    periods?: GooglePlaceHourPeriod[]
  }
  photos?: GooglePlacePhoto[]
}

export interface GooglePlacesResponse {
  places: GooglePlace[]
}

export interface Zone {
  name: string
  lat: number
  lng: number
  radius: number
}

export interface Category {
  slug: string
  labelEs: string
  primaryTypes: string[]
  excludeTypes: string[]
}
