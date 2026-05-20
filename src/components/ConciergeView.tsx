// src/components/ConciergeView.tsx

// ── SpeechRecognition type shims ───────────────────────────────────────────────
interface SpeechRecognitionAlternative { readonly transcript: string; readonly confidence: number }
interface SpeechRecognitionResult { readonly length: number; item(index: number): SpeechRecognitionAlternative; [index: number]: SpeechRecognitionAlternative }
interface SpeechRecognitionResultList { readonly length: number; item(index: number): SpeechRecognitionResult; [index: number]: SpeechRecognitionResult }
interface SpeechRecognitionEvent extends Event { readonly resultIndex: number; readonly results: SpeechRecognitionResultList }
interface SpeechRecognitionErrorEvent extends Event { readonly error: string }
interface SpeechRecognitionInstance extends EventTarget {
  lang: string; interimResults: boolean; maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void; stop(): void
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance
declare global {
  interface Window { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
}

import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { Mic, MicOff, VolumeX, Volume2, Calendar } from 'lucide-react'
import { useGuest } from '../context/GuestContext'
import TransportCards from './cards/TransportCards'
import RestaurantCards from './cards/RestaurantCards'
import ItineraryPanel from './ItineraryPanel'

// ── Language detection ────────────────────────────────────────────────────────

type Lang = 'es' | 'en' | 'pt' | 'fr'

function detectLang(): Lang {
  const l = navigator.language?.slice(0, 2) ?? 'es'
  return (['es', 'en', 'pt', 'fr'] as Lang[]).includes(l as Lang) ? (l as Lang) : 'es'
}

// ── Types ─────────────────────────────────────────────────────────────────────

type MsgType = 'text' | 'transport' | 'restaurant'
type LocalMsg = { role: 'user' | 'assistant'; content: string; type?: MsgType; destination?: string }

// ── Multilingual content ──────────────────────────────────────────────────────

const ELEVENLABS_VOICE_ID = 'NOpBlnGInO9m6vDvFkFC'

// Short, punchy — played by ElevenLabs during the blob animation
const ELEVENLABS_INTRO: Record<Lang, string> = {
  es: 'Bienvenido a Concierge Digital. Tu asistente exclusivo para el Mundial FIFA 2026.',
  en: 'Welcome to Concierge Digital. Your exclusive assistant for the FIFA World Cup 2026.',
  pt: 'Bem-vindo ao Concierge Digital. Seu assistente exclusivo para a Copa do Mundo FIFA 2026.',
  fr: 'Bienvenue sur Concierge Digital. Votre assistant exclusif pour la Coupe du Monde FIFA 2026.',
}

function getGreeting(lang: Lang): string {
  const h = new Date().getHours()
  const g: Record<Lang, [string, string, string]> = {
    es: ['Buenos días', 'Buenas tardes', 'Buenas noches'],
    en: ['Good morning', 'Good afternoon', 'Good evening'],
    pt: ['Bom dia', 'Boa tarde', 'Boa noite'],
    fr: ['Bonjour', 'Bonsoir', 'Bonsoir'],
  }
  const [m, a, e] = g[lang]
  return h < 12 ? m : h < 19 ? a : e
}

// Chat welcome text (shown in messages, NOT spoken aloud — ElevenLabs handles intro voice)
const WELCOME_COPY: Record<Lang, (greeting: string) => string> = {
  es: g => `${g}. Soy tu concierge exclusivo para el **Mundial FIFA 2026**.\n\nPuedo reservarte transporte al estadio o una mesa en los mejores restaurantes.\n\n¿En qué puedo ayudarte? Escribe o presiona el micrófono.`,
  en: g => `${g}. I'm your exclusive concierge for the **FIFA World Cup 2026**.\n\nI can book stadium transport or restaurant reservations for you.\n\nHow can I help? Type or press the microphone.`,
  pt: g => `${g}. Sou seu concierge exclusivo para a **Copa do Mundo FIFA 2026**.\n\nPosso reservar transporte para o estádio ou mesa nos melhores restaurantes.\n\nComo posso ajudar? Digite ou pressione o microfone.`,
  fr: g => `${g}. Je suis votre concierge exclusif pour la **Coupe du Monde FIFA 2026**.\n\nJe peux réserver du transport vers le stade ou une table dans les meilleurs restaurants.\n\nComment puis-je vous aider ? Tapez ou appuyez sur le micro.`,
}

const CHIPS_BY_LANG: Record<Lang, { label: string; prompt: string }[]> = {
  es: [
    { label: 'TRANSPORTE AL ESTADIO', prompt: 'Necesito transporte al estadio' },
    { label: 'RESERVAR CENA', prompt: 'Quiero reservar cena esta noche' },
    { label: 'DRIVER PRIVADO', prompt: 'Quiero un driver privado' },
    { label: 'MIS RESERVAS', prompt: 'Ver mi itinerario' },
  ],
  en: [
    { label: 'STADIUM TRANSPORT', prompt: 'I need transport to the stadium' },
    { label: 'BOOK DINNER', prompt: 'I want to book dinner tonight' },
    { label: 'PRIVATE DRIVER', prompt: 'I want a private driver' },
    { label: 'MY BOOKINGS', prompt: 'Show my itinerary' },
  ],
  pt: [
    { label: 'TRANSPORTE AO ESTÁDIO', prompt: 'Preciso de transporte para o estádio' },
    { label: 'RESERVAR JANTAR', prompt: 'Quero reservar jantar esta noite' },
    { label: 'MOTORISTA PRIVADO', prompt: 'Quero um motorista privado' },
    { label: 'MINHAS RESERVAS', prompt: 'Ver meu itinerário' },
  ],
  fr: [
    { label: 'TRANSPORT AU STADE', prompt: "J'ai besoin de transport pour le stade" },
    { label: 'RÉSERVER UN DÎNER', prompt: 'Je veux réserver un dîner ce soir' },
    { label: 'CHAUFFEUR PRIVÉ', prompt: 'Je veux un chauffeur privé' },
    { label: 'MES RÉSERVATIONS', prompt: 'Voir mon itinéraire' },
  ],
}

const FALLBACK_BY_LANG: Record<Lang, string[]> = {
  es: [
    'Claro. ¿Puedo ayudarte con transporte al estadio o con una reserva en algún restaurante?',
    'Estoy aquí para gestionar tus traslados y reservas de mesa. ¿Qué necesitas?',
    '¿Prefieres que te muestre opciones de transporte o de restaurantes?',
  ],
  en: [
    'Sure. Can I help you with stadium transport or a restaurant reservation?',
    "I'm here to handle your transfers and table bookings. What do you need?",
    'Would you like to see transport options or restaurant choices?',
  ],
  pt: [
    'Claro. Posso ajudar com transporte ao estádio ou uma reserva em restaurante?',
    'Estou aqui para gerenciar seus traslados e reservas de mesa. O que você precisa?',
    'Prefere ver opções de transporte ou restaurantes?',
  ],
  fr: [
    'Bien sûr. Puis-je vous aider avec le transport vers le stade ou une réservation au restaurant ?',
    'Je suis là pour gérer vos transferts et réservations de table. De quoi avez-vous besoin ?',
    'Préférez-vous voir les options de transport ou de restaurants ?',
  ],
}

const THINKING_BY_LANG: Record<Lang, { transport: string; restaurant: string; fallback: string }> = {
  es: { transport: 'Verificando disponibilidad de transporte', restaurant: 'Buscando las mejores mesas disponibles', fallback: 'Un momento' },
  en: { transport: 'Checking transport availability', restaurant: 'Finding the best available tables', fallback: 'One moment' },
  pt: { transport: 'Verificando disponibilidade de transporte', restaurant: 'Procurando as melhores mesas disponíveis', fallback: 'Um momento' },
  fr: { transport: 'Vérification de la disponibilité du transport', restaurant: 'Recherche des meilleures tables disponibles', fallback: 'Un moment' },
}

const TRANSPORT_INTRO_BY_LANG: Record<Lang, string> = {
  es: 'Tenemos estas opciones de transporte disponibles:',
  en: 'Here are the available transport options:',
  pt: 'Aqui estão as opções de transporte disponíveis:',
  fr: 'Voici les options de transport disponibles :',
}

const RESTAURANT_INTRO_BY_LANG: Record<Lang, string> = {
  es: 'Estas son las mejores mesas que tenemos para esta noche:',
  en: 'Here are the best tables available for tonight:',
  pt: 'Aqui estão as melhores mesas disponíveis para esta noite:',
  fr: 'Voici les meilleures tables disponibles pour ce soir :',
}

const ITINERARY_REPLY_BY_LANG: Record<Lang, string> = {
  es: 'Aquí tienes todas tus reservas confirmadas.',
  en: 'Here are all your confirmed bookings.',
  pt: 'Aqui estão todas as suas reservas confirmadas.',
  fr: 'Voici toutes vos réservations confirmées.',
}

const PLACEHOLDER_BY_LANG: Record<Lang, { idle: string; thinking: string }> = {
  es: { idle: 'Escríbeme o usa el micrófono...', thinking: 'Un momento...' },
  en: { idle: 'Type or use the microphone...', thinking: 'One moment...' },
  pt: { idle: 'Digite ou use o microfone...', thinking: 'Um momento...' },
  fr: { idle: 'Tapez ou utilisez le micro...', thinking: 'Un moment...' },
}

// ── Intent detection ──────────────────────────────────────────────────────────

const TRANSPORT_KW = ['transporte', 'driver', 'estadio', 'transfer', 'auto', 'carro', 'van', 'uber', 'ride', 'llevar', 'traslado', 'transport', 'car', 'vehicle', 'stadium', 'chauffeur', 'taxi', 'motorista', 'estádio', 'coche', 'bus', 'shuttle', 'pickup']
const RESTAURANT_KW = ['cena', 'cenar', 'restaurante', 'comer', 'mesa', 'dinner', 'food', 'eat', 'reservar', 'restaurant', 'hambre', 'hungry', 'table', 'jantar', 'dîner', 'repas', 'manger', 'comida', 'almuerzo', 'lunch', 'brunch', 'reserva', 'booking', 'resto']
const ITINERARY_KW = ['itinerario', 'reservas', 'mis planes', 'agenda', 'bookings', 'reservaciones', 'schedule', 'itinerary', 'my bookings', 'minhas reservas', 'mes réservations', 'planes', 'ver reservas']

function detectIntent(text: string): 'transport' | 'restaurant' | 'itinerary' | 'fallback' {
  const low = text.toLowerCase()
  if (TRANSPORT_KW.some(k => low.includes(k))) return 'transport'
  if (RESTAURANT_KW.some(k => low.includes(k))) return 'restaurant'
  if (ITINERARY_KW.some(k => low.includes(k))) return 'itinerary'
  return 'fallback'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderMsg(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
}

const LOCALE: Record<Lang, string> = { es: 'es-MX', en: 'en-US', pt: 'pt-BR', fr: 'fr-FR' }

function speak(text: string, lang: Lang, muted: boolean) {
  if (muted || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const clean = text.replace(/\*\*/g, '').replace(/<[^>]+>/g, '')
  const utt = new SpeechSynthesisUtterance(clean)
  utt.lang = LOCALE[lang]
  utt.rate = 0.9
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v => v.lang.startsWith(utt.lang) && v.name.toLowerCase().includes('female'))
    ?? voices.find(v => v.lang.startsWith(utt.lang))
  if (preferred) utt.voice = preferred
  window.speechSynthesis.speak(utt)
}

// ── Component ─────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'interface'

export default function ConciergeView() {
  const { guest } = useGuest()
  const [lang] = useState<Lang>(() => detectLang())
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
  const fallbackIdx = useRef(0)

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
  // ElevenLabs intro — prefetched, played on first interaction if autoplay was blocked
  const introAudioRef = useRef<HTMLAudioElement | null>(null)
  const introPlayedRef = useRef(false)

  // Prefetch ElevenLabs intro audio immediately on mount
  useEffect(() => {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
    if (!apiKey) return

    let blobUrl: string | null = null

    fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: ELEVENLABS_INTRO[lang],
        model_id: 'eleven_v3',
        language_code: lang,
      }),
    })
      .then(res => res.ok ? res.blob() : null)
      .then(blob => {
        if (!blob) return
        blobUrl = URL.createObjectURL(blob)
        const audio = new Audio(blobUrl)
        audio.onended = () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
        introAudioRef.current = audio
        // Try autoplay immediately (works on desktop; blocked silently on mobile)
        audio.play()
          .then(() => { introPlayedRef.current = true })
          .catch(() => { /* will retry on first user interaction */ })
      })
      .catch(() => {})

    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Play ElevenLabs intro on first user interaction if autoplay was blocked
  function playIntroIfPending() {
    const audio = introAudioRef.current
    if (!audio || introPlayedRef.current) return
    introPlayedRef.current = true
    if (audio.paused) audio.play().catch(() => {})
  }

  useEffect(() => {
    if (guest.bookings.length > prevBookingsLen.current) {
      setNewBookingCount(c => c + (guest.bookings.length - prevBookingsLen.current))
    }
    prevBookingsLen.current = guest.bookings.length
  }, [guest.bookings.length])

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

  useEffect(() => () => {
    if (thinkRef.current) clearTimeout(thinkRef.current)
    if (simRef.current) clearInterval(simRef.current)
    window.speechSynthesis?.cancel()
  }, [])

  useEffect(() => {
    const el = msgsRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, thinking])

  useEffect(() => {
    if (phase === 'interface') setTimeout(() => inputRef.current?.focus(), 200)
  }, [phase])

  // Show welcome in chat — NO speak() here, ElevenLabs already handles the voice
  useEffect(() => {
    if (phase === 'interface' && messages.length === 0) {
      const welcome = WELCOME_COPY[lang](getGreeting(lang))
      setMessages([{ role: 'assistant', content: welcome }])
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // GSAP blob intro animation (starts immediately on mount)
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

  const simulateText = useCallback((content: string, type?: MsgType, extra?: Partial<LocalMsg>) => {
    setMessages(prev => [...prev, { role: 'assistant', content: '', type, ...extra }])
    let i = 0
    simRef.current = setInterval(() => {
      i += 9
      setMessages(prev => {
        const upd = [...prev]
        upd[upd.length - 1] = { ...upd[upd.length - 1], content: content.slice(0, i) }
        return upd
      })
      if (i >= content.length) {
        clearInterval(simRef.current!)
        simRef.current = null
        speak(content, lang, muted)
      }
    }, 18)
  }, [lang, muted])

  function send(text: string) {
    if (!text.trim() || thinking) return
    playIntroIfPending()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    const intent = detectIntent(text)
    const t = THINKING_BY_LANG[lang]

    if (intent === 'itinerary') {
      setShowItinerary(true); setNewBookingCount(0)
      simulateText(ITINERARY_REPLY_BY_LANG[lang])
      return
    }
    if (intent === 'transport') {
      setThinkingMsg(t.transport); setThinking(true)
      thinkRef.current = setTimeout(() => {
        setThinking(false)
        simulateText(TRANSPORT_INTRO_BY_LANG[lang], 'transport', { destination: 'Estadio Azteca' })
      }, 1400)
      return
    }
    if (intent === 'restaurant') {
      setThinkingMsg(t.restaurant); setThinking(true)
      thinkRef.current = setTimeout(() => {
        setThinking(false)
        simulateText(RESTAURANT_INTRO_BY_LANG[lang], 'restaurant')
      }, 1400)
      return
    }
    setThinkingMsg(t.fallback); setThinking(true)
    thinkRef.current = setTimeout(() => {
      setThinking(false)
      const responses = FALLBACK_BY_LANG[lang]
      simulateText(responses[fallbackIdx.current % responses.length])
      fallbackIdx.current++
    }, 900)
  }

  function toggleVoice() {
    playIntroIfPending()
    const SR: SpeechRecognitionConstructor | undefined = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const rec = new SR()
    rec.lang = LOCALE[lang]; rec.interimResults = false; rec.maxAlternatives = 1
    rec.onresult = (e: SpeechRecognitionEvent) => { setListening(false); send(e.results[0][0].transcript) }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recognitionRef.current = rec; rec.start(); setListening(true)
  }

  function handleBooked(confirmMsg: string) {
    setMessages(prev => [...prev, { role: 'assistant', content: confirmMsg }])
    speak(confirmMsg, lang, muted)
  }

  const hasSpeechRecognition = typeof window !== 'undefined' && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition)
  const chips = CHIPS_BY_LANG[lang]
  const placeholder = PLACEHOLDER_BY_LANG[lang]

  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000', fontFamily: '"Anton", sans-serif', overflow: 'hidden' }}>

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

      {/* Gooey blobs */}
      <div ref={gooeyWrapRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'url(#cv-gooey)' }}>
          <div ref={blob1Ref} style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: '#C8FF00', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div ref={blob2Ref} style={{ position: 'absolute', width: 270, height: 270, borderRadius: '50%', background: '#C8FF00', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div ref={blob3Ref} style={{ position: 'absolute', width: 210, height: 210, borderRadius: '50%', background: '#C8FF00', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        </div>
      </div>

      {/* Intro logo */}
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
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontFamily: '"Anton", sans-serif', color: '#FFF', fontSize: 22, letterSpacing: '0.12em', textTransform: 'uppercase' }}>CONCIERGE</span>
            <span style={{ fontFamily: '"Condiment", cursive', fontSize: 22, color: '#C8FF00' }}>Digital</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: '"Anton", sans-serif' }}>FIFA 2026 · MX</span>
            <button onClick={() => setMuted(m => !m)}
              style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: muted ? 'rgba(255,255,255,0.25)' : '#C8FF00', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <button onClick={() => { setShowItinerary(true); setNewBookingCount(0) }}
              style={{ position: 'relative', width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={13} />
              {newBookingCount > 0 && (
                <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: '#C8FF00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 8, color: '#000', fontFamily: '"Anton", sans-serif' }}>{newBookingCount}</span>
                </div>
              )}
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
              <div style={{ flex: (m.type === 'transport' || m.type === 'restaurant') ? 1 : undefined, minWidth: 0, maxWidth: m.role === 'user' ? '62%' : '90%' }}>
                <div style={m.role === 'user'
                  ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '18px 18px 3px 18px', padding: '11px 16px' }
                  : { padding: '2px 0', marginBottom: (m.type === 'transport' || m.type === 'restaurant') && m.content ? 12 : 0 }}>
                  <div style={{ color: m.role === 'user' ? '#FFF' : 'rgba(255,255,255,0.82)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.8, fontFamily: 'system-ui, sans-serif' }}
                    dangerouslySetInnerHTML={{ __html: renderMsg(m.content) }} />
                </div>
                {m.type === 'transport' && <TransportCards destination={m.destination ?? 'Estadio Azteca'} onBooked={handleBooked} />}
                {m.type === 'restaurant' && <RestaurantCards onBooked={handleBooked} />}
              </div>
            </div>
          ))}

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
          {chips.map(c => (
            <button key={c.label} onClick={() => !thinking && send(c.prompt)} disabled={thinking}
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
              placeholder={thinking ? placeholder.thinking : placeholder.idle} disabled={thinking}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#EFF4FF', fontSize: 'clamp(13px,1.4vw,15px)', padding: '12px 0', fontFamily: 'system-ui, sans-serif' }} />
            {hasSpeechRecognition && (
              <button onClick={toggleVoice} style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                border: listening ? '2px solid #FF4444' : '2px solid #C8FF00',
                background: listening ? 'rgba(255,60,60,0.15)' : 'rgba(200,255,0,0.08)',
                color: listening ? '#FF4444' : '#C8FF00', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: listening ? '0 0 18px rgba(255,68,68,0.4)' : '0 0 14px rgba(200,255,0,0.25)',
                animation: listening ? 'cv-pulse 1.2s ease infinite' : 'none', transition: 'all 0.2s',
              }}>
                {listening ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
            )}
            <button onClick={() => send(input)} disabled={!input.trim() || thinking}
              style={{ width: 42, height: 42, borderRadius: 13, border: 'none', flexShrink: 0, background: input.trim() && !thinking ? '#C8FF00' : 'rgba(255,255,255,0.07)', color: input.trim() && !thinking ? '#010828' : 'rgba(255,255,255,0.25)', cursor: input.trim() && !thinking ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, color: 'rgba(255,255,255,0.15)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: '"Anton", sans-serif' }}>
            CONCIERGE · FIFA 2026 · MÉXICO
          </div>
        </div>

        {showItinerary && <ItineraryPanel onClose={() => setShowItinerary(false)} />}
      </div>

      <style>{`
        @keyframes cv-drift1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,70px) scale(1.08)} 66%{transform:translate(-35px,30px) scale(0.95)} }
        @keyframes cv-drift2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-55px,-45px) scale(1.06)} 70%{transform:translate(30px,-20px) scale(0.97)} }
        @keyframes cv-pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes cv-dot    { 0%,80%,100%{transform:scale(1);opacity:.7} 40%{transform:scale(1.5);opacity:1} }
        .cv-msgs::-webkit-scrollbar { display: none; }
        .cv-msgs { scrollbar-width: none; }
      `}</style>
    </div>
  )
}
