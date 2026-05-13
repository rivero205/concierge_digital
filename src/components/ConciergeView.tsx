// src/components/ConciergeView.tsx

// ── SpeechRecognition type shims (not always present in DOM lib) ──────────────
interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { X, Mic, MicOff, VolumeX, Volume2, Calendar } from 'lucide-react'
import { useGuest } from '../context/GuestContext'
import TransportCards from './cards/TransportCards'
import RestaurantCards from './cards/RestaurantCards'
import ItineraryPanel from './ItineraryPanel'
import { MATCHES } from '../data/mock'

// ── Types ─────────────────────────────────────────────────────────────────────

type MsgType = 'text' | 'transport' | 'restaurant'

type LocalMsg = {
  role: 'user' | 'assistant'
  content: string
  type?: MsgType
  destination?: string
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

function buildWelcome(guest: { title: string; lastName: string; firstName: string; hotel: string; matches: string[] }): string {
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
  '¿Prefieres que te muestre opciones de transporte o de restaurantes para esta noche?',
]
let fallbackIdx = 0

// ── renderMsg ─────────────────────────────────────────────────────────────────

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
  utt.lang = lang === 'es' ? 'es-MX' : lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : lang
  utt.rate = 0.9
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v => v.lang.startsWith(utt.lang) && v.name.toLowerCase().includes('female'))
    ?? voices.find(v => v.lang.startsWith(utt.lang))
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
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  // Badge counter for new bookings
  useEffect(() => {
    if (guest.bookings.length > prevBookingsLen.current) {
      setNewBookingCount(c => c + (guest.bookings.length - prevBookingsLen.current))
    }
    prevBookingsLen.current = guest.bookings.length
  }, [guest.bookings.length])

  // Lock body scroll
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

  // Cleanup timers + TTS on unmount
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

  // Focus input when interface appears
  useEffect(() => {
    if (phase === 'interface') setTimeout(() => inputRef.current?.focus(), 200)
  }, [phase])

  // Set welcome message when interface phase starts
  useEffect(() => {
    if (phase === 'interface' && messages.length === 0) {
      const welcome = buildWelcome(guest)
      setMessages([{ role: 'assistant', content: welcome }])
      speak(welcome, guest.language, muted)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // GSAP blob intro animation
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

  // ── Simulate typing for assistant messages ────────────────────────────────
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
        simulateText('Tenemos estas opciones de transporte disponibles desde tu hotel:', 'transport', { destination: 'Estadio Azteca' })
      }, 1400)
      return
    }

    if (intent === 'restaurant') {
      setThinkingMsg('Buscando las mejores mesas disponibles')
      setThinking(true)
      thinkRef.current = setTimeout(() => {
        setThinking(false)
        simulateText('Estas son las mejores mesas que tenemos para esta noche:', 'restaurant')
      }, 1400)
      return
    }

    // Fallback
    setThinkingMsg('Un momento')
    setThinking(true)
    thinkRef.current = setTimeout(() => {
      setThinking(false)
      simulateText(FALLBACK_RESPONSES[fallbackIdx % FALLBACK_RESPONSES.length])
      fallbackIdx++
    }, 900)
  }

  // ── Chips ─────────────────────────────────────────────────────────────────
  function sendChip(chip: typeof CHIPS[0]) {
    if (thinking) return
    send(chip.prompt)
  }

  // ── Voice input ───────────────────────────────────────────────────────────
  function toggleVoice() {
    const SR: SpeechRecognitionConstructor | undefined = window.SpeechRecognition ?? window.webkitSpeechRecognition
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
    rec.onresult = (e: SpeechRecognitionEvent) => {
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

  // ── Booking confirmation handler ──────────────────────────────────────────
  function handleBooked(confirmMsg: string) {
    setMessages(prev => [...prev, { role: 'assistant', content: confirmMsg }])
    speak(confirmMsg, guest.language, muted)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const hasSpeechRecognition = typeof window !== 'undefined' &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition)

  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000', fontFamily: '"Anton", sans-serif', overflow: 'hidden' }}>

      {/* SVG Gooey filter */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="cv-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="24" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 32 -14" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Ambient drifts */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', borderRadius: '50%', width: 700, height: 700, left: '-12%', top: '-20%', background: 'radial-gradient(circle, rgba(200,255,0,0.035) 0%, transparent 68%)', animation: 'cv-drift1 22s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', borderRadius: '50%', width: 550, height: 550, right: '-10%', bottom: '5%', background: 'radial-gradient(circle, rgba(200,255,0,0.025) 0%, transparent 68%)', animation: 'cv-drift2 28s ease-in-out infinite' }} />
      </div>

      {/* Gooey blobs intro */}
      <div ref={gooeyWrapRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'url(#cv-gooey)' }}>
          <div ref={blob1Ref} style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: '#C8FF00', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div ref={blob2Ref} style={{ position: 'absolute', width: 270, height: 270, borderRadius: '50%', background: '#C8FF00', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div ref={blob3Ref} style={{ position: 'absolute', width: 210, height: 210, borderRadius: '50%', background: '#C8FF00', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        </div>
      </div>

      {/* Intro logo text */}
      <div ref={introTxtRef} style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(18px,2.4vw,28px)', letterSpacing: '0.45em', textTransform: 'uppercase', color: '#000', lineHeight: 1 }}>CONCIERGE</div>
          <div style={{ fontFamily: '"Condiment", cursive', fontSize: 'clamp(46px,6.5vw,76px)', color: '#000', lineHeight: 1, marginTop: -6, letterSpacing: '0.01em', alignSelf: 'flex-end', marginRight: '-8%', transform: 'rotate(-2deg)' }}>Digital</div>
          <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(7px,0.9vw,10px)', letterSpacing: '0.5em', textTransform: 'uppercase', color: '#000', opacity: 0.6, marginTop: 16 }}>FIFA 2026 · México</div>
        </div>
      </div>

      {/* Main interface */}
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
            {/* Itinerary button with badge */}
            <button onClick={() => { setShowItinerary(true); setNewBookingCount(0) }}
              style={{ position: 'relative', width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={13} />
              {newBookingCount > 0 && (
                <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: '#C8FF00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 8, color: '#000', fontFamily: '"Anton", sans-serif' }}>{newBookingCount}</span>
                </div>
              )}
            </button>
            {/* Close */}
            <button onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div ref={msgsRef} className="cv-msgs" style={{ flex: 1, overflowY: 'auto', padding: 'clamp(24px,4vw,48px) clamp(16px,5vw,48px) 16px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 860, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 14 }}>
              {m.role === 'assistant' && (
                <div style={{ flexShrink: 0, marginTop: 4, width: 24, height: 24, borderRadius: '50%', background: '#C8FF00', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(200,255,0,0.4)' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#000' }} />
                </div>
              )}
              <div style={{ flex: (m.type === 'transport' || m.type === 'restaurant') ? 1 : undefined, minWidth: 0, maxWidth: m.role === 'user' ? '62%' : '90%' }}>
                {/* Text content */}
                <div style={{
                  ...(m.role === 'user'
                    ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '18px 18px 3px 18px', padding: '11px 16px' }
                    : { padding: '2px 0', marginBottom: (m.type === 'transport' || m.type === 'restaurant') && m.content ? 12 : 0 })
                }}>
                  <div
                    style={{ color: m.role === 'user' ? '#FFF' : 'rgba(255,255,255,0.82)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.8, fontFamily: 'system-ui, sans-serif' }}
                    dangerouslySetInnerHTML={{ __html: renderMsg(m.content) }}
                  />
                </div>
                {/* Transport cards inline */}
                {m.type === 'transport' && (
                  <TransportCards destination={m.destination ?? 'Estadio Azteca'} onBooked={handleBooked} />
                )}
                {/* Restaurant cards inline */}
                {m.type === 'restaurant' && (
                  <RestaurantCards onBooked={handleBooked} />
                )}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
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

        {/* Quick action chips */}
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
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder={thinking ? 'Un momento...' : 'Escríbeme o usa el micrófono...'}
              disabled={thinking}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#EFF4FF', fontSize: 'clamp(13px,1.4vw,15px)', padding: '12px 0', fontFamily: 'system-ui, sans-serif' }}
            />
            {/* Mic button — only if browser supports it */}
            {hasSpeechRecognition && (
              <button onClick={toggleVoice}
                style={{ width: 40, height: 40, borderRadius: 12, border: 'none', flexShrink: 0, background: listening ? 'rgba(255,60,60,0.15)' : 'rgba(255,255,255,0.07)', color: listening ? '#FF4444' : 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: listening ? 'cv-pulse 1.2s ease infinite' : 'none' }}>
                {listening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
            )}
            {/* Send button */}
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || thinking}
              style={{ width: 42, height: 42, borderRadius: 13, border: 'none', flexShrink: 0, background: input.trim() && !thinking ? '#C8FF00' : 'rgba(255,255,255,0.07)', color: input.trim() && !thinking ? '#010828' : 'rgba(255,255,255,0.25)', cursor: input.trim() && !thinking ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"/>
                <polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, color: 'rgba(255,255,255,0.15)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: '"Anton", sans-serif' }}>
            CONCIERGE · FIFA 2026 · MÉXICO
          </div>
        </div>

        {/* Itinerary panel overlay */}
        {showItinerary && (
          <ItineraryPanel onClose={() => setShowItinerary(false)} />
        )}
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes cv-drift1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,70px) scale(1.08)} 66%{transform:translate(-35px,30px) scale(0.95)} }
        @keyframes cv-drift2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-55px,-45px) scale(1.06)} 70%{transform:translate(30px,-20px) scale(0.97)} }
        @keyframes cv-pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes cv-blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes cv-dot    { 0%,80%,100%{transform:scale(1);opacity:.7} 40%{transform:scale(1.5);opacity:1} }
        .cv-msgs::-webkit-scrollbar { display: none; }
        .cv-msgs { scrollbar-width: none; }
      `}</style>
    </div>
  )
}
