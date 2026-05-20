# Concierge Digital — Plataforma Comercial MVP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar el chatbot turístico actual en una plataforma comercial con onboarding de 4 pasos, flujos de reserva de transporte y restaurantes, panel de itinerario y voz bidireccional.

**Architecture:** Se añade `GuestContext` para estado global persistido en `sessionStorage`. `ConciergeView.tsx` se reescribe completamente. Se añaden `OnboardingFlow.tsx`, `ItineraryPanel.tsx`, `TransportCards.tsx` y `RestaurantCards.tsx`. La landing y su animación de entrada no cambian.

**Tech Stack:** React 18, TypeScript, GSAP, Tailwind CSS, Vite, Web Speech API (SpeechRecognition + SpeechSynthesis), datos 100% mockeados.

**Spec:** `docs/superpowers/specs/2026-05-13-concierge-comercial-design.md`

---

## Mapa de archivos

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Crear | `src/context/GuestContext.tsx` | Estado global huésped + bookings |
| Crear | `src/data/mock.ts` | Todos los datos estáticos: hoteles, restaurantes, vehículos, partidos |
| Crear | `src/components/OnboardingFlow.tsx` | 4 pasos de onboarding |
| Crear | `src/components/cards/TransportCards.tsx` | 3 niveles de vehículo |
| Crear | `src/components/cards/RestaurantCards.tsx` | 5 restaurantes por ciudad |
| Crear | `src/components/ItineraryPanel.tsx` | Panel slide-in de reservas |
| Reemplazar | `src/components/ConciergeView.tsx` | Chat + intent detection + voz |
| Modificar | `src/App.tsx` | Integrar GuestContext provider |
| Eliminar | `src/lib/openrouter.ts` | Ya no se usa Gemini |
| Eliminar | `src/lib/concierge-prompt.ts` | Ya no se usa prompt de IA |

---

## Task 1: GuestContext + tipos + datos mock

**Files:**
- Create: `src/context/GuestContext.tsx`
- Create: `src/data/mock.ts`

- [ ] **Step 1: Crear `src/data/mock.ts`** con todos los datos estáticos

```typescript
// src/data/mock.ts

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'ja', label: '日本語' },
]

export const TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Sir', 'Lady', '—']

export const HOTELS_BY_CITY: Record<string, string[]> = {
  CDMX: [
    'Four Seasons Hotel México D.F.',
    'Las Alcobas Luxury Collection',
    'St. Regis Mexico City',
    'Sofitel Mexico City Reforma',
    'Camino Real Polanco',
  ],
  Guadalajara: [
    'Hotel Demetria',
    'Casa Habita',
    'Riu Plaza Guadalajara',
    'Quinta Real Guadalajara',
  ],
  Monterrey: [
    'Live Aqua Urban Resort Monterrey',
    'Hotel Habita MTY',
    'Quinta Real Monterrey',
    'Safi Royal Luxury',
  ],
}

export const INTERESTS = [
  'Fine Dining',
  'Mezcal & Spirits',
  'Wellness & Spa',
  'Arte Contemporáneo',
  'Shopping Privado',
  'Arquitectura',
  'Música en Vivo',
  'Cigar Lounges',
]

export type Match = {
  id: string
  teams: string
  date: string
  stadium: string
  city: string
}

export const MATCHES: Match[] = [
  { id: 'm1', teams: 'México vs. Group A opener', date: '11 Jun · 6:00 PM', stadium: 'Estadio Azteca', city: 'CDMX' },
  { id: 'm2', teams: 'Argentina vs. Grupo B', date: '15 Jun · 5:00 PM', stadium: 'Estadio Azteca', city: 'CDMX' },
  { id: 'm3', teams: 'Brasil vs. Grupo C', date: '18 Jun · 3:00 PM', stadium: 'Estadio Azteca', city: 'CDMX' },
  { id: 'm4', teams: 'Semifinal', date: '9 Jul · 7:00 PM', stadium: 'Estadio Azteca', city: 'CDMX' },
  { id: 'm5', teams: 'USA vs. Grupo D', date: '12 Jun · 4:00 PM', stadium: 'Estadio Akron', city: 'Guadalajara' },
  { id: 'm6', teams: 'Alemania vs. Grupo E', date: '16 Jun · 6:00 PM', stadium: 'Estadio Akron', city: 'Guadalajara' },
  { id: 'm7', teams: 'España vs. Grupo F', date: '13 Jun · 5:00 PM', stadium: 'Estadio BBVA', city: 'Monterrey' },
  { id: 'm8', teams: 'Francia vs. Grupo G', date: '17 Jun · 7:00 PM', stadium: 'Estadio BBVA', city: 'Monterrey' },
]

export type Vehicle = {
  id: string
  level: string
  name: string
  capacity: string
  price: string
  desc: string
  img: string
}

export const VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    level: 'Nivel 1',
    name: 'Sedán Ejecutivo',
    capacity: 'Hasta 3 personas',
    price: '$45 USD',
    desc: 'Confort y discreción para traslados en ciudad',
    img: 'https://picsum.photos/seed/car-sedan/600/400',
  },
  {
    id: 'v2',
    level: 'Nivel 2',
    name: 'SUV Premium',
    capacity: 'Hasta 5 personas',
    price: '$75 USD',
    desc: 'Espacio y elegancia para grupos pequeños',
    img: 'https://picsum.photos/seed/car-suv/600/400',
  },
  {
    id: 'v3',
    level: 'Nivel 3',
    name: 'Van VIP',
    capacity: 'Hasta 8 personas',
    price: '$120 USD',
    desc: 'Experiencia grupal premium con amenidades a bordo',
    img: 'https://picsum.photos/seed/car-van/600/400',
  },
]

export type Restaurant = {
  id: string
  name: string
  cuisine: string
  zone: string
  price: string
  desc: string
  img: string
  cities: string[]
}

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'r1',
    name: 'Pujol',
    cuisine: 'Alta cocina mexicana',
    zone: 'Polanco',
    price: '$$$$',
    desc: "Enrique Olvera's mole madre — reserva con anticipación",
    img: 'https://picsum.photos/seed/rcdmx1/600/400',
    cities: ['CDMX'],
  },
  {
    id: 'r2',
    name: 'Quintonil',
    cuisine: 'Mexicana contemporánea',
    zone: 'Polanco',
    price: '$$$$',
    desc: 'Top 30 mundial, cocina de temporada',
    img: 'https://picsum.photos/seed/rcdmx2/600/400',
    cities: ['CDMX'],
  },
  {
    id: 'r3',
    name: 'Contramar',
    cuisine: 'Mariscos',
    zone: 'Roma Norte',
    price: '$$$',
    desc: 'Tostadas de atún legendarias, perfecto para lunch',
    img: 'https://picsum.photos/seed/rcdmx3/600/400',
    cities: ['CDMX'],
  },
  {
    id: 'r4',
    name: 'El Cardenal',
    cuisine: 'Mexicano tradicional',
    zone: 'Centro Histórico',
    price: '$$',
    desc: 'Institución desde 1969, desayunos y comida tradicional',
    img: 'https://picsum.photos/seed/rcdmx4/600/400',
    cities: ['CDMX'],
  },
  {
    id: 'r5',
    name: 'Mercado Roma',
    cuisine: 'Mercado gourmet',
    zone: 'Roma',
    price: '$$',
    desc: 'La mejor experiencia de mercado en la ciudad',
    img: 'https://picsum.photos/seed/rcdmx5/600/400',
    cities: ['CDMX'],
  },
  {
    id: 'r6',
    name: 'Alcalde',
    cuisine: 'Mexicana moderna',
    zone: 'Americana',
    price: '$$$',
    desc: 'El mejor restaurante de Guadalajara, menú de temporada',
    img: 'https://picsum.photos/seed/rgdl1/600/400',
    cities: ['Guadalajara'],
  },
  {
    id: 'r7',
    name: 'La Chata',
    cuisine: 'Mexicano tradicional',
    zone: 'Centro',
    price: '$$',
    desc: 'Auténtica cocina jalisciense desde 1942',
    img: 'https://picsum.photos/seed/rgdl2/600/400',
    cities: ['Guadalajara'],
  },
  {
    id: 'r8',
    name: 'Birrería Las 9 Esquinas',
    cuisine: 'Birria',
    zone: 'Analco',
    price: '$',
    desc: 'La birria más famosa de Guadalajara',
    img: 'https://picsum.photos/seed/rgdl3/600/400',
    cities: ['Guadalajara'],
  },
  {
    id: 'r9',
    name: 'Pangea',
    cuisine: 'Mexicana contemporánea',
    zone: 'San Pedro',
    price: '$$$',
    desc: 'Referente gastronómico del norte de México',
    img: 'https://picsum.photos/seed/rmty1/600/400',
    cities: ['Monterrey'],
  },
  {
    id: 'r10',
    name: 'El Rey del Cabrito',
    cuisine: 'Cabrito asado',
    zone: 'Centro',
    price: '$$',
    desc: 'Icono regiomontano, especialidad en cabrito',
    img: 'https://picsum.photos/seed/rmty2/600/400',
    cities: ['Monterrey'],
  },
]
```

