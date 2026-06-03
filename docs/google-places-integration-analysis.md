# Análisis de Integración: Google Places API para Concierge Digital Cartagena

> Fecha: 2026-05-29  
> Autor: Análisis técnico generado con pruebas reales de la API  
> API Key utilizada: `AIzaSyAMlDlAoix9059-YgbPq6GNriU3iQEipNo`  
> Coordenadas de prueba: `10.4236, -75.5516` (Ciudad Amurallada, Cartagena de Indias)

---

## 1. Análisis de Integración

### Contexto del Proyecto

El concierge digital actualmente opera con datos hardcodeados en `src/data/mock.ts` para ciudades de México (CDMX, Guadalajara, Monterrey). El pivote a Cartagena exige un sistema dinámico que refleje la realidad del ecosistema turístico y gastronómico de la ciudad en tiempo real.

Google Maps Platform ofrece dos generaciones de API:

| Generación | Nombre | Estado | Recomendación |
|---|---|---|---|
| Legacy | Places API (v1 legacy) | Activa, sin deprecación anunciada | Evitar para nuevos proyectos |
| Nueva | Places API (v1 new) | Activa desde 2023 | **Usar esta** |

La nueva API ofrece tipos más granulares, campo `primaryType`, `editorialSummary`, precios en string legible, y field masks para control de costos. Es la que debe adoptarse.

---

## 2. Resultados de las Pruebas con Google APIs

Todas las pruebas se ejecutaron en tiempo real con la API key proporcionada.

### Prueba 1 — Nearby Search Legacy (Restaurantes, radio 2km)

```
Endpoint: GET /maps/api/place/nearbysearch/json
Parámetros: location=10.4236,-75.5516, radius=2000, type=restaurant
Status: OK
Resultados devueltos: 20 (máximo por página)
Paginación: next_page_token disponible (hasta 60 resultados totales)
```

**Muestra de resultados reales:**
- Hotel Stil Cartagena — Rating: 3.8 (2,744 reseñas) — Tipos: `laundry, travel_agency, lodging, restaurant`
- Casa Pestagua Hotel — Rating: 4.7 (540 reseñas) — Tipos: `bar, lodging, restaurant`
- Bastion Luxury Hotel — Rating: 4.7 (942 reseñas) — Tipos: `lodging, spa, restaurant`

**Problema detectado:** Los 3 primeros resultados son hoteles que tienen restaurante. No hay forma nativa de filtrar solo restaurantes independientes sin tipo `lodging`.

**Campos disponibles en Legacy:**
- `place_id`, `name`, `rating`, `user_ratings_total`, `price_level` (int 0-4), `types[]`, `vicinity`, `geometry.location`, `photos[]` (photo_reference), `opening_hours.open_now`, `plus_code`, `business_status`

**Campos NO disponibles en Nearby Search Legacy:**
- Teléfono, website, horarios completos, reviews — requieren Place Details separado

---

### Prueba 2 — Nearby Search Legacy (Tourist Attractions, radio 3km)

```
Status: OK | Resultados: 20 | next_page_token: SÍ
```

**Muestra:**
- Hotel Costa del Sol — Rating: 3.1 (3,719 reseñas) — Tipo: `lodging, tourist_attraction`
- Hotel Don Pedro de Heredia — Rating: 4.2 (860 reseñas) — Tipo: `lodging, airport, tourist_attraction, spa, museum`
- Casa Román — Rating: 4.6 (69 reseñas) — Tipo: `tourist_attraction`

**Problema detectado:** Los hoteles dominan la búsqueda de atracciones turísticas. Los tipos en Google son etiquetas múltiples no jerarquizadas, por lo que un hotel con museo aparece como atracción turística.

---

### Prueba 3 — Nearby Search Legacy (Bares/Discotecas, radio 3km)

```
Status: OK | Resultados: 20 | next_page_token: SÍ
```

**Muestra:**
- Eivissa Cartagena — Rating: 4.4 (742 reseñas) — `night_club` — Operativo
- La farra club cartagena — Rating: 4.0 (459 reseñas) — `night_club` — Operativo
- Bazurto Social Club — Rating: 4.5 (1,123 reseñas) — **PERMANENTLY_CLOSED** — sigue apareciendo
- Boundless Mezcal Café — Rating: 4.5 (306 reseñas) — **PERMANENTLY_CLOSED** — sigue apareciendo

