# Places DB + Docker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a PostgreSQL database loaded from Google Places API (~325 places de Cartagena), servida por una Express API, orquestada con Docker Compose de 3 contenedores.

**Architecture:** El scraper (Node.js + TypeScript) hace 56 requests a New Places API v1, deduplica por `google_place_id`, traduce `editorialSummary` vía Google Translate gratuito, y hace UPSERT en PostgreSQL. La API Express expone endpoints REST para el frontend React.

**Tech Stack:** Node.js 20, TypeScript 5, PostgreSQL 16-alpine, Express 4, `pg` (node-postgres), Docker Compose, `vitest` para tests, `supertest` para tests de API.

---

## Mapa de archivos

**Crear (nuevos):**
```
docker-compose.yml
.env.example
db/init.sql
services/scraper/Dockerfile
services/scraper/package.json
services/scraper/tsconfig.json
services/scraper/src/types.ts
services/scraper/src/zones.ts
services/scraper/src/categories.ts
services/scraper/src/db.ts
services/scraper/src/google.ts
services/scraper/src/translate.ts
services/scraper/src/index.ts
services/api/Dockerfile
services/api/package.json
services/api/tsconfig.json
services/api/src/types.ts
services/api/src/db.ts
services/api/src/routes/places.ts
services/api/src/routes/categories.ts
services/api/src/index.ts
```

**No modificar** (todavía): `src/` del frontend React.

---

## Task 1: Database Schema

**Files:**
- Create: `db/init.sql`

- [ ] **Step 1: Crear `db/init.sql` con el schema completo**

```sql
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
```

- [ ] **Step 2: Commit**

```bash
git add db/init.sql
git commit -m "feat: add PostgreSQL schema for places, photos, and hours"
```

---

## Task 2: Docker Compose y variables de entorno

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.env` (local, no commitear)

- [ ] **Step 1: Crear `docker-compose.yml`**

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

  scraper:
    build:
      context: ./services/scraper
      dockerfile: Dockerfile
    environment:
      GOOGLE_API_KEY: ${GOOGLE_API_KEY}
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
    depends_on:
      postgres:
        condition: service_healthy
    restart: "no"

  api:
    build:
      context: ./services/api
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  pgdata:
```

- [ ] **Step 2: Crear `.env.example`**

```bash
# .env.example — copiar a .env y completar
GOOGLE_API_KEY=your_google_api_key_here
POSTGRES_DB=concierge
POSTGRES_USER=concierge
POSTGRES_PASSWORD=change_me_in_production
```

- [ ] **Step 3: Crear `.env` con valores reales**

```bash
# .env — NO commitear, ya está en .gitignore
GOOGLE_API_KEY=AIzaSyAMlDlAoix9059-YgbPq6GNriU3iQEipNo
POSTGRES_DB=concierge
POSTGRES_USER=concierge
POSTGRES_PASSWORD=concierge_local_secret
```

- [ ] **Step 4: Agregar `.env` al `.gitignore` si no está**

```bash
# Verificar que .env está ignorado
grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
```

- [ ] **Step 5: Validar que Docker Compose parsea el archivo correctamente**

```bash
docker compose config
```

