// services/scraper/src/categories.ts
import type { Category } from './types.js'

export const CATEGORIES: Category[] = [
  {
    slug: 'restaurants',
    labelEs: 'Restaurantes',
    primaryTypes: [
      'restaurant', 'caribbean_restaurant', 'fine_dining_restaurant',
      'seafood_restaurant', 'latin_american_restaurant',
    ],
    excludeTypes: ['lodging'],
  },
  {
    slug: 'bars',
    labelEs: 'Bares',
    primaryTypes: ['bar', 'cocktail_bar', 'wine_bar', 'sports_bar'],
    excludeTypes: ['lodging', 'night_club'],
  },
  {
    slug: 'nightlife',
    labelEs: 'Vida Nocturna',
    primaryTypes: ['night_club', 'dance_hall'],
    excludeTypes: ['lodging'],
  },
  {
    slug: 'cafes',
    labelEs: 'Cafés',
    primaryTypes: ['cafe', 'coffee_shop', 'tea_house'],
    excludeTypes: ['lodging'],
  },
  {
    slug: 'tourist_attractions',
    labelEs: 'Atracciones Turísticas',
    primaryTypes: ['tourist_attraction', 'historical_landmark', 'monument', 'museum'],
    excludeTypes: ['lodging'],
  },
  {
    slug: 'shopping',
    labelEs: 'Compras',
    primaryTypes: ['shopping_mall', 'market', 'department_store'],
    excludeTypes: [],
  },
  {
    slug: 'fast_food',
    labelEs: 'Comida Rápida',
    primaryTypes: ['fast_food_restaurant', 'hamburger_restaurant', 'pizza_restaurant'],
    excludeTypes: ['lodging'],
  },
  {
    slug: 'recreation',
    labelEs: 'Recreación',
    primaryTypes: ['amusement_park', 'bowling_alley', 'movie_theater', 'zoo', 'aquarium'],
    excludeTypes: [],
  },
]

export const PRICE_DISPLAY: Record<string, string> = {
  PRICE_LEVEL_FREE:           'Gratis',
  PRICE_LEVEL_INEXPENSIVE:    '$',
  PRICE_LEVEL_MODERATE:       '$$',
  PRICE_LEVEL_EXPENSIVE:      '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
}