**Problema crítico:** Negocios cerrados permanentemente aparecen en resultados sin filtrado por defecto.

---

### Prueba 4 — Text Search Legacy

```
Endpoint: GET /maps/api/place/textsearch/json
Query: "restaurantes turísticos Cartagena Colombia"
Status: OK | Resultados: 20 | next_page_token: SÍ
```

**Muestra (mejor calidad):**
- Carta Ajena Restaurante — Rating: **4.9** (1,786 reseñas) — Getsemaní
- RESTAURANTE EL BURLADOR Mediterráneo-Caribe — Rating: **4.8** (4,702 reseñas) — Santo Domingo
- Casa Bohême — Rating: **4.7** (2,147 reseñas) — café + bar + restaurante
- Mar y Zielo — Rating: **4.6** (991 reseñas)

**Observación:** Text Search con contexto semántico devuelve resultados de mejor calidad que Nearby Search tipado.

---

### Prueba 5 — New Places API v1 (searchNearby POST)

```
Endpoint: POST https://places.googleapis.com/v1/places:searchNearby
Field Mask: id, displayName, formattedAddress, rating, userRatingCount, priceLevel,
            types, primaryType, photos, currentOpeningHours, internationalPhoneNumber,
            websiteUri, editorialSummary
Status: OK | Resultados: 5 (maxResultCount configurado)
```

**Muestra real (calidad notablemente superior):**

```json
{
  "displayName": { "text": "RESTAURANTE CANDÉ Cocina 100% Cartagenera" },
  "primaryType": "caribbean_restaurant",
  "types": ["caribbean_restaurant", "cocktail_bar", "fine_dining_restaurant",
            "breakfast_restaurant", "bar", "american_restaurant", "restaurant"],
  "rating": 4.6,
  "userRatingCount": 8515,
  "priceLevel": "PRICE_LEVEL_EXPENSIVE",
  "internationalPhoneNumber": "+57 605 6786029",
  "websiteUri": "https://restaurantecande.com/en/home/",
  "editorialSummary": {
    "text": "Elegant, plant-filled venue for traditional regional cuisine alongside regular live entertainment.",
    "languageCode": "en"
  },
  "currentOpeningHours": {
    "openNow": true,
    "weekdayDescriptions": [
      "Monday: 7:00 AM – 11:00 PM",
      "Friday: 7:00 AM – 11:30 PM"
    ]
  },
  "photos": [ /* 10 objetos con name, widthPx, heightPx, authorAttributions */ ]
}
```

**Ventajas claras sobre Legacy:**
- `primaryType`: tipo único más preciso (`caribbean_restaurant` vs genérico `restaurant`)
- `editorialSummary`: descripción editorial lista para mostrar al usuario
- `priceLevel` como string legible (`PRICE_LEVEL_EXPENSIVE` vs `3`)
- Horarios completos sin segunda llamada
- Teléfono y website en la misma respuesta
- Photos con `name` (endpoint directo para imagen) en lugar de `photo_reference` expirada

---

### Prueba 6 — Place Details (RESTAURANTE CANDÉ)

```
Endpoint: GET /maps/api/place/details/json
place_id: ChIJuWFEhJ8v9o4RoyjG5t4RLhU
Status: OK
```

**Datos disponibles:**
- Nombre completo, rating 4.6, 8,515 reseñas
- Teléfono: `+57 605 6786029`
- Website: `https://restaurantecande.com/en/home/`
- Dirección completa: San Diego, Cra 10, Cl. de la Serrezuela #No 39-02
- Horarios detallados (7 días)
- **10 fotos** con photo_reference
- Reseñas: 5 reseñas con texto, autor y rating
- Editorial Summary: "Local elegante lleno de plantas con cocina regional y entretenimiento en vivo"
- URL de Google Maps: `https://maps.google.com/?cid=1526176972777334947`

---

### Prueba 7 — Centros Comerciales

```
type=shopping_mall, radio 5km
Status: OK | Resultados: 20
```