Esperado: YAML expandido sin errores, con las variables de entorno sustituidas.

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml .env.example .gitignore
git commit -m "feat: add Docker Compose with postgres, scraper, and api services"
```

---

## Task 3: Scraper — Setup del proyecto

**Files:**
- Create: `services/scraper/package.json`
- Create: `services/scraper/tsconfig.json`
- Create: `services/scraper/Dockerfile`

- [ ] **Step 1: Crear `services/scraper/package.json`**

```json
{
  "name": "scraper",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "pg": "^8.12.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/pg": "^8.11.6",
    "tsx": "^4.15.6",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Crear `services/scraper/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Crear `services/scraper/Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src/
CMD ["npx", "tsx", "src/index.ts"]
```

- [ ] **Step 4: Instalar dependencias localmente (para desarrollo)**

```bash
cd services/scraper
npm install
cd ../..
```

- [ ] **Step 5: Commit**

```bash
git add services/scraper/
git commit -m "feat: scaffold scraper service with TypeScript and tsx"
```

---

## Task 4: Scraper — types.ts

**Files:**
- Create: `services/scraper/src/types.ts`

- [ ] **Step 1: Crear `services/scraper/src/types.ts`**

Estas interfaces modelan exactamente lo que devuelve la New Places API v1.

```typescript
// services/scraper/src/types.ts

export interface GooglePlacePhoto {
  name: string       // "places/{id}/photos/{ref}"
  widthPx: number
  heightPx: number
}

export interface GooglePlaceHourPeriod {
  open:  { day: number; hour: number; minute: number }
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
```

- [ ] **Step 2: Commit**

```bash
git add services/scraper/src/types.ts
git commit -m "feat: add shared TypeScript types for scraper"
```

---

## Task 5: Scraper — zones.ts y categories.ts

**Files:**
- Create: `services/scraper/src/zones.ts`
- Create: `services/scraper/src/categories.ts`

- [ ] **Step 1: Crear `services/scraper/src/zones.ts`**

```typescript
// services/scraper/src/zones.ts
import type { Zone } from './types.js'

export const ZONES: Zone[] = [
  { name: 'Ciudad Amurallada', lat: 10.4236,  lng: -75.5516, radius: 1500 },
  { name: 'Getsemaní',         lat: 10.4232,  lng: -75.5451, radius: 800  },
  { name: 'San Diego',          lat: 10.4268,  lng: -75.5487, radius: 600  },
  { name: 'Bocagrande',         lat: 10.3960,  lng: -75.5550, radius: 2000 },
  { name: 'El Laguito',         lat: 10.3892,  lng: -75.5610, radius: 1000 },
  { name: 'Manga',              lat: 10.4090,  lng: -75.5380, radius: 1500 },
  { name: 'Castillogrande',     lat: 10.3950,  lng: -75.5480, radius: 1000 },
]
```

- [ ] **Step 2: Crear `services/scraper/src/categories.ts`**

```typescript
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
  PRICE_LEVEL_FREE:          'Gratis',
  PRICE_LEVEL_INEXPENSIVE:   '$',
  PRICE_LEVEL_MODERATE:      '$$',
  PRICE_LEVEL_EXPENSIVE:     '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE:'$$$$',
}
```

- [ ] **Step 3: Escribir test de configuración**

```typescript
// services/scraper/src/categories.test.ts
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
```

- [ ] **Step 4: Correr tests**

```bash
cd services/scraper && npx vitest run
```

Esperado: `3 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add services/scraper/src/
git commit -m "feat: add zones, categories config, and passing tests"
```

---

## Task 6: Scraper — db.ts

**Files:**
- Create: `services/scraper/src/db.ts`

- [ ] **Step 1: Crear `services/scraper/src/db.ts`**

```typescript
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
    const openTime  = `${String(period.open.hour).padStart(2,'0')}:${String(period.open.minute).padStart(2,'0')}`
    const closeTime = period.close
      ? `${String(period.close.hour).padStart(2,'0')}:${String(period.close.minute).padStart(2,'0')}`
      : null
    await pool.query(
      `INSERT INTO place_hours (place_id, day_of_week, open_time, close_time)
       VALUES ($1, $2, $3, $4)`,
      [placeId, period.open.day, openTime, closeTime],
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add services/scraper/src/db.ts
git commit -m "feat: add db upsert functions for places, photos, and hours"
```

---

## Task 7: Scraper — google.ts

**Files:**
- Create: `services/scraper/src/google.ts`

- [ ] **Step 1: Escribir el test primero**

```typescript
// services/scraper/src/google.test.ts
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
})
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
cd services/scraper && npx vitest run src/google.test.ts
```

Esperado: `FAIL — Cannot find module './google.js'`

- [ ] **Step 3: Crear `services/scraper/src/google.ts`**

```typescript
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
```

- [ ] **Step 4: Correr tests — deben pasar**

```bash
cd services/scraper && npx vitest run src/google.test.ts
```

Esperado: `5 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add services/scraper/src/google.ts services/scraper/src/google.test.ts
git commit -m "feat: add Google Places API client with quality filter"
```

---

## Task 8: Scraper — translate.ts

**Files:**
- Create: `services/scraper/src/translate.ts`

- [ ] **Step 1: Escribir test primero**

```typescript
// services/scraper/src/translate.test.ts
import { describe, it, expect, vi } from 'vitest'
import { translateToSpanish } from './translate.js'