- [ ] **Step 2: Crear `src/context/GuestContext.tsx`**

```typescript
// src/context/GuestContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Booking = {
  id: string
  type: 'transport' | 'restaurant'
  title: string
  subtitle: string
  datetime: string
  detail: string
  confirmedAt: number
}

export type GuestProfile = {
  language: string
  title: string
  firstName: string
  lastName: string
  city: string
  hotel: string
  interests: string[]
  matches: string[]
  bookings: Booking[]
  onboardingDone: boolean
}

const DEFAULT_PROFILE: GuestProfile = {
  language: 'es',
  title: '',
  firstName: '',
  lastName: '',
  city: '',
  hotel: '',
  interests: [],
  matches: ['m1'],
  bookings: [],
  onboardingDone: false,
}

type GuestContextType = {
  guest: GuestProfile
  setGuest: (g: GuestProfile) => void
  addBooking: (b: Booking) => void
  completeOnboarding: (data: Omit<GuestProfile, 'bookings' | 'onboardingDone'>) => void
}

const GuestContext = createContext<GuestContextType | null>(null)

const STORAGE_KEY = 'concierge_guest'

export function GuestProvider({ children }: { children: ReactNode }) {
  const [guest, setGuestState] = useState<GuestProfile>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE
    } catch {
      return DEFAULT_PROFILE
    }
  })

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(guest))
  }, [guest])

  function setGuest(g: GuestProfile) {
    setGuestState(g)
  }

  function addBooking(b: Booking) {
    setGuestState(prev => ({ ...prev, bookings: [b, ...prev.bookings] }))
  }

  function completeOnboarding(data: Omit<GuestProfile, 'bookings' | 'onboardingDone'>) {
    setGuestState(prev => ({ ...prev, ...data, onboardingDone: true }))
  }

  return (
    <GuestContext.Provider value={{ guest, setGuest, addBooking, completeOnboarding }}>
      {children}
    </GuestContext.Provider>
  )
}

export function useGuest() {
  const ctx = useContext(GuestContext)
  if (!ctx) throw new Error('useGuest must be used inside GuestProvider')
  return ctx
}
```

- [ ] **Step 3: Verificar que compila**

```bash
npm run build
```
Esperado: sin errores de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/context/GuestContext.tsx src/data/mock.ts
git commit -m "feat: add GuestContext and mock data"
```

---

## Task 2: OnboardingFlow — esqueleto + paso 1 (Idioma)

**Files:**
- Create: `src/components/OnboardingFlow.tsx`

- [ ] **Step 1: Crear `src/components/OnboardingFlow.tsx`** con los 4 pasos

```typescript
// src/components/OnboardingFlow.tsx
import { useState } from 'react'
import { useGuest } from '../context/GuestContext'
import { LANGUAGES, TITLES, HOTELS_BY_CITY, INTERESTS, MATCHES } from '../data/mock'
import { ChevronLeft } from 'lucide-react'

type Step = 1 | 2 | 3 | 4

const CITIES = ['CDMX', 'Guadalajara', 'Monterrey']

const CITY_IMGS: Record<string, string> = {
  CDMX: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=600&q=80',
  Guadalajara: 'https://images.unsplash.com/photo-1568952433726-3896e3881c65?w=600&q=80',
  Monterrey: 'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=600&q=80',
}

function detectLang(): string {
  const lang = navigator.language?.slice(0, 2) ?? 'en'
  const supported = LANGUAGES.map(l => l.code)
  return supported.includes(lang) ? lang : 'en'
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: Step }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.07)' }}>
      <div style={{ height: '100%', background: '#C8FF00', width: `${(step / 4) * 100}%`, transition: 'width 0.4s ease' }} />
    </div>
  )
}

// ── Button styles ─────────────────────────────────────────────────────────────
const btnBase: React.CSSProperties = {
  fontFamily: '"Anton", sans-serif',
  fontSize: 11,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 100,
  padding: '11px 32px',
  cursor: 'pointer',
  transition: 'all 0.2s',
}