- **Mallplaza Cartagena** — Rating: 4.6 (21,890 reseñas) — Operativo
- **Caribe Plaza** — Rating: 4.6 (20,486 reseñas) — Operativo
- Pasaje de la Candelaria — Rating: 4.3 (3 reseñas) — datos escasos

---

### Prueba 8 — Cafés

```
type=cafe, radio 5km
Status: OK | Resultados: 20 | next_page_token: SÍ
```

- Se Volvió Prisprí Coffee Shop — Rating: 4.4 (1,568 reseñas)
- Época Café Bar — Rating: 4.7 (3,484 reseñas) — también es bar
- Coffee and... — Rating: 4.7 (196 reseñas)
- Boundless Mezcal Café — **PERMANENTLY_CLOSED** (reaparece aquí también)

---

## 3. Endpoints Recomendados

### Usar: New Places API v1 (2023+)

| Caso de uso | Endpoint | Método | Costo aprox |
|---|---|---|---|
| Listado inicial por categoría | `places:searchNearby` | POST | $32/1000 req |
| Búsqueda semántica del usuario | `places:searchText` | POST | $35/1000 req |
| Detalle de un lugar específico | `places/{name}` | GET | $17/1000 req |
| Foto de un lugar | `places/{name}/photos/{name}/media` | GET | $7/1000 req |
| Autocompletar búsqueda | `places:autocomplete` | POST | $2.83/1000 req |

### NO usar (Legacy):
- `nearbysearch` — campo `photo_reference` expira, tipos menos granulares, no soporta field masks
- `textsearch` legacy — sustituir por `searchText` v1
- `findplacefromtext` — obsoleto

### Field Masks críticos para controlar costos

```
# Essentials (más barato): ~$32/1000
X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,
                  places.rating,places.userRatingCount,places.priceLevel,
                  places.primaryType,places.types,places.photos

# Pro (incluye horarios, contacto): ~$35/1000
X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,
                  places.rating,places.userRatingCount,places.priceLevel,
                  places.primaryType,places.types,places.photos,
                  places.currentOpeningHours,places.internationalPhoneNumber,
                  places.websiteUri,places.editorialSummary

# Enterprise (incluye reviews): ~$40/1000
# Agregar: places.reviews
```

---

## 4. Arquitectura Propuesta

### Diagrama General

```
┌─────────────────────────────────────────────────────────────┐
│                    CONCIERGE DIGITAL                        │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │   React UI   │───▶│   API Layer  │───▶│   Cache Layer │  │
│  │ (existente)  │    │  (Edge Fn.)  │    │  (Supabase)   │  │
│  └──────────────┘    └──────────────┘    └───────────────┘  │
│                             │                      │        │
│                             ▼                      ▼        │
│                    ┌──────────────┐    ┌───────────────────┐│
│                    │ Google Places│    │  places_cache DB  ││
│                    │   API v1     │    │  (PostgreSQL)     ││
│                    └──────────────┘    └───────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Componentes

**1. API Layer (Supabase Edge Functions o backend propio)**
- Proxy entre el frontend y Google Places API
- Implementa la lógica de caché
- Nunca expone la API key al cliente
- Aplica rate limiting y filtros

**2. Cache Layer (PostgreSQL via Supabase)**
- Almacena resultados de búsquedas por categoría + radio
- TTL configurable por tipo de dato (horarios: 24h, rating: 7 días)
- Tabla de lugares maestra con place_id como PK

**3. Scheduler (Supabase Cron o similar)**
- Actualiza datos de alta rotación cada noche
- Detecta y marca negocios cerrados permanentemente
- Pre-carga categorías principales al inicio del día

---

## 5. Estrategia de Almacenamiento

### Recomendación: Caché híbrido con actualización periódica

Después de evaluar las tres estrategias posibles:

**Opción A: Solo tiempo real (descartada)**
- Pros: Datos siempre frescos
- Contras: Costo desbordado, latencia alta, dependencia total de Google

**Opción B: Solo base de datos estática (descartada)**
- Pros: Sin costo de API, máxima velocidad
- Contras: Datos obsoletos, no escala, requiere mantenimiento manual

**Opción C: Caché inteligente con TTL diferencial (RECOMENDADA)**

```
┌────────────────────────────────────────────────────────────┐
│  ESTRATEGIA DE CACHÉ DIFERENCIAL                           │
│                                                            │
│  Dato              │ TTL      │ Motivo                     │
│  ──────────────────┼──────────┼───────────────────────────│
│  Lista por cat.    │ 24 horas │ Nuevos lugares raros       │
│  Rating/reviews    │ 7 días   │ Cambia lentamente          │
│  Horarios          │ 24 horas │ Cambios frecuentes         │
│  Fotos             │ 30 días  │ Muy estáticas              │
│  Estado operativo  │ 6 horas  │ Negocios que cierran       │
│  Editorial summary │ 30 días  │ Casi inmutable             │
│  Coordenadas       │ indefinido│ No cambian                │
└────────────────────────────────────────────────────────────┘
```

**Flujo de caché:**

```
Usuario solicita categoría "restaurantes"
         ↓