describe('translateToSpanish', () => {
  it('returns null for empty or null input', async () => {
    expect(await translateToSpanish('')).toBeNull()
    expect(await translateToSpanish(null)).toBeNull()
  })

  it('returns null when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const result = await translateToSpanish('Hello world')
    expect(result).toBeNull()
    vi.unstubAllGlobals()
  })

  it('returns null on bad response shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => 'unexpected',
    }))
    const result = await translateToSpanish('Hello world')
    expect(result).toBeNull()
    vi.unstubAllGlobals()
  })
})
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
cd services/scraper && npx vitest run src/translate.test.ts
```

Esperado: `FAIL — Cannot find module './translate.js'`

- [ ] **Step 3: Crear `services/scraper/src/translate.ts`**

Usa el endpoint público no-autenticado de Google Translate (sin API key, gratuito, sin librería adicional).

```typescript
// services/scraper/src/translate.ts

export async function translateToSpanish(text: string | null | undefined): Promise<string | null> {
  if (!text?.trim()) return null

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null

    const translated = (data[0] as [string, ...unknown[]][])
      .map(segment => segment[0])
      .join('')

    return translated || null
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Correr tests — deben pasar**

```bash
cd services/scraper && npx vitest run src/translate.test.ts
```

Esperado: `3 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add services/scraper/src/translate.ts services/scraper/src/translate.test.ts
git commit -m "feat: add free translation wrapper with null-safe fallback"
```

---

## Task 9: Scraper — index.ts (runner principal)

**Files:**
- Create: `services/scraper/src/index.ts`

- [ ] **Step 1: Crear `services/scraper/src/index.ts`**

```typescript
// services/scraper/src/index.ts
import 'dotenv/config'
import { ZONES } from './zones.js'
import { CATEGORIES } from './categories.js'
import { searchNearby, meetsQualityThreshold } from './google.js'
import { translateToSpanish } from './translate.js'
import { createPool, upsertPlace, upsertPhotos, upsertHours } from './db.js'

const API_KEY = process.env.GOOGLE_API_KEY!
const DB_URL  = process.env.DATABASE_URL!
const DELAY_MS = 200

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  if (!API_KEY) throw new Error('GOOGLE_API_KEY env var is required')
  if (!DB_URL)  throw new Error('DATABASE_URL env var is required')

  const pool = createPool(DB_URL)
  const seen = new Set<string>()   // deduplicación por google_place_id

  let total = 0
  let skipped = 0

  console.log(`Starting scraper: ${CATEGORIES.length} categories × ${ZONES.length} zones = ${CATEGORIES.length * ZONES.length} requests\n`)

  for (const category of CATEGORIES) {
    console.log(`\n[${category.slug}] ${category.labelEs}`)

    for (const zone of ZONES) {
      process.stdout.write(`  ${zone.name}... `)

      try {
        const places = await searchNearby(
          API_KEY,
          zone,
          category.primaryTypes,
          category.excludeTypes,
        )

        let zoneCount = 0

        for (const place of places) {
          if (seen.has(place.id)) { skipped++; continue }
          if (!meetsQualityThreshold(place)) { skipped++; continue }

          seen.add(place.id)

          const summaryEs = await translateToSpanish(place.editorialSummary?.text ?? null)
          await sleep(50) // pequeño delay entre traducciones

          const placeId = await upsertPlace(pool, place, category.slug, zone.name, summaryEs)
          await upsertPhotos(pool, placeId, place.photos)
          await upsertHours(pool, placeId, place.currentOpeningHours?.periods)

          zoneCount++
          total++
        }

        console.log(`${zoneCount} places`)
      } catch (err) {
        console.log(`ERROR: ${(err as Error).message}`)
      }

      await sleep(DELAY_MS)
    }
  }

  await pool.end()

  console.log(`\n✅ Done! ${total} unique places loaded (${skipped} skipped)`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
```

- [ ] **Step 2: Correr todos los tests del scraper**

```bash
cd services/scraper && npx vitest run
```

Esperado: todos los tests pasan (los de categories, google, translate).

- [ ] **Step 3: Commit**

```bash
git add services/scraper/src/index.ts
git commit -m "feat: add scraper main runner with deduplication and rate limiting"
```

---

## Task 10: API — Setup del proyecto

**Files:**
- Create: `services/api/package.json`
- Create: `services/api/tsconfig.json`
- Create: `services/api/Dockerfile`

- [ ] **Step 1: Crear `services/api/package.json`**

```json
{
  "name": "api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "pg": "^8.12.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.0",
    "@types/pg": "^8.11.6",
    "@types/supertest": "^6.0.2",
    "supertest": "^7.0.0",
    "tsx": "^4.15.6",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Crear `services/api/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Crear `services/api/Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src/
EXPOSE 3001
CMD ["npx", "tsx", "src/index.ts"]
```

- [ ] **Step 4: Instalar dependencias localmente**

```bash
cd services/api && npm install && cd ../..
```

- [ ] **Step 5: Commit**

```bash
git add services/api/
git commit -m "feat: scaffold API service with Express and TypeScript"
```

---

## Task 11: API — types.ts y db.ts

**Files:**
- Create: `services/api/src/types.ts`
- Create: `services/api/src/db.ts`

- [ ] **Step 1: Crear `services/api/src/types.ts`**

```typescript
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
  latitude: string     // pg devuelve DECIMAL como string
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
```

- [ ] **Step 2: Crear `services/api/src/db.ts`**

```typescript
// services/api/src/db.ts
import pg from 'pg'

const { Pool } = pg

let _pool: pg.Pool | null = null

export function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    })
  }
  return _pool
}
```

- [ ] **Step 3: Commit**

```bash
git add services/api/src/types.ts services/api/src/db.ts
git commit -m "feat: add API types and database pool singleton"
```

---

## Task 12: API — routes/categories.ts

**Files:**
- Create: `services/api/src/routes/categories.ts`

- [ ] **Step 1: Crear `services/api/src/routes/categories.ts`**

```typescript
// services/api/src/routes/categories.ts
import { Router } from 'express'
import { getPool } from '../db.js'

export const categoriesRouter = Router()

categoriesRouter.get('/', async (_req, res) => {
  try {
    const { rows } = await getPool().query<{ slug: string; label_es: string; count: string }>(
      `SELECT
         platform_category AS slug,
         COUNT(*)::int      AS count
       FROM places
       WHERE business_status = 'OPERATIONAL'
       GROUP BY platform_category
       ORDER BY count DESC`,
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add services/api/src/routes/categories.ts
git commit -m "feat: add GET /api/categories endpoint"
```

---

## Task 13: API — routes/places.ts

**Files:**
- Create: `services/api/src/routes/places.ts`

- [ ] **Step 1: Escribir tests primero**

```typescript
// services/api/src/routes/places.test.ts
import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { placesRouter } from './places.js'

// Mock del pool de DB
vi.mock('../db.js', () => ({
  getPool: vi.fn(() => ({
    query: vi.fn().mockResolvedValue({
      rows: [
        {
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
          total: '1',
        },
      ],
    }),
  })),
}))

const app = express()
app.use('/api/places', placesRouter)

describe('GET /api/places', () => {
  it('returns 200 with places array', async () => {
    const res = await request(app).get('/api/places')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body).toHaveProperty('total')
  })

  it('accepts category filter', async () => {
    const res = await request(app).get('/api/places?category=restaurants')
    expect(res.status).toBe(200)
  })

  it('returns 400 for invalid minRating', async () => {
    const res = await request(app).get('/api/places?minRating=abc')
    expect(res.status).toBe(400)
  })
})

describe('GET /api/places/:id', () => {
  it('returns 200 for existing place', async () => {
    const res = await request(app).get('/api/places/ChIJabc')
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Correr test — debe fallar**

```bash
cd services/api && npx vitest run src/routes/places.test.ts
```

Esperado: `FAIL — Cannot find module './places.js'`

- [ ] **Step 3: Crear `services/api/src/routes/places.ts`**

```typescript
// services/api/src/routes/places.ts
import { Router, type Request, type Response } from 'express'
import { getPool } from '../db.js'
import type { PlaceFilters, PlaceRow, PhotoRow, HourRow } from '../types.js'

export const placesRouter = Router()

function parseFilters(query: Request['query']): PlaceFilters | { error: string } {
  const limit  = Math.min(parseInt(query.limit  as string ?? '20'), 100)
  const offset = parseInt(query.offset as string ?? '0')

  if (isNaN(limit) || isNaN(offset)) return { error: 'limit and offset must be numbers' }

  const minRating = query.minRating ? parseFloat(query.minRating as string) : undefined
  if (minRating !== undefined && isNaN(minRating)) return { error: 'minRating must be a number' }

  return {
    category:  query.category  as string | undefined,
    zone:      query.zone      as string | undefined,
    minRating,
    openNow:   query.openNow === 'true',
    limit,
    offset,
  }
}

// GET /api/places
placesRouter.get('/', async (req: Request, res: Response) => {
  const filters = parseFilters(req.query)
  if ('error' in filters) return void res.status(400).json({ error: filters.error })

  const params: unknown[] = ['OPERATIONAL']
  const conditions = [`p.business_status = $1`]
  let i = 2

  if (filters.category) { conditions.push(`p.platform_category = $${i++}`); params.push(filters.category) }
  if (filters.zone)     { conditions.push(`p.zone ILIKE $${i++}`);           params.push(filters.zone)     }
  if (filters.minRating){ conditions.push(`p.rating >= $${i++}`);            params.push(filters.minRating)}

  if (filters.openNow) {
    // Cartagena es UTC-5. 0=Sunday. Filtra por día y hora actuales
    const now = new Date(Date.now() - 5 * 60 * 60 * 1000)  // UTC-5
    const day  = now.getUTCDay()
    const time = `${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}`
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
  const { rows } = await getPool().query<PlaceRow & { total: string }>(
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

// GET /api/places/:googlePlaceId/photo/:index — proxy de imagen
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
  const response = await fetch(photoUrl)
  if (!response.ok) return void res.status(502).json({ error: 'Could not fetch photo' })

  res.set('Cache-Control', 'public, max-age=2592000')
  res.set('Content-Type', response.headers.get('Content-Type') ?? 'image/jpeg')
  const buffer = await response.arrayBuffer()
  res.send(Buffer.from(buffer))
})
```

- [ ] **Step 4: Correr tests**

```bash
cd services/api && npx vitest run src/routes/places.test.ts
```

Esperado: `4 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add services/api/src/routes/places.ts services/api/src/routes/places.test.ts
git commit -m "feat: add places routes with filtering, pagination, and photo proxy"
```

---

## Task 14: API — index.ts (servidor Express)

**Files:**
- Create: `services/api/src/index.ts`

- [ ] **Step 1: Crear `services/api/src/index.ts`**

```typescript
// services/api/src/index.ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { placesRouter } from './routes/places.js'
import { categoriesRouter } from './routes/categories.js'
import { getPool } from './db.js'

const app = express()
const PORT = parseInt(process.env.PORT ?? '3001')

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET'],
}))
app.use(express.json())