// ── Step 1: Language ──────────────────────────────────────────────────────────
function StepLanguage({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(11px,1.1vw,13px)', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10 }}>Paso 1 de 4</div>
      <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(28px,4vw,48px)', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#FFF', marginBottom: 8 }}>Welcome.</h2>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36 }}>Select your preferred language.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {LANGUAGES.map(l => (
          <button key={l.code} onClick={() => onChange(l.code)}
            style={{
              ...btnBase,
              padding: '13px 0',
              borderColor: value === l.code ? '#C8FF00' : 'rgba(255,255,255,0.1)',
              color: value === l.code ? '#C8FF00' : 'rgba(255,255,255,0.5)',
              background: value === l.code ? 'rgba(200,255,0,0.07)' : 'transparent',
              fontSize: 13,
              letterSpacing: '0.04em',
            }}>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step 2: Identity ──────────────────────────────────────────────────────────
function StepIdentity({
  title, firstName, lastName,
  onTitle, onFirst, onLast,
}: {
  title: string; firstName: string; lastName: string
  onTitle: (v: string) => void; onFirst: (v: string) => void; onLast: (v: string) => void
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '14px 18px', color: '#EFF4FF', fontSize: 15,
    fontFamily: 'system-ui, sans-serif', outline: 'none', boxSizing: 'border-box',
  }
  return (
    <div>
      <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(11px,1.1vw,13px)', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10 }}>Paso 2 de 4</div>
      <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(24px,3.5vw,40px)', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#FFF', marginBottom: 8 }}>How shall we address you?</h2>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 32 }}>Your name will personalize your experience.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {TITLES.map(t => (
          <button key={t} onClick={() => onTitle(t === title ? '' : t)}
            style={{ ...btnBase, padding: '9px 18px', borderColor: title === t ? '#C8FF00' : 'rgba(255,255,255,0.1)', color: title === t ? '#C8FF00' : 'rgba(255,255,255,0.4)', background: title === t ? 'rgba(200,255,0,0.07)' : 'transparent', fontSize: 11 }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input value={firstName} onChange={e => onFirst(e.target.value)} placeholder="Given Name" style={inputStyle} />
        <input value={lastName} onChange={e => onLast(e.target.value)} placeholder="Family Name" style={inputStyle} />
      </div>
    </div>
  )
}

// ── Step 3: Accommodation ─────────────────────────────────────────────────────
function StepAccommodation({
  city, hotel,
  onCity, onHotel,
}: {
  city: string; hotel: string
  onCity: (v: string) => void; onHotel: (v: string) => void
}) {
  return (
    <div>
      <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(11px,1.1vw,13px)', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10 }}>Paso 3 de 4</div>
      <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(24px,3.5vw,40px)', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#FFF', marginBottom: 8 }}>Where are you staying?</h2>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>Select your host city and hotel.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {CITIES.map(c => (
          <button key={c} onClick={() => { onCity(c); onHotel('') }}
            style={{ position: 'relative', height: 100, borderRadius: 10, overflow: 'hidden', border: `1px solid ${city === c ? '#C8FF00' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', transition: 'border-color 0.2s' }}>
            <img src={CITY_IMGS[c]} alt={c} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: city === c ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.55)' }} />
            <span style={{ position: 'relative', fontFamily: '"Anton", sans-serif', fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: city === c ? '#C8FF00' : '#FFF' }}>{c}</span>
          </button>
        ))}
      </div>
      {city && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(HOTELS_BY_CITY[city] ?? []).map(h => (
            <button key={h} onClick={() => onHotel(h)}
              style={{ ...btnBase, textAlign: 'left', borderRadius: 10, padding: '13px 18px', letterSpacing: '0.04em', fontSize: 13, borderColor: hotel === h ? '#C8FF00' : 'rgba(255,255,255,0.1)', color: hotel === h ? '#C8FF00' : 'rgba(255,255,255,0.5)', background: hotel === h ? 'rgba(200,255,0,0.07)' : 'transparent' }}>
              {h}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Step 4: Tastes & Matches ──────────────────────────────────────────────────
function StepTastes({
  city, interests, matches,
  onInterest, onMatch,
}: {
  city: string; interests: string[]; matches: string[]
  onInterest: (v: string) => void; onMatch: (v: string) => void
}) {
  const cityMatches = MATCHES.filter(m => m.city === city || city === '')
  return (
    <div>
      <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(11px,1.1vw,13px)', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10 }}>Paso 4 de 4</div>
      <h2 style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(22px,3vw,36px)', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#FFF', marginBottom: 8 }}>Tastes & Matches</h2>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>A few details to anticipate your wishes.</p>

      <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 10, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 12 }}>Intereses</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
        {INTERESTS.map(i => {
          const active = interests.includes(i)
          return (
            <button key={i} onClick={() => onInterest(i)}
              style={{ ...btnBase, padding: '8px 16px', fontSize: 10, borderColor: active ? '#C8FF00' : 'rgba(255,255,255,0.1)', color: active ? '#C8FF00' : 'rgba(255,255,255,0.4)', background: active ? 'rgba(200,255,0,0.07)' : 'transparent' }}>
              {i}
            </button>
          )
        })}
      </div>

      <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 10, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 12 }}>Partidos</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cityMatches.map(m => {
          const added = matches.includes(m.id)
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 16px' }}>
              <div>
                <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#FFF' }}>{m.teams}</div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{m.date} · {m.stadium}</div>
              </div>
              <button onClick={() => onMatch(m.id)}
                style={{ ...btnBase, padding: '7px 16px', fontSize: 9, borderColor: added ? '#C8FF00' : 'rgba(255,255,255,0.15)', color: added ? '#C8FF00' : 'rgba(255,255,255,0.4)', background: added ? 'rgba(200,255,0,0.07)' : 'transparent', flexShrink: 0 }}>
                {added ? 'ADDED' : 'ADD'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main OnboardingFlow ───────────────────────────────────────────────────────
export default function OnboardingFlow() {
  const { completeOnboarding } = useGuest()
  const [step, setStep] = useState<Step>(1)
  const [language, setLanguage] = useState(detectLang)
  const [title, setTitle] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [city, setCity] = useState('')
  const [hotel, setHotel] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [matches, setMatches] = useState<string[]>(['m1'])

  function toggleInterest(v: string) {
    setInterests(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }
  function toggleMatch(v: string) {
    setMatches(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  const canContinue =
    step === 1 ? !!language :
    step === 2 ? !!firstName.trim() :
    step === 3 ? !!(city && hotel) :
    true

  function handleContinue() {
    if (step < 4) { setStep(s => (s + 1) as Step); return }
    completeOnboarding({ language, title, firstName, lastName, city, hotel, interests, matches })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000', display: 'flex', flexDirection: 'column', fontFamily: '"Anton", sans-serif', overflowY: 'auto' }}>
      <ProgressBar step={step} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 640, width: '100%', margin: '0 auto', padding: 'clamp(48px,6vw,80px) clamp(24px,5vw,48px) 32px', boxSizing: 'border-box' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 56 }}>
          <span style={{ fontFamily: '"Anton", sans-serif', color: '#FFF', fontSize: 18, letterSpacing: '0.12em', textTransform: 'uppercase' }}>CONCIERGE</span>
          <span style={{ fontFamily: '"Condiment", cursive', fontSize: 20, color: '#C8FF00' }}>Digital</span>
        </div>

        {/* Step content */}
        <div style={{ flex: 1 }}>
          {step === 1 && <StepLanguage value={language} onChange={setLanguage} />}
          {step === 2 && <StepIdentity title={title} firstName={firstName} lastName={lastName} onTitle={setTitle} onFirst={setFirstName} onLast={setLastName} />}
          {step === 3 && <StepAccommodation city={city} hotel={hotel} onCity={setCity} onHotel={setHotel} />}
          {step === 4 && <StepTastes city={city} interests={interests} matches={matches} onInterest={toggleInterest} onMatch={toggleMatch} />}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, marginTop: 40, justifyContent: 'flex-end', alignItems: 'center' }}>
          {step > 1 && (
            <button onClick={() => setStep(s => (s - 1) as Step)}
              style={{ ...btnBase, background: 'transparent', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChevronLeft size={14} /> BACK
            </button>
          )}
          <button onClick={handleContinue} disabled={!canContinue}
            style={{ ...btnBase, background: canContinue ? '#C8FF00' : 'rgba(255,255,255,0.06)', color: canContinue ? '#000' : 'rgba(255,255,255,0.2)', borderColor: 'transparent', cursor: canContinue ? 'pointer' : 'default' }}>
            {step === 4 ? 'ENTRAR AL CONCIERGE' : 'CONTINUE'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npm run build
```
Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/OnboardingFlow.tsx
git commit -m "feat: add 4-step onboarding flow"
```

---

## Task 3: TransportCards + RestaurantCards

**Files:**
- Create: `src/components/cards/TransportCards.tsx`
- Create: `src/components/cards/RestaurantCards.tsx`

- [ ] **Step 1: Crear `src/components/cards/TransportCards.tsx`**

```typescript
// src/components/cards/TransportCards.tsx
import { VEHICLES, Vehicle } from '../../data/mock'
import { useGuest } from '../../context/GuestContext'
import { Booking } from '../../context/GuestContext'

type Props = {
  destination?: string
  onBooked: (msg: string) => void
}

export default function TransportCards({ destination = 'Estadio Azteca', onBooked }: Props) {
  const { addBooking } = useGuest()

  function reserve(v: Vehicle) {
    const booking: Booking = {
      id: `transport-${Date.now()}`,
      type: 'transport',
      title: v.name,
      subtitle: `${v.level} · ${v.capacity}`,
      datetime: 'Hoy · 8:00 PM',
      detail: `Hotel → ${destination}`,
      confirmedAt: Date.now(),
    }
    addBooking(booking)
    onBooked(`Listo. Tu ${v.name} está reservado para las 8:00 PM. El driver se comunicará 30 minutos antes.`)
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
        Opciones de transporte · {destination}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
        {VEHICLES.map(v => (
          <div key={v.id}
            style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#0a0a0a' }}>
            <div style={{ position: 'relative', height: 120 }}>
              <img src={v.img} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, transparent 60%)' }} />
              <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(200,255,0,0.15)', border: '1px solid rgba(200,255,0,0.25)', borderRadius: 100, padding: '2px 8px' }}>
                <span style={{ fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C8FF00', fontFamily: '"Anton", sans-serif' }}>{v.level}</span>
              </div>
            </div>
            <div style={{ padding: '10px 12px 14px' }}>
              <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#FFF', marginBottom: 3 }}>{v.name}</div>
              <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{v.capacity}</div>
              <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 10, lineHeight: 1.4 }}>{v.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: '"Anton", sans-serif', fontSize: 14, color: '#C8FF00' }}>{v.price}</span>
                <button onClick={() => reserve(v)}
                  style={{ fontFamily: '"Anton", sans-serif', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', background: '#C8FF00', color: '#000', border: 'none', borderRadius: 100, padding: '6px 14px', cursor: 'pointer' }}>
                  RESERVAR
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear `src/components/cards/RestaurantCards.tsx`**

```typescript
// src/components/cards/RestaurantCards.tsx
import { useState } from 'react'
import { RESTAURANTS, Restaurant } from '../../data/mock'
import { useGuest } from '../../context/GuestContext'
import { Booking } from '../../context/GuestContext'

type Props = {
  onBooked: (msg: string) => void
  onAskParty: (restaurant: Restaurant) => void
}

export default function RestaurantCards({ onBooked, onAskParty }: Props) {
  const { guest, addBooking } = useGuest()
  const [booked, setBooked] = useState<string[]>([])

  const cityRestaurants = RESTAURANTS.filter(r =>
    r.cities.includes(guest.city) || guest.city === ''
  ).slice(0, 5)

  function reserve(r: Restaurant, party = '2 personas', time = '9:00 PM') {
    const booking: Booking = {
      id: `restaurant-${Date.now()}`,
      type: 'restaurant',
      title: r.name,
      subtitle: `${r.cuisine} · ${r.zone}`,
      datetime: `Hoy · ${time}`,
      detail: `${party}`,
      confirmedAt: Date.now(),
    }
    addBooking(booking)
    setBooked(prev => [...prev, r.id])
    onBooked(`Perfecto. Mesa en ${r.name} reservada para ${party} a las ${time}. Recibirás confirmación en breve.`)
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
        Mejores mesas · {guest.city || 'CDMX'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
        {cityRestaurants.map(r => {
          const isBooked = booked.includes(r.id)
          return (
            <div key={r.id}
              style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: `1px solid ${isBooked ? 'rgba(200,255,0,0.25)' : 'rgba(255,255,255,0.08)'}`, background: '#0a0a0a', transition: 'border-color 0.2s' }}>
              <div style={{ position: 'relative', height: 110 }}>
                <img src={r.img} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, transparent 55%)' }} />
                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 100, padding: '2px 8px' }}>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)', fontFamily: '"Anton", sans-serif', letterSpacing: '0.1em' }}>{r.price}</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px 14px' }}>
                <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#FFF', marginBottom: 2 }}>{r.name}</div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{r.cuisine}</div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 10, lineHeight: 1.4 }}>{r.zone}</div>
                {isBooked ? (
                  <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8FF00', textAlign: 'center' }}>✓ RESERVADO</div>
                ) : (
                  <button onClick={() => { onAskParty(r) }}
                    style={{ width: '100%', fontFamily: '"Anton", sans-serif', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', background: '#C8FF00', color: '#000', border: 'none', borderRadius: 100, padding: '7px 0', cursor: 'pointer' }}>
                    RESERVAR MESA
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar compilación**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/cards/
git commit -m "feat: add TransportCards and RestaurantCards components"
```

---

## Task 4: ItineraryPanel

**Files:**
- Create: `src/components/ItineraryPanel.tsx`

- [ ] **Step 1: Crear `src/components/ItineraryPanel.tsx`**

```typescript
// src/components/ItineraryPanel.tsx
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { X } from 'lucide-react'
import { useGuest } from '../context/GuestContext'

type Props = {
  onClose: () => void
}

export default function ItineraryPanel({ onClose }: Props) {
  const { guest } = useGuest()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(panelRef.current,
      { x: '100%', opacity: 0 },
      { x: '0%', opacity: 1, duration: 0.4, ease: 'power3.out' }
    )
  }, [])

  function handleClose() {
    gsap.to(panelRef.current, {
      x: '100%', opacity: 0, duration: 0.3, ease: 'power3.in',
      onComplete: onClose,
    })
  }

  return (
    <div ref={panelRef}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(380px, 100%)', background: '#0a0a0a', borderLeft: '1px solid rgba(255,255,255,0.07)', zIndex: 10, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 16, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FFF' }}>Mi Itinerario</div>
          <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Reservas confirmadas</div>
        </div>
        <button onClick={handleClose}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={13} />
        </button>
      </div>

      {/* Bookings list */}
      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {guest.bookings.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
            <div style={{ fontSize: 32 }}>🗓</div>
            <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Aún no tienes reservas</div>
            <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}>Pídele al concierge lo que necesites.</div>
          </div>
        ) : (
          guest.bookings.map(b => (
            <div key={b.id}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{b.type === 'transport' ? '🚗' : '🍽'}</span>
                  <span style={{ fontFamily: '"Anton", sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#FFF' }}>{b.title}</span>
                </div>
                <div style={{ background: 'rgba(200,255,0,0.12)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 100, padding: '2px 8px' }}>
                  <span style={{ fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C8FF00', fontFamily: '"Anton", sans-serif' }}>● CONFIRMADO</span>
                </div>
              </div>
              <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                <div>{b.subtitle}</div>
                <div>{b.datetime}</div>
                <div>{b.detail}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ItineraryPanel.tsx
git commit -m "feat: add ItineraryPanel with slide-in animation"
```

---

## Task 5: ConciergeView — reescritura completa

**Files:**
- Modify: `src/components/ConciergeView.tsx` (reemplazar completamente)

Este componente reemplaza al actual. Mantiene la animación de blob de entrada. Agrega: bienvenida personalizada, chips comerciales, detección de intención, voice I/O, ItineraryPanel.

- [ ] **Step 1: Reemplazar `src/components/ConciergeView.tsx`**

```typescript
// src/components/ConciergeView.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { X, Mic, MicOff, VolumeX, Volume2, Calendar } from 'lucide-react'
import { useGuest } from '../context/GuestContext'
import TransportCards from './cards/TransportCards'
import RestaurantCards from './cards/RestaurantCards'
import ItineraryPanel from './ItineraryPanel'
import { MATCHES, Restaurant } from '../data/mock'

// ── Types ─────────────────────────────────────────────────────────────────────

type MsgType = 'text' | 'transport' | 'restaurant'

type LocalMsg = {
  role: 'user' | 'assistant'
  content: string
  type?: MsgType
  destination?: string
  pendingRestaurant?: Restaurant
}

// ── Intent detection ──────────────────────────────────────────────────────────

const TRANSPORT_KW = ['transporte', 'driver', 'estadio', 'transfer', 'auto', 'carro', 'van', 'uber', 'ride', 'llevar', 'traslado', 'transport', 'car', 'vehicle']
const RESTAURANT_KW = ['cena', 'cenar', 'restaurante', 'comer', 'mesa', 'dinner', 'food', 'eat', 'reservar', 'restaurant', 'hambre', 'hungry', 'table']
const ITINERARY_KW = ['itinerario', 'reservas', 'mis planes', 'agenda', 'bookings', 'reservaciones', 'schedule']

function detectIntent(text: string): 'transport' | 'restaurant' | 'itinerary' | 'fallback' {
  const low = text.toLowerCase()
  if (TRANSPORT_KW.some(k => low.includes(k))) return 'transport'
  if (RESTAURANT_KW.some(k => low.includes(k))) return 'restaurant'
  if (ITINERARY_KW.some(k => low.includes(k))) return 'itinerary'
  return 'fallback'
}

// ── Greeting ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function buildWelcome(guest: ReturnType<typeof useGuest>['guest']): string {
  const name = [guest.title, guest.lastName].filter(Boolean).join(' ') || guest.firstName || 'estimado huésped'
  const hotel = guest.hotel || 'tu hotel'
  const match = MATCHES.find(m => guest.matches.includes(m.id))
  let msg = `${getGreeting()}, ${name}. Soy tu concierge exclusivo durante tu estadía en **${hotel}**.\n\n`
  if (match) {
    msg += `Veo que tienes el partido **${match.teams}** el ${match.date}. ¿Quieres que arranquemos con el transfer al ${match.stadium}?\n\n`
  }
  msg += `¿En qué puedo ayudarte hoy?`
  return msg
}

// ── Fallback responses ────────────────────────────────────────────────────────

const FALLBACK_RESPONSES = [
  'Claro. ¿Puedo ayudarte con transporte al estadio o con una reserva en algún restaurante?',
  'Entendido. Estoy aquí para gestionar tus traslados, reservas de mesa y todo lo que necesites durante tu estadía.',
  'Con gusto. ¿Prefieres que te muestre opciones de transporte o de restaurantes para esta noche?',
]
let fallbackIdx = 0

// ── renderMsg (markdown básico) ───────────────────────────────────────────────

function renderMsg(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

// ── TTS helper ────────────────────────────────────────────────────────────────

function speak(text: string, lang: string, muted: boolean) {
  if (muted || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const clean = text.replace(/\*\*/g, '').replace(/<[^>]+>/g, '')
  const utt = new SpeechSynthesisUtterance(clean)
  utt.lang = lang
  utt.rate = 0.9
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v => v.lang.startsWith(lang) && v.name.toLowerCase().includes('female'))
    ?? voices.find(v => v.lang.startsWith(lang))
  if (preferred) utt.voice = preferred
  window.speechSynthesis.speak(utt)
}

// ── Chips ─────────────────────────────────────────────────────────────────────

const CHIPS = [
  { label: 'TRANSPORTE AL ESTADIO', prompt: 'Necesito transporte al estadio' },
  { label: 'RESERVAR CENA', prompt: 'Quiero reservar cena esta noche' },
  { label: 'DRIVER PRIVADO', prompt: 'Quiero un driver privado' },
  { label: 'PLAN DÍA DE PARTIDO', prompt: '¿Cómo organizo mi día de partido?' },
]

// ── Component ─────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'interface'

export default function ConciergeView({ onClose }: { onClose: () => void }) {
  const { guest } = useGuest()
  const [phase, setPhase] = useState<Phase>('intro')
  const [messages, setMessages] = useState<LocalMsg[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [thinkingMsg, setThinkingMsg] = useState('')
  const [showItinerary, setShowItinerary] = useState(false)
  const [muted, setMuted] = useState(false)
  const [listening, setListening] = useState(false)
  const [newBookingCount, setNewBookingCount] = useState(0)
  const prevBookingsLen = useRef(guest.bookings.length)

  // Refs
  const rootRef = useRef<HTMLDivElement>(null)
  const gooeyWrapRef = useRef<HTMLDivElement>(null)
  const blob1Ref = useRef<HTMLDivElement>(null)
  const blob2Ref = useRef<HTMLDivElement>(null)
  const blob3Ref = useRef<HTMLDivElement>(null)
  const introTxtRef = useRef<HTMLDivElement>(null)
  const uiRef = useRef<HTMLDivElement>(null)
  const msgsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const thinkRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Badge counter
  useEffect(() => {
    if (guest.bookings.length > prevBookingsLen.current) {
      setNewBookingCount(c => c + (guest.bookings.length - prevBookingsLen.current))
    }
    prevBookingsLen.current = guest.bookings.length
  }, [guest.bookings.length])

  // Lock scroll
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Cleanup
  useEffect(() => () => {
    if (thinkRef.current) clearTimeout(thinkRef.current)
    if (simRef.current) clearInterval(simRef.current)
    window.speechSynthesis?.cancel()
  }, [])

  // Scroll to bottom
  useEffect(() => {
    const el = msgsRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, thinking])

  // Focus input
  useEffect(() => {
    if (phase === 'interface') {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [phase])

  // Set welcome message when interface phase starts
  useEffect(() => {
    if (phase === 'interface' && messages.length === 0) {
      const welcome = buildWelcome(guest)
      setMessages([{ role: 'assistant', content: welcome }])
      speak(welcome, guest.language, muted)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // GSAP intro
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      gsap.set(uiRef.current, { opacity: 1, y: 0 })
      gsap.set(gooeyWrapRef.current, { opacity: 0 })
      setPhase('interface')
      return
    }
    const ctx = gsap.context(() => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      gsap.set(uiRef.current, { opacity: 0, y: 40 })
      gsap.set(introTxtRef.current, { opacity: 0 })
      const tl = gsap.timeline({ onComplete: () => setPhase('interface') })
      tl.from(blob1Ref.current, { x: -vw * 0.40, y: -vh * 0.30, scale: 0.15, opacity: 0, duration: 1.9, ease: 'power3.out' })
        .from(blob2Ref.current, { x: vw * 0.38, y: -vh * 0.28, scale: 0.15, opacity: 0, duration: 1.9, ease: 'power3.out' }, '-=1.70')
        .from(blob3Ref.current, { x: -vw * 0.02, y: vh * 0.42, scale: 0.15, opacity: 0, duration: 1.9, ease: 'power3.out' }, '-=1.65')
        .to(introTxtRef.current, { opacity: 1, duration: 0.5 }, '-=0.55')
        .to({}, { duration: 0.7 })
        .to([blob1Ref.current, blob2Ref.current, blob3Ref.current], { scale: 7, opacity: 0, duration: 0.85, ease: 'power3.in', stagger: 0.04 })
        .to(introTxtRef.current, { opacity: 0, duration: 0.25 }, '-=0.75')
        .to(gooeyWrapRef.current, { opacity: 0, duration: 0.25 }, '-=0.45')
        .to(uiRef.current, { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' }, '-=0.15')
    }, rootRef)
    return () => ctx.revert()
  }, [])

  // ── Simulate typing ───────────────────────────────────────────────────────
  const simulateText = useCallback((content: string, type?: MsgType, extra?: Partial<LocalMsg>) => {
    const newMsg: LocalMsg = { role: 'assistant', content: '', type, ...extra }
    setMessages(prev => [...prev, newMsg])
    let i = 0
    simRef.current = setInterval(() => {
      i += 9
      const slice = content.slice(0, i)
      setMessages(prev => {
        const upd = [...prev]
        upd[upd.length - 1] = { ...upd[upd.length - 1], content: slice }
        return upd
      })
      if (i >= content.length) {
        clearInterval(simRef.current!)
        simRef.current = null
        speak(content, guest.language, muted)
      }
    }, 18)
  }, [guest.language, muted])

  // ── Send message ──────────────────────────────────────────────────────────
  function send(text: string) {
    if (!text.trim() || thinking) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])

    const intent = detectIntent(text)

    if (intent === 'itinerary') {
      setShowItinerary(true)
      setNewBookingCount(0)
      simulateText('Aquí tienes todas tus reservas confirmadas.')
      return
    }

    if (intent === 'transport') {
      setThinkingMsg('Verificando disponibilidad de transporte')
      setThinking(true)
      thinkRef.current = setTimeout(() => {
        setThinking(false)
        const intro = 'Tenemos estas opciones de transporte disponibles desde tu hotel:'
        simulateText(intro, 'transport', { destination: 'Estadio Azteca' })
      }, 1400)
      return
    }

    if (intent === 'restaurant') {
      setThinkingMsg('Buscando las mejores mesas disponibles')
      setThinking(true)
      thinkRef.current = setTimeout(() => {
        setThinking(false)
        const intro = 'Estas son las mejores mesas que tenemos para esta noche:'
        simulateText(intro, 'restaurant')
      }, 1400)
      return
    }

    // Fallback
    setThinkingMsg('Un momento')
    setThinking(true)
    thinkRef.current = setTimeout(() => {
      setThinking(false)
      const response = FALLBACK_RESPONSES[fallbackIdx % FALLBACK_RESPONSES.length]
      fallbackIdx++
      simulateText(response)
    }, 900)
  }

  // ── Chips ─────────────────────────────────────────────────────────────────
  function sendChip(chip: typeof CHIPS[0]) {
    if (thinking) return
    send(chip.prompt)
  }

  // ── Voice input ───────────────────────────────────────────────────────────
  function toggleVoice() {
    const SR = (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      ?? (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) return

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const rec = new SR()
    rec.lang = guest.language === 'es' ? 'es-MX' : guest.language === 'en' ? 'en-US' : guest.language
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setListening(false)
      send(transcript)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

  // ── Restaurant ask party ──────────────────────────────────────────────────
  function handleAskParty(restaurant: Restaurant) {
    const msg = `¿Para cuántas personas y a qué hora deseas reservar en ${restaurant.name}?`
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: msg,
      type: 'restaurant',
      pendingRestaurant: restaurant,
    }])
    speak(msg, guest.language, muted)
  }

  function handleBooked(confirmMsg: string) {
    setMessages(prev => [...prev, { role: 'assistant', content: confirmMsg }])
    speak(confirmMsg, guest.language, muted)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000', fontFamily: '"Anton", sans-serif', overflow: 'hidden' }}>

      {/* SVG Gooey */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="cv-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="24" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 32 -14" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Ambient */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', borderRadius: '50%', width: 700, height: 700, left: '-12%', top: '-20%', background: 'radial-gradient(circle, rgba(200,255,0,0.035) 0%, transparent 68%)', animation: 'cv-drift1 22s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', borderRadius: '50%', width: 550, height: 550, right: '-10%', bottom: '5%', background: 'radial-gradient(circle, rgba(200,255,0,0.025) 0%, transparent 68%)', animation: 'cv-drift2 28s ease-in-out infinite' }} />
      </div>

      {/* Blobs intro */}
      <div ref={gooeyWrapRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'url(#cv-gooey)' }}>
          <div ref={blob1Ref} style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: '#C8FF00', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div ref={blob2Ref} style={{ position: 'absolute', width: 270, height: 270, borderRadius: '50%', background: '#C8FF00', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div ref={blob3Ref} style={{ position: 'absolute', width: 210, height: 210, borderRadius: '50%', background: '#C8FF00', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        </div>
      </div>

      <div ref={introTxtRef} style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(18px,2.4vw,28px)', letterSpacing: '0.45em', textTransform: 'uppercase', color: '#000', lineHeight: 1 }}>CONCIERGE</div>
          <div style={{ fontFamily: '"Condiment", cursive', fontSize: 'clamp(46px,6.5vw,76px)', color: '#000', lineHeight: 1, marginTop: -6, letterSpacing: '0.01em', alignSelf: 'flex-end', marginRight: '-8%', transform: 'rotate(-2deg)' }}>Digital</div>
          <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(7px,0.9vw,10px)', letterSpacing: '0.5em', textTransform: 'uppercase', color: '#000', opacity: 0.6, marginTop: 16 }}>FIFA 2026 · México</div>
        </div>
      </div>

      {/* Interface */}
      <div ref={uiRef} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#000', opacity: 0 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div onClick={onClose} style={{ display: 'flex', alignItems: 'baseline', gap: 10, cursor: 'pointer' }}>
            <span style={{ fontFamily: '"Anton", sans-serif', color: '#FFF', fontSize: 22, letterSpacing: '0.12em', textTransform: 'uppercase' }}>CONCIERGE</span>
            <span style={{ fontFamily: '"Condiment", cursive', fontSize: 22, color: '#C8FF00' }}>Digital</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: '"Anton", sans-serif' }}>FIFA 2026 · MX</span>
            {/* Mute toggle */}
            <button onClick={() => setMuted(m => !m)}
              style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: muted ? 'rgba(255,255,255,0.25)' : '#C8FF00', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            {/* Itinerary button */}
            <button onClick={() => { setShowItinerary(true); setNewBookingCount(0) }}
              style={{ position: 'relative', width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={13} />
              {newBookingCount > 0 && (
                <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: '#C8FF00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 8, color: '#000', fontFamily: '"Anton", sans-serif' }}>{newBookingCount}</span>
                </div>
              )}
            </button>
            <button onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={msgsRef} className="cv-msgs" style={{ flex: 1, overflowY: 'auto', padding: 'clamp(24px,4vw,48px) clamp(16px,5vw,48px) 16px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 860, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 14 }}>
              {m.role === 'assistant' && (
                <div style={{ flexShrink: 0, marginTop: 4, width: 24, height: 24, borderRadius: '50%', background: '#C8FF00', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(200,255,0,0.4)' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#000' }} />
                </div>
              )}
              <div style={{ flex: m.type === 'transport' || m.type === 'restaurant' ? 1 : undefined, minWidth: 0, maxWidth: m.role === 'user' ? '62%' : '90%' }}>
                {/* Text part */}
                <div style={{
                  ...(m.role === 'user' ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '18px 18px 3px 18px', padding: '11px 16px' } : { padding: '2px 0', marginBottom: (m.type === 'transport' || m.type === 'restaurant') && m.content ? 12 : 0 })
                }}>
                  <div style={{ color: m.role === 'user' ? '#FFF' : 'rgba(255,255,255,0.82)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.8, fontFamily: 'system-ui, sans-serif' }}
                    dangerouslySetInnerHTML={{ __html: renderMsg(m.content) }} />
                </div>
                {/* Transport cards */}
                {m.type === 'transport' && m.content.length === m.content.length && (
                  <TransportCards destination={m.destination ?? 'Estadio Azteca'} onBooked={handleBooked} />
                )}
                {/* Restaurant cards */}
                {m.type === 'restaurant' && !m.pendingRestaurant && (
                  <RestaurantCards onBooked={handleBooked} onAskParty={handleAskParty} />
                )}
              </div>
            </div>
          ))}

          {/* Thinking */}
          {thinking && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: '#C8FF00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#000' }} />
              </div>
              <div style={{ padding: '11px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px 18px 18px 3px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{thinkingMsg}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(j => <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: '#C8FF00', opacity: 0.7, animation: `cv-dot 1.2s ease-in-out ${j * 0.2}s infinite` }} />)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chips */}
        <div style={{ maxWidth: 860, width: '100%', margin: '0 auto', padding: '10px clamp(16px,5vw,48px) 0', boxSizing: 'border-box', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CHIPS.map(c => (
            <button key={c.label} onClick={() => sendChip(c)} disabled={thinking}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 100, padding: '7px 16px', color: thinking ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.45)', fontSize: 10, cursor: thinking ? 'default' : 'pointer', letterSpacing: '0.14em', textTransform: 'uppercase', transition: 'all 0.2s', fontFamily: '"Anton", sans-serif' }}
              onMouseEnter={e => { if (thinking) return; e.currentTarget.style.borderColor = '#C8FF00'; e.currentTarget.style.color = '#C8FF00' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = thinking ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.45)' }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(12px,2vw,20px) clamp(16px,5vw,48px) clamp(20px,3vw,32px)', maxWidth: 860, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '4px 4px 4px 18px' }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder={thinking ? 'Un momento...' : 'Escríbeme o usa el micrófono...'}
              disabled={thinking}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#EFF4FF', fontSize: 'clamp(13px,1.4vw,15px)', padding: '12px 0', fontFamily: 'system-ui, sans-serif' }} />
            {/* Mic button */}
            {'SpeechRecognition' in window || 'webkitSpeechRecognition' in window ? (
              <button onClick={toggleVoice}
                style={{ width: 40, height: 40, borderRadius: 12, border: 'none', flexShrink: 0, background: listening ? 'rgba(255,60,60,0.15)' : 'rgba(255,255,255,0.07)', color: listening ? '#FF4444' : 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: listening ? 'cv-pulse 1.2s ease infinite' : 'none' }}>
                {listening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
            ) : null}
            {/* Send button */}
            <button onClick={() => send(input)} disabled={!input.trim() || thinking}
              style={{ width: 42, height: 42, borderRadius: 13, border: 'none', flexShrink: 0, background: input.trim() && !thinking ? '#C8FF00' : 'rgba(255,255,255,0.07)', color: input.trim() && !thinking ? '#010828' : 'rgba(255,255,255,0.25)', cursor: input.trim() && !thinking ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, color: 'rgba(255,255,255,0.15)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: '"Anton", sans-serif' }}>
            CONCIERGE · FIFA 2026 · MÉXICO
          </div>
        </div>

        {/* Itinerary panel */}
        {showItinerary && (
          <ItineraryPanel onClose={() => setShowItinerary(false)} />
        )}
      </div>

      <style>{`
        @keyframes cv-drift1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,70px) scale(1.08)} 66%{transform:translate(-35px,30px) scale(0.95)} }
        @keyframes cv-drift2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-55px,-45px) scale(1.06)} 70%{transform:translate(30px,-20px) scale(0.97)} }
        @keyframes cv-pulse  { 0%,100%{opacity:1;box-shadow:0 0 10px rgba(255,60,60,0.4)} 50%{opacity:.6} }
        @keyframes cv-blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes cv-dot    { 0%,80%,100%{transform:scale(1);opacity:.7} 40%{transform:scale(1.5);opacity:1} }
        .cv-msgs::-webkit-scrollbar { display: none; }
        .cv-msgs { scrollbar-width: none; }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ConciergeView.tsx
git commit -m "feat: rewrite ConciergeView with personalization, voice, intent detection"
```

---

## Task 6: App.tsx — integrar GuestProvider + OnboardingFlow

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Reemplazar `src/App.tsx`**

```typescript
// src/App.tsx
import { useEffect, useState } from 'react'
import { GuestProvider, useGuest } from './context/GuestContext'
import HeroSection from './components/HeroSection'
import AboutSection from './components/AboutSection'
import CollectionSection from './components/CollectionSection'
import ConciergeChat from './components/ConciergeChat'
import ConciergeView from './components/ConciergeView'
import OnboardingFlow from './components/OnboardingFlow'

function AppInner() {
  const { guest } = useGuest()
  const [showConcierge, setShowConcierge] = useState(
    () => window.location.hash === '#concierge'
  )

  useEffect(() => {
    const onPop = () => setShowConcierge(window.location.hash === '#concierge')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function openConcierge() {
    history.pushState(null, '', '#concierge')
    setShowConcierge(true)
  }

  function closeConcierge() {
    history.pushState(null, '', window.location.pathname)
    setShowConcierge(false)
  }

  return (
    <div className="relative bg-black min-h-screen text-cream">
      <div
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ backgroundImage: 'url(/texture.png)', backgroundSize: '256px 256px', backgroundRepeat: 'repeat', mixBlendMode: 'lighten', opacity: 0.2 }}
      />
      <HeroSection />
      <AboutSection />
      <CollectionSection onActivate={openConcierge} />
      <ConciergeChat onOpen={openConcierge} hidden={showConcierge} />
      {showConcierge && !guest.onboardingDone && <OnboardingFlow />}
      {showConcierge && guest.onboardingDone && <ConciergeView onClose={closeConcierge} />}
    </div>
  )
}

export default function App() {
  return (
    <GuestProvider>
      <AppInner />
    </GuestProvider>
  )
}
```

- [ ] **Step 2: Verificar compilación final**

```bash
npm run build
```
Esperado: 0 errores.

- [ ] **Step 3: Eliminar archivos ya no usados**

```bash
# Estos archivos ya no son necesarios
git rm src/lib/openrouter.ts src/lib/concierge-prompt.ts
```

- [ ] **Step 4: Commit final**

```bash
git add src/App.tsx
git commit -m "feat: integrate GuestProvider and OnboardingFlow into App"
```

---

## Task 7: Smoke test manual en browser

- [ ] **Step 1: Iniciar servidor de desarrollo**

```bash
npm run dev
```

- [ ] **Step 2: Verificar flujo completo**

Abrir `http://localhost:5173` y verificar:
1. Landing carga correctamente (Hero, About, Collection)
2. Click en "ACTIVATE CONCIERGE" → aparece OnboardingFlow
3. Paso 1: idioma pre-seleccionado según browser, todos los 8 idiomas visibles
4. Paso 2: pills de título funcionan, campos de nombre activan CONTINUE
5. Paso 3: ciudades en cards, hoteles aparecen al seleccionar ciudad
6. Paso 4: chips de intereses multiselect, partidos con ADD/ADDED, "ENTRAR AL CONCIERGE" funciona
7. Chat muestra bienvenida personalizada con nombre y hotel del usuario
8. Chip "TRANSPORTE AL ESTADIO" muestra 3 cards de vehículos con botón RESERVAR
9. RESERVAR en un vehículo → mensaje de confirmación en chat + ícono Calendar en header tiene badge
10. Chip "RESERVAR CENA" muestra restaurantes de la ciudad seleccionada
11. RESERVAR MESA → pregunta por personas/hora → confirmación → badge en Calendar
12. Click en Calendar → abre ItineraryPanel con slide desde derecha con las reservas
13. Botón de micrófono visible; al presionar reconoce voz y envía el texto
14. Respuestas del concierge se leen en voz alta; botón de mute funciona
15. Refrescar página → onboarding no se repite, entra directo al chat (sessionStorage)

- [ ] **Step 3: Commit de verificación**

```bash
git add -A
git commit -m "feat: complete commercial concierge MVP - onboarding, transport, restaurants, voice, itinerary"
```

---

## Self-review

**Spec coverage:**
- ✅ GuestContext con todos los campos del spec
- ✅ 4 pasos de onboarding: idioma (8 opciones + autodetect), identidad, alojamiento en cascada, gustos+partidos
- ✅ Hoteles por ciudad: CDMX, Guadalajara, Monterrey
- ✅ Bienvenida personalizada con nombre, hotel, saludo por hora y trigger de partido
- ✅ Chips comerciales rediseñados
- ✅ Intent detection por keywords para transporte/restaurante/itinerario
- ✅ TransportCards: 3 niveles con RESERVAR → confirmación + addBooking
- ✅ RestaurantCards: hasta 5 por ciudad, filtradas por guest.city
- ✅ ItineraryPanel: slide-in GSAP, lista de bookings, estado vacío
- ✅ Voz bidireccional: SpeechRecognition + SpeechSynthesis con mute
- ✅ sessionStorage para no repetir onboarding
- ✅ Animación blob de entrada conservada
- ✅ Badge de nuevas reservas en botón Calendar
- ✅ Branding: CONCIERGE Digital (no Alma)
- ✅ Sin Gemini/openrouter — 100% mockeado

**Placeholder scan:** ninguno encontrado.

**Type consistency:** `Booking` definido en `GuestContext.tsx` e importado en `TransportCards` y `RestaurantCards`. `Restaurant` de `mock.ts` usado consistentemente en `RestaurantCards` y `ConciergeView`. `GuestProfile` usa `city: string` (no enum) para flexibilidad con los hoteles.