¿Existe en caché y TTL vigente?
    ├── SÍ → Devolver desde DB (0ms, $0)
    └── NO → Llamar a Google Places API
              ↓
         Guardar en DB con timestamp
              ↓
         Devolver al usuario
```

### Estrategia de precarga (warming)

Al iniciar el sistema o una vez por día:
1. Buscar las 10 categorías principales en Cartagena
2. Guardar hasta 60 lugares por categoría (3 páginas de resultados)
3. Obtener Place Details de los top 20 por categoría
4. Total: ~30 llamadas a searchNearby + ~200 a Place Details = ~230 requests/día = $0.004/día

---

## 6. Riesgos y Limitaciones

### Riesgo 1: Contaminación de Tipos (ALTO)

**Problema:** Google asigna múltiples tipos por lugar. Un hotel con restaurante aparece en búsquedas de `restaurant`. Un hostel aparece en `tourist_attraction`.

**Evidencia en pruebas:** Los 3 primeros resultados de Nearby Search para restaurantes eran hoteles.

**Mitigación:**
```typescript
// Filtrar lugares donde el primaryType sea el deseado
const isGenuineRestaurant = (place: Place) =>
  place.primaryType === 'restaurant' ||
  place.primaryType === 'caribbean_restaurant' ||
  place.primaryType === 'fine_dining_restaurant' ||
  // ... etc
  !place.types.includes('lodging') // excluir si tiene lodging

