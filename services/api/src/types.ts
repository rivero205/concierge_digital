// services/api/src/types.ts

export interface PlaceRow {
  id: string
  google_place_id: string
  platform_category: string
  zone: string
  primary_type: string | null
  types: string[]
  name: string
  formatted_address: string | null
  latitude: string
  longitude: string
  rating: string | null
  user_rating_count: number | null
  price_level: string | null
  price_display: string | null
  phone: string | null
  website: string | null
  editorial_summary_en: string | null
  editorial_summary_es: string | null
  business_status: string
  last_synced_at: string
}

export interface PhotoRow {
  photo_name: string
  width_px: number
  height_px: number
  display_order: number
}

export interface HourRow {
  day_of_week: number
  open_time: string | null
  close_time: string | null
}

export interface PlaceFilters {
  category?: string
  zone?: string
  minRating?: number
  openNow?: boolean
  limit: number
  offset: number
}
