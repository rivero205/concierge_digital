# Concierge Digital — Plataforma Comercial MVP · Mundial 2026

**Fecha:** 2026-05-13  
**Producto:** CONCIERGE Digital (concierge-digital-taupe.vercel.app)  
**Objetivo:** Transformar el chatbot turístico actual en una plataforma de activación comercial orientada a ejecución de reservas para visitantes del Mundial FIFA 2026 México.

---

## 1. Visión General

El producto deja de ser un asistente conversacional genérico y se convierte en un **concierge comercial premium** que:
- Recopila contexto del huésped en un onboarding de 4 pasos
- Personaliza absolutamente toda la experiencia posterior (nombre, hotel, idioma, preferencias)
- Ejecuta 2 acciones comerciales concretas: reservas de transporte y reservas de restaurantes
- Registra las reservas en un panel de itinerario visible
- Soporta voz bidireccional (speech-to-text + text-to-speech)

**Sin backend real.** Todo funciona con datos mockeados/hardcodeados. La experiencia debe parecer funcional y convincente para demo de cliente.

---

## 2. Arquitectura

### 2.1 Estructura de archivos

```
src/
  context/
    GuestContext.tsx          ← estado global del huésped (React Context + sessionStorage)
  components/
    OnboardingFlow.tsx        ← 4 pasos de onboarding
    ConciergeView.tsx         ← reemplaza el actual: chat + voz + detección de intención
    ItineraryPanel.tsx        ← panel slide-in de reservas confirmadas
    cards/
      TransportCards.tsx      ← 3 niveles de vehículo con botón RESERVAR
      RestaurantCards.tsx     ← 5 restaurantes con botón RESERVAR MESA
```

Los archivos existentes que NO cambian: `HeroSection.tsx`, `AboutSection.tsx`, `CollectionSection.tsx`, `CTASection.tsx`, `ConciergeChat.tsx` (botón flotante), `openrouter.ts` (se puede eliminar o ignorar), `index.css`.

### 2.2 Estado global — `GuestContext`

```ts
type GuestProfile = {
  language: string        // código ISO: 'es' | 'en' | 'pt' | 'fr' | 'de' | 'zh' | 'ar' | 'ja'
  title: string           // 'Mr.' | 'Mrs.' | 'Ms.' | 'Dr.' | 'Sir' | 'Lady' | ''
  firstName: string
  lastName: string
  city: 'CDMX' | 'Guadalajara' | 'Monterrey'
  hotel: string
  interests: string[]
  matches: string[]       // IDs de partidos seleccionados
  bookings: Booking[]     // reservas confirmadas
  onboardingDone: boolean
}

type Booking = {
  id: string
  type: 'transport' | 'restaurant'
  title: string
  subtitle: string        // ej: "Sedán Ejecutivo · 3 personas"
  datetime: string        // ej: "Hoy · 8:00 PM"
  detail: string          // ej: "Four Seasons → Estadio Azteca"
  confirmedAt: number     // timestamp
}
```

El estado persiste en `sessionStorage` para que el onboarding no se repita al refrescar. Se inicializa desde `sessionStorage` si existe.

### 2.3 Flujo general

```
Landing
  └─ [Activate Concierge] → App.tsx abre ConciergeView
       ├─ onboardingDone === false → OnboardingFlow (4 pasos)
       │     └─ [ENTRAR AL CONCIERGE] → setOnboardingDone(true)
       └─ onboardingDone === true  → Chat personalizado
             ├─ ItineraryPanel (slide-in desde derecha, sobre el chat)
             ├─ TransportCards (inline en el chat)
             └─ RestaurantCards (inline en el chat)
```

---

## 3. Onboarding Flow