app.get('/health', async (_req, res) => {
  try {
    const { rows } = await getPool().query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM places WHERE business_status = 'OPERATIONAL'`,
    )
    res.json({ status: 'ok', placesCount: rows[0].count })
  } catch {
    res.status(503).json({ status: 'error', placesCount: 0 })
  }
})

app.use('/api/categories', categoriesRouter)
app.use('/api/places',     placesRouter)

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})
```

- [ ] **Step 2: Correr todos los tests de la API**

```bash
cd services/api && npx vitest run
```

Esperado: todos los tests pasan.

- [ ] **Step 3: Commit**

```bash
git add services/api/src/index.ts
git commit -m "feat: add Express server with CORS, health endpoint, and routes"
```

---

## Task 15: Integración completa — Docker Compose

**Prerequisito:** Docker Desktop corriendo.

- [ ] **Step 1: Build y levantar todo**

```bash
docker compose up --build
```

Esperar los logs:
```
postgres  | database system is ready to accept connections
scraper   | Starting scraper: 8 categories × 7 zones = 56 requests
scraper   |   Ciudad Amurallada... 12 places
...
scraper   | ✅ Done! 312 unique places loaded (180 skipped)
api       | API running on http://localhost:3001
```

- [ ] **Step 2: Verificar health endpoint**

```bash
curl http://localhost:3001/health
```

Esperado:
```json
{ "status": "ok", "placesCount": 312 }
```

- [ ] **Step 3: Verificar categorías**

```bash
curl "http://localhost:3001/api/categories" | python -m json.tool
```

Esperado: array con 8 categorías y sus conteos.

- [ ] **Step 4: Verificar lugares con filtros**

```bash
curl "http://localhost:3001/api/places?category=restaurants&minRating=4.5&limit=5" | python -m json.tool
```

Esperado: array con hasta 5 restaurantes de rating >= 4.5, ordenados por rating DESC.

- [ ] **Step 5: Verificar detalle de un lugar**

Tomar el `google_place_id` del resultado anterior y:
```bash
curl "http://localhost:3001/api/places/ChIJuWFEhJ8v9o4RoyjG5t4RLhU" | python -m json.tool
```

Esperado: objeto con el lugar, array `photos`, array `hours`.

- [ ] **Step 6: Verificar proxy de foto en el browser**

Abrir en el browser:
```
http://localhost:3001/api/places/ChIJuWFEhJ8v9o4RoyjG5t4RLhU/photo/0
```

Esperado: imagen JPEG del restaurante CANDÉ.

- [ ] **Step 7: Verificar que el scraper NO corre en segundo up**

```bash
docker compose up postgres api
```

El scraper no debe aparecer. Solo postgres y api.

- [ ] **Step 8: Commit final**

```bash
git add .
git commit -m "feat: complete Places DB + Docker infrastructure"
```

---

## Comandos de referencia rápida

```bash
# Levantar todo por primera vez
docker compose up --build

# Solo DB + API (sin re-scrapar)
docker compose up postgres api

# Re-cargar datos de Google
docker compose run --rm scraper

# Ver logs en vivo
docker compose logs -f scraper
docker compose logs -f api

# Conectar a la DB
docker compose exec postgres psql -U concierge -d concierge

# Consultas útiles en psql
SELECT platform_category, COUNT(*) FROM places GROUP BY 1 ORDER BY 2 DESC;
SELECT name, rating, zone FROM places WHERE platform_category='restaurants' ORDER BY rating DESC LIMIT 10;

# Limpiar todo (borra datos)
docker compose down -v

# Correr tests del scraper
cd services/scraper && npx vitest run

# Correr tests de la API
cd services/api && npx vitest run
```
