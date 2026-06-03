# Spec: Base de Datos Local de Lugares + Docker

**Fecha:** 2026-06-02  
**Proyecto:** Concierge Digital — Cartagena  
**Estado:** Aprobado

---

## Problema

El proyecto actualmente tiene datos hardcodeados en `src/data/mock.ts` para ciudades de México. El pivote a Cartagena requiere una base de datos dinámica con ~325 lugares reales obtenidos de Google Places API, servidos a través de una API REST local.

---

## Decisiones de Diseño

| Decisión | Elección | Razón |
|---|---|---|
| Base de datos | PostgreSQL 16 local | Sin costos externos, control total |
| Stack backend | Node.js + TypeScript | Consistente con el frontend existente |
| Enriquecimiento | `@vitalets/google-translate-api` | Traducción EN→ES gratis, sin Claude |
| API | Express en puerto 3001 | Simple, conocido, fácil de extender |
| Orquestación | Docker Compose | Un solo comando levanta todo |

---

## Arquitectura

### Estructura de archivos

```
concierge_digital/
├── docker-compose.yml
├── .env                        ← API keys y secrets (no commitear)
├── .env.example                ← plantilla para el equipo
├── db/
│   └── init.sql                ← schema completo de PostgreSQL
├── services/
│   ├── scraper/
│   │   ├── src/
│   │   │   ├── index.ts        ← runner: itera zonas × categorías
│   │   │   ├── google.ts       ← cliente New Places API v1 (POST)
│   │   │   ├── zones.ts        ← 7 zonas de Cartagena con coordenadas
│   │   │   ├── categories.ts   ← mapeo categorías plataforma → Google types
│   │   │   ├── translate.ts    ← wrapper de traducción EN→ES
│   │   │   └── db.ts           ← cliente pg con pool de conexiones
│   │   ├── Dockerfile
│   │   └── package.json
│   └── api/
│       ├── src/
│       │   ├── index.ts        ← arranque Express
│       │   ├── db.ts           ← pool PostgreSQL compartido
│       │   └── routes/
│       │       ├── places.ts   ← GET /api/places y /api/places/:id
│       │       └── categories.ts ← GET /api/categories
│       ├── Dockerfile
│       └── package.json
└── src/                        ← React frontend (sin cambios estructurales)
```

### Contenedores Docker

| Servicio | Imagen base | Puerto | Comportamiento |
|---|---|---|---|
| `postgres` | postgres:16-alpine | 5432 | Persiste datos en volumen `pgdata`. Healthcheck antes de permitir que otros arranquen. |
| `scraper` | node:20-alpine | — | Corre una vez al levantar (`restart: no`). Llena la DB y termina. Re-ejecutar con `docker compose run --rm scraper`. |
| `api` | node:20-alpine | 3001 | Siempre activo (`restart: unless-stopped`). Sirve datos al frontend. |

---

## Scraper

### Zonas de búsqueda

```typescript
const ZONES = [
  { name: 'Ciudad Amurallada', lat: 10.4236, lng: -75.5516, radius: 1500 },
  { name: 'Getsemaní',         lat: 10.4232, lng: -75.5451, radius: 800  },
  { name: 'San Diego',          lat: 10.4268, lng: -75.5487, radius: 600  },
  { name: 'Bocagrande',         lat: 10.3960, lng: -75.5550, radius: 2000 },
  { name: 'El Laguito',         lat: 10.3892, lng: -75.5610, radius: 1000 },
  { name: 'Manga',              lat: 10.4090, lng: -75.5380, radius: 1500 },
  { name: 'Castillogrande',     lat: 10.3950, lng: -75.5480, radius: 1000 },
]
```

### Categorías de la plataforma → tipos de Google

```typescript
const CATEGORIES = {
  restaurants:          { primaryTypes: ['restaurant', 'caribbean_restaurant', 'fine_dining_restaurant', 'seafood_restaurant'], excludeTypes: ['lodging'] },
  bars:                 { primaryTypes: ['bar', 'cocktail_bar', 'wine_bar'], excludeTypes: ['lodging', 'night_club'] },
  nightlife:            { primaryTypes: ['night_club', 'dance_hall'], excludeTypes: ['lodging'] },
  cafes:                { primaryTypes: ['cafe', 'coffee_shop'], excludeTypes: ['lodging'] },
  tourist_attractions:  { primaryTypes: ['tourist_attraction', 'historical_landmark', 'monument'], excludeTypes: ['lodging'] },
  shopping:             { primaryTypes: ['shopping_mall', 'market'], excludeTypes: [] },
  fast_food:            { primaryTypes: ['fast_food_restaurant', 'hamburger_restaurant'], excludeTypes: ['lodging'] },
  recreation:           { primaryTypes: ['amusement_park', 'bowling_alley', 'movie_theater'], excludeTypes: [] },
}
```

### Flujo de ejecución