**Estética:** fondo negro puro, barra de progreso superior en neon verde (#C8FF00), botones BACK / CONTINUE, transiciones fade entre pasos.

### Paso 1 — Idioma
- Grid 4×2 con los 8 idiomas: English, Español, Português, Français, Deutsch, 中文, العربية, 日本語
- Pre-selección automática con `navigator.language`
- Item seleccionado: borde + texto en #C8FF00
- CONTINUE activo siempre (hay selección por defecto)

### Paso 2 — Identidad
- Pills de título: `MR. · MRS. · MS. · DR. · SIR · LADY · —`
- Campos de texto: Given Name, Family Name
- CONTINUE activo solo cuando `firstName` no está vacío

### Paso 3 — Alojamiento
- 3 cards de ciudad: CDMX / Guadalajara / Monterrey (con imagen de fondo)
- Al seleccionar ciudad, aparece la lista de hoteles correspondiente debajo
- Hoteles por ciudad:
  - CDMX: Four Seasons Hotel México D.F. / Las Alcobas Luxury Collection / St. Regis Mexico City / Sofitel Mexico City Reforma / Camino Real Polanco
  - Guadalajara: Hotel Demetria / Casa Habita / Riu Plaza Guadalajara / Quinta Real GDL
  - Monterrey: Live Aqua Urban Resort Monterrey / Hotel Habita MTY / Quinta Real Monterrey / Safi Royal Luxury
- CONTINUE activo cuando ciudad + hotel seleccionados

### Paso 4 — Gustos & Partidos
- **Intereses** (multiselect chips): Fine Dining, Mezcal & Spirits, Wellness & Spa, Arte Contemporáneo, Shopping Privado, Arquitectura, Música en Vivo, Cigar Lounges
- **Partidos** (lista con ADD/ADDED):
  - CDMX (Estadio Azteca): México vs. Group A opener (11 Jun) — pre-añadido, Argentina vs. Grupo B (15 Jun), Brasil vs. Grupo C (18 Jun), Semifinal (9 Jul)
  - Guadalajara (Estadio Akron): USA vs. Grupo D (12 Jun), Alemania vs. Grupo E (16 Jun)
  - Monterrey (Estadio BBVA): España vs. Grupo F (13 Jun), Francia vs. Grupo G (17 Jun)
- Botón final: **"ENTRAR AL CONCIERGE"**

---

## 4. Chat Interface

### 4.1 Mensaje de bienvenida personalizado

Generado dinámicamente con el contexto del huésped:

```
"Buenas noches, [title] [lastName].
Soy tu concierge exclusivo durante tu estadía en [hotel].
¿En qué puedo ayudarte hoy?"
```

El saludo (buenos días/tardes/noches) se detecta por hora local del cliente.

### 4.2 Chips de acción rápida

```
TRANSPORTE AL ESTADIO · RESERVAR CENA · MI ITINERARIO · DRIVER PRIVADO · PLAN DÍA DE PARTIDO
```

### 4.3 Detección de intención (keyword matching, sin API)

```
Transporte → palabras: "transporte", "driver", "estadio", "transfer", "auto", "carro", "van", "uber", "ride"
Restaurante → palabras: "cena", "cenar", "restaurante", "comer", "mesa", "dinner", "food", "eat", "reservar"
Itinerario → palabras: "itinerario", "reservas", "mis planes", "agenda", "bookings"
Fallback → respuesta contextual fija basada en hotel/ciudad del huésped
```

### 4.4 Respuestas contextualmente generadas (mockeadas)

El sistema genera triggers automáticos basados en el contexto:
- Si el usuario tiene un partido seleccionado próximo: "Vemos que tienes el partido México vs. Group A el 11 de junio. ¿Quieres que arranquemos con el transfer al Estadio Azteca?"
- Si el usuario es del Four Seasons: las recomendaciones de restaurantes priorizan Polanco/Reforma

---

## 5. Flujos Comerciales

### 5.1 Transporte

**Trigger:** el usuario escribe algo relacionado con transporte o presiona chip "TRANSPORTE AL ESTADIO" / "DRIVER PRIVADO"

**Respuesta del concierge:** mensaje de texto corto + 3 cards inline

```
Nivel 1 · Sedán Ejecutivo
  Imagen: sedán negro de lujo
  Capacidad: hasta 3 personas
  Precio: $45 USD
  [RESERVAR]

Nivel 2 · SUV Premium  
  Imagen: SUV negro
  Capacidad: hasta 5 personas
  Precio: $75 USD
  [RESERVAR]

Nivel 3 · Van VIP
  Imagen: van ejecutiva
  Capacidad: hasta 8 personas
  Precio: $120 USD
  [RESERVAR]
```

**Al presionar RESERVAR:**
1. Mensaje de confirmación en el chat: *"Listo. Tu Sedán Ejecutivo está reservado para las 8:00 PM. El driver Roberto se comunicará 30 minutos antes."*
2. La reserva aparece en `GuestContext.bookings`
3. Badge en el chip "MI ITINERARIO" se actualiza

### 5.2 Restaurantes

**Trigger:** el usuario escribe algo relacionado con comida/restaurantes o presiona chip "RESERVAR CENA"

**Respuesta del concierge:** mensaje de texto + 5 cards inline

```
Pujol · Polanco · Alta cocina mexicana
  Imagen del restaurante
  Precio: $$$$
  [RESERVAR MESA]

Quintonil · Polanco · Top 30 Mundial
  ...
  [RESERVAR MESA]

Contramar · Roma Norte · Mariscos
  ...
  [RESERVAR MESA]

El Cardenal · Centro · Mexicano tradicional
  ...
  [RESERVAR MESA]

Mercado Roma · Roma · Experiencia de mercado
  ...
  [RESERVAR MESA]
```

Los restaurantes se filtran por ciudad del huésped (distintos sets para GDL y MTY).

**Al presionar RESERVAR MESA:**
1. El concierge pregunta: *"¿Para cuántas personas y a qué hora?"*
2. El usuario responde (texto libre o selecciona de opciones rápidas: 2 / 4 / 6 personas)
3. Confirmación en chat + reserva al itinerario

---

## 6. Panel de Itinerario

**Apertura:** slide-in desde la derecha sobre el chat (overlay, no reemplaza). Se abre con chip "MI ITINERARIO" o automáticamente tras confirmar una reserva.

**Estructura:**
```
MI ITINERARIO          [X]
─────────────────────────
● CONFIRMADO
🚗 Sedán Ejecutivo
   Hoy · 8:00 PM
   Four Seasons → Estadio Azteca

● CONFIRMADO
🍽 Pujol · Polanco
   Mañana · 9:15 PM · 2 personas
─────────────────────────
[Estado vacío: "Aún no tienes reservas.
 Pídele al concierge lo que necesites."]
```

- Badge verde "CONFIRMADO" en cada ítem
- Ícono de categoría (🚗 transporte, 🍽 restaurante)
- Sin tabs por ahora — solo lista única ordenada por hora

---

## 7. Sistema de Voz

**Speech-to-text (`SpeechRecognition` API):**
- Botón de micrófono visible dentro del input bar
- Al presionar: inicia grabación, el ícono pulsa en rojo
- Al soltar (o tras silencio): texto aparece en el input y se envía automáticamente
- Fallback: si el browser no soporta la API, el botón no aparece

**Text-to-speech (`SpeechSynthesis` API):**
- Cada respuesta del concierge se lee en voz alta automáticamente
- Voz: preferencia por voz femenina en el idioma del usuario (`lang` del GuestContext)
- Velocidad: 0.9 (ligeramente más lenta que default para sonar premium)
- Botón de mute visible en el header del chat para desactivar

---

## 8. Datos Mock

### Imágenes de vehículos
Usar URLs de Unsplash o Picsum con seeds fijos para consistencia visual.

### Imágenes de restaurantes
Usar Picsum con seeds fijos (mismos que el producto actual para restaurantes).

### Imágenes de ciudades (onboarding paso 3)
Unsplash: CDMX skyline, Guadalajara catedral, Monterrey cerro de la Silla.

---

## 9. Lo que NO cambia

- `HeroSection.tsx`, `AboutSection.tsx`, `CollectionSection.tsx` — landing intacta
- `ConciergeChat.tsx` (botón flotante) — sigue abriendo el concierge
- `index.css` — estilos globales sin cambios
- Paleta de colores: negro (#000000), neon verde (#C8FF00), crema (#EFF4FF)
- Tipografías: Anton, Condiment, system-ui
- Animación de blob/entrada — se conserva tal cual

---

## 10. Fuera de Scope (MVP)

- Backend real ni base de datos
- Autenticación de usuarios
- Pagos reales
- Notificaciones push o email
- Integración real con proveedores de transporte o restaurantes
- Múltiples sesiones o persistencia cross-device
- Tab "PAST" en el itinerario