// Con New API v1, usar includedPrimaryTypes en lugar de includedTypes
{
  "includedPrimaryTypes": ["restaurant"],  // Solo primaryType = restaurant
  "excludedTypes": ["lodging"]              // Excluir alojamientos
}
```

---

### Riesgo 2: Negocios Permanentemente Cerrados (ALTO)

**Problema:** Bazurto Social Club, Boundless Mezcal Café y otros aparecen en resultados con `business_status: CLOSED_TEMPORARILY` aunque están cerrados permanentemente. El campo `PERMANENTLY_CLOSED` tarda semanas en actualizarse en Google.

**Mitigación:**
- Filtrar siempre `business_status !== 'PERMANENTLY_CLOSED'`
- Mantener lista negra local de place_ids inválidos
- Verificación de estado cada 6 horas
- Si el lugar tiene `user_ratings_total < 50`, marcar como no verificado

---

### Riesgo 3: Límite de 60 Resultados por Búsqueda (MEDIO)

**Problema:** La API devuelve máximo 60 resultados (3 páginas × 20), ordenados por relevancia de Google, no por rating ni popularidad.

**Implicación:** No se puede obtener "todos los restaurantes de Cartagena" en una sola consulta.

**Mitigación:**
- Usar múltiples coordenadas de búsqueda (grilla de puntos)
- Variar el radio de búsqueda (500m, 1km, 2km, 5km)
- Cubrir zonas: Ciudad Amurallada, Getsemaní, Bocagrande, El Laguito, Manga, Castillogrande

---

### Riesgo 4: Editorial Summary solo en Inglés (MEDIO)

**Problema:** El campo `editorialSummary` viene en inglés aunque se solicite `languageCode: es`.

**Evidencia:** CANDÉ devolvió `"Elegant, plant-filled venue..."` en inglés.

**Mitigación:**
- Usar Cloud Translation API para traducir al español/idioma del huésped
- Costo adicional: ~$20 por millón de caracteres
- Alternativa: Usar Claude API para traducir y enriquecer la descripción con contexto local

---

### Riesgo 5: Dependencia de Tercero (MEDIO)

**Problema:** Si Google sube precios, cambia la API, o hay downtime, el sistema falla.

**Mitigación:**
- La estrategia de caché reduce la dependencia a actualizaciones periódicas
- Mantener fallback a datos del día anterior si la API falla
- Nunca hacer llamadas en tiempo real desde el frontend

---

### Riesgo 6: Zona de Cobertura Limitada (BAJO)

**Observación:** La densidad de datos en la Ciudad Amurallada es excelente. En zonas periféricas (Bocagrande, Bocachica) la calidad baja.

**Mitigación:** Ajustar radio de búsqueda por zona. Para el centro histórico: 1-2km. Para Bocagrande: radio separado con centro diferente.

---

### Riesgo 7: Fotos Requieren URL Dinámica (BAJO)

**Problema (Legacy):** El campo `photo_reference` expira y requiere construir la URL con la key en el frontend — expone la API key.

**Solución (New API v1):** Las fotos tienen un `name` que se usa como endpoint: `GET /v1/{name}/media?maxWidthPx=800`. Esto se puede proxear desde el backend sin exponer la key.

---

## 7. Optimización de Costos

### Pricing actual de Google Places API v1 (mayo 2026)

| SKU | Precio / 1000 req | Tier |
|---|---|---|
| Nearby Search (Essentials) | $32 | id, displayName, photos |
| Nearby Search (Pro) | $35 | + horarios, contacto |
| Text Search (Essentials) | $32 | id, displayName |
| Text Search (Pro) | $35 | + horarios, contacto |
| Place Details (Essentials) | $17 | id, displayName, fotos |
| Place Details (Pro) | $20 | + horarios, contacto, reviews |
| Photo Media | $7 | imagen |
| Autocomplete | $2.83 | |
| **Crédito mensual gratuito** | **$200** | ~5,700 req de Nearby Search |

### Escenarios de costo

**Escenario 1: Sin caché (tiempo real puro) — INVIABLE**
```
100 usuarios/día × 5 búsquedas = 500 searchNearby/día
500 × 30 días = 15,000 req/mes
15,000 × $0.035 = $525/mes → supera crédito gratuito

Si cada búsqueda devuelve un lugar y el usuario lo abre:
+ 15,000 Place Details × $0.02 = $300/mes
Total: ~$825/mes para solo 100 usuarios
```

**Escenario 2: Caché con warming diario (RECOMENDADO)**
```
10 categorías × 3 páginas searchNearby = 30 req/día
30 × 30 = 900 req/mes → dentro del crédito gratuito ($28.8)

Place Details de top 20 por categoría = 200 req/día
200 × 30 = 6,000 req/mes → $120/mes
Fotos: 200 photos × 30 = 6,000 req × $0.007 = $42/mes