```
Para cada categoría (8):
  Para cada zona (7):
    1. POST /v1/places:searchNearby con includedPrimaryTypes + excludedTypes
    2. Filtrar resultados:
       - business_status === 'OPERATIONAL'
       - rating >= 3.5
       - userRatingCount >= 30
    3. Traducir editorialSummary.text EN→ES (si existe)
    4. UPSERT en tabla places por google_place_id
    5. Insertar fotos en tabla place_photos
    6. Insertar horarios en tabla place_hours
    7. Esperar 200ms (rate limiting)

Total: 56 requests a Google
Tiempo estimado: 3-4 minutos
Costo estimado: $0 (dentro del crédito gratuito de $200/mes)
```

### Estimado de lugares únicos

| Categoría | Bruto (56 combos) | Tras dedup + filtro |
|---|---|---|
| Restaurantes | ~140 | ~80 |
| Bares | ~80 | ~45 |
| Vida nocturna | ~60 | ~30 |
| Cafés | ~80 | ~50 |
| Atracciones turísticas | ~80 | ~40 |
| Centros comerciales | ~40 | ~15 |
| Comida rápida | ~80 | ~40 |
| Recreación | ~60 | ~25 |
| **Total** | **~620** | **~325 únicos** |

---

## Base de Datos (PostgreSQL)

### Tablas principales

```sql
places              -- lugar maestro, place_id como PK único
place_photos        -- fotos con name para URL dinámica
place_hours         -- horarios por día de semana
```

### Campos clave de `places`

```
google_place_id     TEXT UNIQUE  -- identificador estable de Google
platform_category   TEXT         -- categoría de la plataforma
primary_type        TEXT         -- tipo principal de Google
name                TEXT
formatted_address   TEXT
latitude / longitude DECIMAL
rating              DECIMAL(2,1)
user_rating_count   INT
price_level         TEXT         -- PRICE_LEVEL_MODERATE etc.
price_display       TEXT         -- $$
phone               TEXT
website             TEXT
editorial_summary_en TEXT        -- texto original de Google
editorial_summary_es TEXT        -- traducido
business_status     TEXT         -- OPERATIONAL / PERMANENTLY_CLOSED
zone                TEXT         -- zona de Cartagena donde fue encontrado
last_synced_at      TIMESTAMPTZ
```

---

## API REST (Express, puerto 3001)

### Endpoints

```
GET /health
→ { status: 'ok', placesCount: 325 }

GET /api/categories
→ [{ slug, label_es, count }]

GET /api/places
  ?category=restaurants     filtra por platform_category
  ?zone=bocagrande          filtra por zona
  ?minRating=4.0            filtro de calidad
  ?openNow=true             abiertos ahora (usa hora Cartagena UTC-5)
  ?limit=20&offset=0        paginación
→ { data: Place[], total: number, limit, offset }

GET /api/places/:googlePlaceId
→ Place (con photos y hours anidados)

GET /api/places/:googlePlaceId/photo/:index
→ proxy de imagen desde Google (sin exponer API key al frontend)
  Cache-Control: public, max-age=2592000 (30 días)
```

### CORS

Configurado para aceptar requests desde `http://localhost:5173` (Vite dev server).

---

## Variables de Entorno

### `.env` (no commitear)
```
GOOGLE_API_KEY=...
POSTGRES_DB=concierge
POSTGRES_USER=concierge
POSTGRES_PASSWORD=concierge_secret
DATABASE_URL=postgresql://concierge:concierge_secret@postgres:5432/concierge
VITE_API_URL=http://localhost:3001
```

### `.env.example` (sí commitear)
```
GOOGLE_API_KEY=your_google_api_key_here
POSTGRES_DB=concierge
POSTGRES_USER=concierge
POSTGRES_PASSWORD=change_me
DATABASE_URL=postgresql://concierge:change_me@postgres:5432/concierge
VITE_API_URL=http://localhost:3001
```

---

## Comandos de Uso

```bash
# Primera vez: construir imágenes, levantar DB, correr scraper, arrancar API
docker compose up --build

# Uso diario (solo API + DB, sin re-scraping)
docker compose up postgres api

# Refrescar datos de Google manualmente
docker compose run --rm scraper

# Ver logs del scraper en tiempo real
docker compose logs -f scraper

# Acceder a la DB directamente
docker compose exec postgres psql -U concierge -d concierge

# Limpiar todo (incluye datos)
docker compose down -v
```

---

## Manejo de Errores

- Si Google Places API devuelve error, el scraper lo loguea y continua con la siguiente zona/categoría (no falla todo)
- Si la traducción falla, se guarda el texto en inglés y `editorial_summary_es = null`
- Si un `place_id` ya existe en la DB, se hace UPSERT (actualiza datos, no duplica)
- La API devuelve 404 si el `googlePlaceId` no existe en la DB

---

## Lo que NO incluye este spec

- Autenticación en la API (los datos son públicos dentro de la red local)
- Panel de administración para gestionar lugares
- Búsqueda full-text (se puede agregar con `pg_trgm` después)
- Re-sincronización automática periódica (cron) — se ejecuta manualmente
- Integración con el frontend React (siguiente ciclo de trabajo)
