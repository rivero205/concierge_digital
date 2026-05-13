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