Total estimado: ~$162/mes (dentro del crédito de $200)
→ Costo efectivo: $0 con hasta ~100 establecimientos en catálogo
```

**Escenario 3: Caché + búsqueda en tiempo real para queries custom**
```
Base: $162/mes (warming)
+ 500 búsquedas custom/mes × $0.035 = $17.5/mes
Total: ~$180/mes → aún dentro del crédito gratuito
```

### Reglas de optimización

1. **Nunca llamar desde el frontend** — toda llamada pasa por el backend
2. **Field masks siempre** — no pedir campos que no se muestran
3. **Caché agresivo en fotos** — son el ítem más caro en volumen
4. **Una sola llamada de warming por categoría/día** — no por usuario
5. **Rate limiting del backend** — máximo 1 req/segundo a Google
6. **Presupuesto de alerta** en Google Cloud Console (alert al 80% del crédito)

---

## 8. Modelo de Datos Sugerido

### Tablas PostgreSQL (Supabase)

```sql
-- Lugares maestros
CREATE TABLE places (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id       TEXT UNIQUE NOT NULL,           -- ChIJuWFEhJ8v9o4R...
  primary_type          TEXT NOT NULL,                   -- caribbean_restaurant
  types                 TEXT[],                          -- [restaurant, bar, ...]
  platform_category     TEXT NOT NULL,                   -- ver categorías abajo
  name                  TEXT NOT NULL,
  formatted_address     TEXT,
  latitude              DECIMAL(9,7) NOT NULL,
  longitude             DECIMAL(10,7) NOT NULL,
  rating                DECIMAL(2,1),
  user_rating_count     INT,
  price_level           TEXT,                            -- PRICE_LEVEL_MODERATE
  price_display         TEXT,                            -- $$
  phone                 TEXT,
  website               TEXT,
  google_maps_url       TEXT,
  editorial_summary_en  TEXT,
  editorial_summary_es  TEXT,                            -- traducido
  business_status       TEXT DEFAULT 'OPERATIONAL',     -- PERMANENTLY_CLOSED etc
  is_verified           BOOLEAN DEFAULT false,
  last_synced_at        TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Horarios (separados para TTL independiente)
CREATE TABLE place_hours (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        UUID REFERENCES places(id) ON DELETE CASCADE,
  day_of_week     INT,                                   -- 0=Domingo...6=Sábado
  open_time       TIME,
  close_time      TIME,
  last_updated    TIMESTAMPTZ DEFAULT NOW()
);

-- Fotos
CREATE TABLE place_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id        UUID REFERENCES places(id) ON DELETE CASCADE,
  photo_name      TEXT NOT NULL,                         -- v1 photo name (para URL)
  width_px        INT,
  height_px       INT,
  display_order   INT DEFAULT 0,
  last_updated    TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías de la plataforma (mapeo semántico)
CREATE TABLE platform_categories (
  slug        TEXT PRIMARY KEY,                          -- restaurants, bars, nightlife
  label_es    TEXT NOT NULL,                             -- Restaurantes
  label_en    TEXT,
  icon        TEXT,
  google_types TEXT[],                                   -- tipos de Google que mapean a esta cat.
  primary_types TEXT[]                                   -- primaryType preferidos
);

-- Caché de búsquedas (para no repetir queries idénticas)
CREATE TABLE search_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key       TEXT UNIQUE NOT NULL,                  -- MD5 de params
  category        TEXT,
  lat             DECIMAL(9,7),
  lng             DECIMAL(10,7),
  radius_m        INT,
  place_ids       TEXT[],                                -- order de resultados
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índices críticos
CREATE INDEX idx_places_category ON places(platform_category);
CREATE INDEX idx_places_location ON places USING GIST(
  ST_MakePoint(longitude, latitude)::geography
);
CREATE INDEX idx_places_rating ON places(rating DESC);
CREATE INDEX idx_places_status ON places(business_status);
CREATE INDEX idx_search_cache_key ON search_cache(cache_key);
CREATE INDEX idx_search_cache_expires ON search_cache(expires_at);
```

### Mapeo de Categorías de la Plataforma

```typescript
export const CATEGORY_MAP: Record<string, {
  googleTypes: string[],
  primaryTypes: string[],
  excludeTypes: string[]
}> = {
  restaurants: {
    googleTypes: ['restaurant'],
    primaryTypes: [
      'restaurant', 'caribbean_restaurant', 'fine_dining_restaurant',
      'seafood_restaurant', 'latin_american_restaurant', 'steak_house'
    ],
    excludeTypes: ['lodging']
  },
  fast_food: {
    googleTypes: ['restaurant'],
    primaryTypes: ['fast_food_restaurant', 'hamburger_restaurant', 'pizza_restaurant'],
    excludeTypes: ['lodging']
  },
  bars: {
    googleTypes: ['bar'],
    primaryTypes: ['bar', 'wine_bar', 'cocktail_bar', 'sports_bar'],
    excludeTypes: ['lodging', 'night_club']
  },
  nightlife: {
    googleTypes: ['night_club'],
    primaryTypes: ['night_club', 'dance_hall'],
    excludeTypes: ['lodging']
  },
  cafes: {
    googleTypes: ['cafe'],
    primaryTypes: ['cafe', 'coffee_shop', 'tea_house'],
    excludeTypes: ['lodging']
  },
  tourist_attractions: {
    googleTypes: ['tourist_attraction'],
    primaryTypes: ['tourist_attraction', 'historical_landmark', 'monument'],
    excludeTypes: ['lodging']
  },
  shopping: {
    googleTypes: ['shopping_mall'],
    primaryTypes: ['shopping_mall', 'market'],
    excludeTypes: []
  },
  recreation: {
    googleTypes: ['amusement_park', 'bowling_alley', 'movie_theater'],
    primaryTypes: ['amusement_park', 'bowling_alley', 'movie_theater', 'zoo', 'aquarium'],
    excludeTypes: []
  }
}
```

---

## 9. Recomendaciones Técnicas

### 1. Adoptar New Places API v1 exclusivamente

No mezclar generaciones. La v1 tiene mejor tipado, field masks y el campo `primaryType` que es clave para filtrar correctamente.

### 2. Usar `includedPrimaryTypes` + `excludedTypes` en searchNearby

```json
{
  "includedPrimaryTypes": ["restaurant", "caribbean_restaurant"],
  "excludedTypes": ["lodging"],
  "maxResultCount": 20,
  "rankPreference": "POPULARITY",
  "locationRestriction": {
    "circle": {
      "center": { "latitude": 10.4236, "longitude": -75.5516 },
      "radius": 2000
    }
  }
}
```

### 3. Cubrir Cartagena con múltiples centros de búsqueda

```typescript
const CARTAGENA_ZONES = [
  { name: 'Ciudad Amurallada', lat: 10.4236, lng: -75.5516, radius: 1500 },
  { name: 'Getsemaní',          lat: 10.4232, lng: -75.5451, radius: 800  },
  { name: 'San Diego',           lat: 10.4268, lng: -75.5487, radius: 600  },
  { name: 'Bocagrande',          lat: 10.3960, lng: -75.5550, radius: 2000 },
  { name: 'El Laguito',          lat: 10.3892, lng: -75.5610, radius: 1000 },
  { name: 'Manga',               lat: 10.4090, lng: -75.5380, radius: 1500 },
  { name: 'Castillogrande',      lat: 10.3950, lng: -75.5480, radius: 1000 },
]
```

### 4. Capa de traducción y enriquecimiento

El `editorialSummary` viene en inglés. Opciones:
- **Opción A**: Cloud Translation API (~$20/millón de caracteres) — automático, sin curación
- **Opción B**: Claude API — traducir + reescribir con tono local caribeño, cálido y atractivo
- **Opción C**: Descripción propia en la tabla `places.editorial_summary_es` — curada manualmente para top lugares

**Recomendación**: Opción B para los top 50 lugares, Opción A para el resto.

### 5. Filtro de calidad mínima

Antes de guardar un lugar en la DB:
```typescript
const meetsQualityThreshold = (place: GooglePlace): boolean =>
  place.rating >= 3.5 &&
  place.userRatingCount >= 30 &&
  place.businessStatus === 'OPERATIONAL' &&
  !BANNED_PLACE_IDS.includes(place.id)
```

### 6. Proxy de fotos desde el backend

```typescript
// Nunca exponer: https://places.googleapis.com/v1/{name}/media?key=KEY
// Sí exponer: https://tu-api.com/places/{placeId}/photos/{index}

// Backend handler:
app.get('/places/:placeId/photos/:index', async (req, res) => {
  const photoName = await getPhotoName(req.params.placeId, req.params.index)
  const image = await fetch(
    `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800`,
    { headers: { 'X-Goog-Api-Key': process.env.GOOGLE_API_KEY } }
  )
  res.set('Cache-Control', 'public, max-age=2592000') // 30 días
  image.body.pipe(res)
})
```

### 7. Sistema de deduplicación

Un mismo lugar puede aparecer en múltiples categorías. El `google_place_id` como UNIQUE en la tabla `places` previene duplicados. El `place_id` es estable y no cambia.

### 8. Paginación y ordenamiento propio

Google devuelve por relevancia interna. La plataforma debería permitir:
- Ordenar por rating DESC
- Filtrar por precio (price_level)
- Filtrar por "abierto ahora" (usando horarios locales, no depender de `openNow` de Google que usa la hora del servidor)

---

## 10. Próximos Pasos

### Fase 1: Infraestructura (1-2 semanas)

- [ ] Crear proyecto en Google Cloud Console y configurar restricciones de la API key (HTTP referrers + IP del backend)
- [ ] Habilitar facturación y configurar alerta de presupuesto al 80% de $200
- [ ] Crear tablas en Supabase según el modelo de datos propuesto
- [ ] Implementar el primer Edge Function como proxy de búsqueda

### Fase 2: Carga inicial de datos (1 semana)

- [ ] Ejecutar script de warming para las 8 categorías en 7 zonas de Cartagena
- [ ] Aplicar filtros de calidad (rating >= 3.5, status OPERATIONAL)
- [ ] Traducir editorial summaries de top 50 lugares con Claude API
- [ ] Verificar manualmente los top 20 lugares por categoría

### Fase 3: Integración con el frontend (1-2 semanas)

- [ ] Adaptar el tipo `Restaurant` en `mock.ts` al nuevo modelo de datos de Google
- [ ] Reemplazar `RESTAURANTS` hardcodeados por fetch al endpoint de Supabase
- [ ] Adaptar `RestaurantCards.tsx` para trabajar con datos dinámicos
- [ ] Implementar proxy de fotos (reemplazar `picsum.photos` por fotos reales de Google)
- [ ] Agregar indicador "abierto ahora" usando horarios locales de Cartagena (UTC-5)

### Fase 4: Actualización periódica (1 semana)

- [ ] Cron job diario de re-sincronización de horarios y estado operativo
- [ ] Cron job semanal de actualización de ratings
- [ ] Sistema de alertas si un lugar top cambia de estado a PERMANENTLY_CLOSED

### Fase 5: Optimización de experiencia (ongoing)

- [ ] Implementar búsqueda semántica vía `searchText` para queries del usuario en el chat
- [ ] Agregar filtros por precio, zona y "abierto ahora" en los cards
- [ ] Sistema de favoritos/bookmarks del huésped
- [ ] Integrar with the itinerary panel (lugares guardados del huésped)

---

## Apéndice: Datos de Lugares Reales Encontrados

### Restaurantes destacados confirmados en Cartagena (con datos reales de la API)

| Nombre | Rating | Reseñas | Precio | Zona |
|---|---|---|---|---|
| Carta Ajena Restaurante | 4.9 | 1,786 | — | Getsemaní |
| RESTAURANTE EL BURLADOR | 4.8 | 4,702 | $$ | Santo Domingo |
| RESTAURANTE CANDÉ | 4.6 | 8,515 | $$$ | San Diego |
| Casa Bohême | 4.7 | 2,147 | — | El Centro |
| Mar y Zielo | 4.6 | 991 | — | El Centro |
| Restaurante San Valentin | 4.4 | 8,879 | $$ | El Centro |
| Crepes & Waffles | 4.5 | 9,694 | $$ | Plaza San Pedro |
| Rooftop La Magnolia | 4.5 | 459 | — | El Centro |

### Cafés destacados

| Nombre | Rating | Reseñas |
|---|---|---|
| Época Café Bar | 4.7 | 3,484 |
| Coffee and... | 4.7 | 196 |
| Se Volvió Prisprí | 4.4 | 1,568 |

### Centros Comerciales

| Nombre | Rating | Reseñas |
|---|---|---|
| Mallplaza Cartagena | 4.6 | 21,890 |
| Caribe Plaza | 4.6 | 20,486 |

### Vida nocturna (operativos)

| Nombre | Rating | Reseñas |
|---|---|---|
| Eivissa Cartagena | 4.4 | 742 |
| La farra club | 4.0 | 459 |
| Café del Mar | 4.4 | 20,930 |

---

*Documento generado con pruebas reales ejecutadas el 2026-05-29. Los datos de API pueden variar. Verificar pricing actualizado en [Google Maps Platform Pricing](https://mapsplatform.google.com/pricing/).*
