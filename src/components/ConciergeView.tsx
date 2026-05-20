// src/components/ConciergeView.tsx

// ── SpeechRecognition type shims ───────────────────────────────────────────────
interface SpeechRecognitionAlternative { readonly transcript: string; readonly confidence: number }
interface SpeechRecognitionResult { readonly length: number; readonly isFinal: boolean; item(index: number): SpeechRecognitionAlternative; [index: number]: SpeechRecognitionAlternative }
interface SpeechRecognitionResultList { readonly length: number; item(index: number): SpeechRecognitionResult; [index: number]: SpeechRecognitionResult }
interface SpeechRecognitionEvent extends Event { readonly resultIndex: number; readonly results: SpeechRecognitionResultList }
interface SpeechRecognitionErrorEvent extends Event { readonly error: string }
interface SpeechRecognitionInstance extends EventTarget {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean
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
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { useGuest } from '../context/GuestContext'
import TransportCards from './cards/TransportCards'
import RestaurantCards from './cards/RestaurantCards'
import DriverCards from './cards/DriverCards'
import ItineraryPanel from './ItineraryPanel'

// ── Language detection ────────────────────────────────────────────────────────

type Lang = 'es' | 'en' | 'pt' | 'fr'

function detectLang(): Lang {
  const l = navigator.language?.slice(0, 2) ?? 'es'
  return (['es', 'en', 'pt', 'fr'] as Lang[]).includes(l as Lang) ? (l as Lang) : 'es'
}

// ── Types ─────────────────────────────────────────────────────────────────────

type MsgType = 'text' | 'transport' | 'restaurant' | 'driver'
type MsgAction = { label: string; value: 'yes' | 'no' }
type LocalMsg = {
  role: 'user' | 'assistant'
  content: string
  type?: MsgType
  destination?: string
  actions?: MsgAction[]
  actionTarget?: MsgType
}

// ── Multilingual content ──────────────────────────────────────────────────────

// George (JBFqnCBsd6RMkjVDRZzb) — premade voice available on all plans including free
const ELEVENLABS_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'

// eleven_v3: action markers ([laughs], [whispers]) + natural rhythm outperform state markers ([excited])
const ELEVENLABS_INTRO: Record<Lang, string> = {
  es: '¡Bienvenido a Concierge Digital! [clears throat] Soy tu asistente exclusivo para el Mundial FIFA 2026. ¿Transporte al estadio? ¿La mejor mesa de la ciudad? [laughs softly] Con gusto. Estoy aquí para todo.',
  en: 'Welcome to Concierge Digital! [clears throat] I am your exclusive assistant for the FIFA World Cup 2026. Stadium transport? The best table in town? [laughs softly] Consider it done. I am here for everything.',
  pt: 'Bem-vindo ao Concierge Digital! [clears throat] Sou seu assistente exclusivo para a Copa do Mundo FIFA 2026. Transporte ao estádio? A melhor mesa da cidade? [laughs softly] Com prazer. Estou aqui para tudo.',
  fr: 'Bienvenue sur Concierge Digital ! [clears throat] Je suis votre assistant exclusif pour la Coupe du Monde FIFA 2026. Transport vers le stade ? La meilleure table de la ville ? [laughs softly] Avec plaisir. Je suis là pour tout.',
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
  es: g => `${g}. Soy tu concierge exclusivo para el **Mundial FIFA 2026**.\n\n🔥 **847 reservas** gestionadas esta semana · ★ 4.9 promedio\n\nPuedo reservarte transporte al estadio o una mesa en los mejores restaurantes.\n\n¿En qué puedo ayudarte? Escribe o presiona el micrófono.`,
  en: g => `${g}. I'm your exclusive concierge for the **FIFA World Cup 2026**.\n\n🔥 **847 bookings** managed this week · ★ 4.9 average\n\nI can book stadium transport or restaurant reservations for you.\n\nHow can I help? Type or press the microphone.`,
  pt: g => `${g}. Sou seu concierge exclusivo para a **Copa do Mundo FIFA 2026**.\n\n🔥 **847 reservas** gerenciadas esta semana · ★ 4.9 média\n\nPosso reservar transporte para o estádio ou mesa nos melhores restaurantes.\n\nComo posso ajudar? Digite ou pressione o microfone.`,
  fr: g => `${g}. Je suis votre concierge exclusif pour la **Coupe du Monde FIFA 2026**.\n\n🔥 **847 réservations** gérées cette semaine · ★ 4.9 moyenne\n\nJe peux réserver du transport vers le stade ou une table dans les meilleurs restaurants.\n\nComment puis-je vous aider ? Tapez ou appuyez sur le micro.`,
}

const CHIPS_BY_LANG: Record<Lang, { label: string; prompt: string }[]> = {
  es: [
    { label: 'TRANSPORTE AL ESTADIO', prompt: 'Necesito transporte al estadio' },
    { label: 'RESERVAR CENA', prompt: 'Quiero reservar cena esta noche' },
    { label: 'DRIVER PRIVADO', prompt: 'Quiero un driver privado' },
  ],
  en: [
    { label: 'STADIUM TRANSPORT', prompt: 'I need transport to the stadium' },
    { label: 'BOOK DINNER', prompt: 'I want to book dinner tonight' },
    { label: 'PRIVATE DRIVER', prompt: 'I want a private driver' },
  ],
  pt: [
    { label: 'TRANSPORTE AO ESTÁDIO', prompt: 'Preciso de transporte para o estádio' },
    { label: 'RESERVAR JANTAR', prompt: 'Quero reservar jantar esta noite' },
    { label: 'MOTORISTA PRIVADO', prompt: 'Quero um motorista privado' },
  ],
  fr: [
    { label: 'TRANSPORT AU STADE', prompt: "J'ai besoin de transport pour le stade" },
    { label: 'RÉSERVER UN DÎNER', prompt: 'Je veux réserver un dîner ce soir' },
    { label: 'CHAUFFEUR PRIVÉ', prompt: 'Je veux un chauffeur privé' },
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

const DRIVER_INTRO_BY_LANG: Record<Lang, string> = {
  es: 'Tengo paquetes de chofer privado desde **$120 USD**. Sin restricciones de horario — el auto es tuyo:',
  en: 'I have private driver packages starting from **$120 USD**. No time limits — the car is yours:',
  pt: 'Tenho pacotes de motorista privado a partir de **$120 USD**. Sem restrições de horário:',
  fr: 'J\'ai des forfaits chauffeur privé à partir de **$120 USD**. Sans restriction d\'horaire :',
}

const TRANSPORT_INTRO_BY_LANG: Record<Lang, string> = {
  es: 'Tengo opciones desde **$45 USD** por trayecto. Elige la que mejor se adapte a tu grupo:',
  en: 'I have options starting from **$45 USD** per trip. Choose what fits your group best:',
  pt: 'Tenho opções a partir de **$45 USD** por trajeto. Escolha a que melhor se adapta ao seu grupo:',
  fr: 'J\'ai des options à partir de **$45 USD** par trajet. Choisissez ce qui convient le mieux à votre groupe :',
}

const RESTAURANT_INTRO_BY_LANG: Record<Lang, string> = {
  es: 'Tengo mesas disponibles esta noche en los mejores restaurantes de la ciudad. Elige el que más te llame:',
  en: 'I have tables available tonight at the best restaurants in the city. Pick the one that calls to you:',
  pt: 'Tenho mesas disponíveis esta noite nos melhores restaurantes da cidade. Escolha o que mais te agrada:',
  fr: 'J\'ai des tables disponibles ce soir dans les meilleurs restaurants de la ville. Choisissez celui qui vous attire :',
}

const ITINERARY_REPLY_BY_LANG: Record<Lang, string> = {
  es: 'Aquí tienes todas tus reservas confirmadas.',
  en: 'Here are all your confirmed bookings.',
  pt: 'Aqui estão todas as suas reservas confirmadas.',
  fr: 'Voici toutes vos réservations confirmées.',
}

// Shown after a booking is confirmed — suggests the complementary service (with Yes/No buttons)
const UPSELL_BY_LANG: Record<Lang, { transport: string; restaurant: string }> = {
  es: {
    transport: '¿También te reservo mesa para antes del partido? Tengo las mejores mesas disponibles esta noche.',
    restaurant: '¿Necesitas transporte al estadio después de la cena? Te lo gestiono ahora mismo.',
  },
  en: {
    transport: 'Want me to book a table before the match? I have the best options available tonight.',
    restaurant: 'Need transport to the stadium after dinner? I can arrange it right now.',
  },
  pt: {
    transport: 'Quer que eu reserve uma mesa antes do jogo? Tenho as melhores opções disponíveis esta noite.',
    restaurant: 'Precisa de transporte ao estádio depois do jantar? Posso organizar agora mesmo.',
  },
  fr: {
    transport: 'Voulez-vous que je réserve une table avant le match ? J\'ai les meilleures options disponibles ce soir.',
    restaurant: 'Besoin de transport vers le stade après le dîner ? Je peux organiser ça maintenant.',
  },
}

const YES_LABEL: Record<Lang, string> = {
  es: 'Sí, por favor',
  en: 'Yes, please',
  pt: 'Sim, por favor',
  fr: 'Oui, s\'il vous plaît',
}
const NO_LABEL: Record<Lang, string> = {
  es: 'No, gracias',
  en: 'No, thanks',
  pt: 'Não, obrigado',
  fr: 'Non, merci',
}
const DECLINE_BY_LANG: Record<Lang, string> = {
  es: 'Entendido. Aquí estoy cuando lo necesites.',
  en: 'Got it. I\'m here whenever you need me.',
  pt: 'Entendido. Estou aqui quando precisar.',
  fr: 'Compris. Je suis là quand vous en aurez besoin.',
}

const PLACEHOLDER_BY_LANG: Record<Lang, { idle: string; thinking: string }> = {
  es: { idle: 'Escríbeme o usa el micrófono...', thinking: 'Un momento...' },
  en: { idle: 'Type or use the microphone...', thinking: 'One moment...' },
  pt: { idle: 'Digite ou use o microfone...', thinking: 'Um momento...' },
  fr: { idle: 'Tapez ou utilisez le micro...', thinking: 'Un moment...' },
}

// ── Intent detection ──────────────────────────────────────────────────────────

const DRIVER_KW = ['privado', 'por horas', 'half day', 'full day', 'día completo', 'medio día', 'private driver', 'chofer por', 'chofer para', 'chofer privado', 'chauffeur privé', 'motorista privado']
const TRANSPORT_KW = ['transporte', 'driver', 'estadio', 'transfer', 'auto', 'carro', 'van', 'uber', 'ride', 'llevar', 'traslado', 'transport', 'car', 'vehicle', 'stadium', 'chauffeur', 'taxi', 'motorista', 'estádio', 'coche', 'bus', 'shuttle', 'pickup']
const RESTAURANT_KW = ['cena', 'cenar', 'restaurante', 'comer', 'mesa', 'dinner', 'food', 'eat', 'reservar', 'restaurant', 'hambre', 'hungry', 'table', 'jantar', 'dîner', 'repas', 'manger', 'comida', 'almuerzo', 'lunch', 'brunch', 'reserva', 'booking', 'resto']
const ITINERARY_KW = ['itinerario', 'reservas', 'mis planes', 'agenda', 'bookings', 'reservaciones', 'schedule', 'itinerary', 'my bookings', 'minhas reservas', 'mes réservations', 'planes', 'ver reservas']

function detectIntent(text: string): 'transport' | 'restaurant' | 'itinerary' | 'driver' | 'fallback' {
  const low = text.toLowerCase()
  if (DRIVER_KW.some(k => low.includes(k))) return 'driver'
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
  const voices = window.speechSynthesis.getVoices()
  const locale = LOCALE[lang]
  const lc = locale.slice(0, 2)
  // Natural = Edge/Windows neural voices (sound human). Only speak if a premium voice exists.
  const premium =
    voices.find(v => v.lang === locale && v.name.includes('Natural')) ??
    voices.find(v => v.lang.startsWith(lc) && v.name.includes('Natural')) ??
    voices.find(v => v.lang === locale && v.name.startsWith('Microsoft')) ??
    voices.find(v => v.lang.startsWith(lc) && v.name.startsWith('Microsoft')) ??
    voices.find(v => v.lang === locale && v.name.startsWith('Google')) ??
    voices.find(v => v.lang.startsWith(lc) && v.name.startsWith('Google'))
  if (!premium) return // skip — robotic fallback voices are worse than silence
  const clean = text.replace(/\*\*/g, '').replace(/<[^>]+>/g, '').replace(/\n/g, ' ')
  const utt = new SpeechSynthesisUtterance(clean)
  utt.voice = premium
  utt.lang = premium.lang
  utt.rate = 0.88
  utt.pitch = 1.05
  window.speechSynthesis.speak(utt)
}

// ── Component ─────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'interface'

export default function ConciergeView() {
  const { guest } = useGuest()
  const [lang, setLang] = useState<Lang>(() => detectLang())
  const [langOpen, setLangOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('intro')
  const [messages, setMessages] = useState<LocalMsg[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [thinkingMsg, setThinkingMsg] = useState('')
  const [showItinerary, setShowItinerary] = useState(false)
  const [muted, setMuted] = useState(false)
  const [listening, setListening] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const prevBookingsLen = useRef(guest.bookings.length)
  const fallbackIdx = useRef(0)
  const upsellShownRef = useRef<Set<'transport' | 'restaurant'>>(new Set())
  const gsapCtxRef = useRef<ReturnType<typeof gsap.context> | null>(null)

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
  const pendingVoiceRef = useRef<string | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const micCtxRef = useRef<AudioContext | null>(null)
  const micAnalyserRef = useRef<AnalyserNode | null>(null)
  const micRafRef = useRef<number | null>(null)
  // ElevenLabs intro — prefetched, played on first interaction if autoplay was blocked
  const introAudioRef = useRef<HTMLAudioElement | null>(null)
  const introPlayedRef = useRef(false)
  const lastMsgRef = useRef<HTMLDivElement>(null)
  const msgCountRef = useRef(0)

  // Prefetch ElevenLabs intro audio immediately on mount using the official SDK
  useEffect(() => {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
    if (!apiKey) return

    let blobUrl: string | null = null
    let cancelled = false
    const elevenlabs = new ElevenLabsClient({ apiKey })

    elevenlabs.textToSpeech.convert(ELEVENLABS_VOICE_ID, {
      text: ELEVENLABS_INTRO[lang],
      modelId: 'eleven_v3',
      outputFormat: 'mp3_44100_128',
      voiceSettings: { stability: 0.1, similarityBoost: 0.9, style: 1.0, useSpeakerBoost: true, speed: 1.1 },
    })
      .then(async stream => {
        if (cancelled) return
        const blob = await new Response(stream as unknown as ReadableStream).blob()
        if (cancelled) return
        blobUrl = URL.createObjectURL(blob)
        const audio = new Audio(blobUrl)
        audio.onended = () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
        introAudioRef.current = audio
        audio.play()
          .then(() => { introPlayedRef.current = true })
          .catch(() => { /* will retry on first user interaction */ })
      })
      .catch(() => {})

    return () => {
      cancelled = true
      introAudioRef.current?.pause()
      introAudioRef.current = null
      introPlayedRef.current = false
      if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Play ElevenLabs intro on first user interaction if autoplay was blocked
  function playIntroIfPending() {
    const audio = introAudioRef.current
    if (!audio || introPlayedRef.current) return
    introPlayedRef.current = true
    if (audio.paused) audio.play().catch(() => {})
  }

  useEffect(() => {
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
    if (micRafRef.current) cancelAnimationFrame(micRafRef.current)
    micStreamRef.current?.getTracks().forEach(t => t.stop())
    micCtxRef.current?.close()
  }, [])

  useEffect(() => {
    const el = msgsRef.current
    if (!el) return
    const prev = msgCountRef.current
    msgCountRef.current = messages.length
    const last = messages[messages.length - 1]
    const isCard = last?.type === 'transport' || last?.type === 'restaurant' || last?.type === 'driver'
    const isNew = messages.length > prev
    if (isNew && isCard) {
      setTimeout(() => {
        const container = msgsRef.current
        const msg = lastMsgRef.current
        if (!container || !msg) return
        const offset = msg.getBoundingClientRect().top - container.getBoundingClientRect().top
        container.scrollTop += offset - 24
      }, 80)
    } else if (!isCard) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, thinking])

  useEffect(() => {
    if (thinking || !pendingVoiceRef.current) return
    const transcript = pendingVoiceRef.current
    pendingVoiceRef.current = null
    setTimeout(() => send(transcript), 0)
  }, [thinking])

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
    gsapCtxRef.current = ctx
    return () => { ctx.revert(); gsapCtxRef.current = null }
  }, [])

  function skipIntro() {
    gsapCtxRef.current?.revert()
    gsapCtxRef.current = null
    gsap.set([gooeyWrapRef.current, introTxtRef.current], { opacity: 0 })
    gsap.set(uiRef.current, { opacity: 1, y: 0 })
    setPhase('interface')
  }

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
      setShowItinerary(true)
      simulateText(ITINERARY_REPLY_BY_LANG[lang])
      return
    }
    if (intent === 'driver') {
      setThinkingMsg(t.transport); setThinking(true)
      thinkRef.current = setTimeout(() => {
        setThinking(false)
        simulateText(DRIVER_INTRO_BY_LANG[lang], 'driver')
      }, 1400)
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

  function changeLang(l: Lang) {
    setLang(l)
    setLangOpen(false)
    setMessages([{ role: 'assistant', content: WELCOME_COPY[l](getGreeting(l)) }])
    upsellShownRef.current = new Set()
    fallbackIdx.current = 0
    setThinking(false)
    if (thinkRef.current) { clearTimeout(thinkRef.current); thinkRef.current = null }
    if (simRef.current) { clearInterval(simRef.current); simRef.current = null }
  }

  function toggleVoice() {
    playIntroIfPending()
    const SR: SpeechRecognitionConstructor | undefined = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return
    if (listening) {
      recognitionRef.current?.stop()
      return // onend se encarga de setListening(false)
    }
    const rec = new SR()
    rec.lang = LOCALE[lang]
    rec.continuous = false
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const result = e.results[i]
        const text = result[0].transcript
        if (result.isFinal) final += `${text} `
        else interim += `${text} `
      }
      const transcript = (final || interim).trim()
      if (!transcript) return
      setInput(transcript)
      if (!final.trim()) return
      if (thinking) pendingVoiceRef.current = transcript
      else setTimeout(() => send(transcript), 250)
    }
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setListening(false)
      stopMicMeter()
      if (e.error === 'not-allowed') alert('Permiso de micrófono denegado. Habilítalo en Configuración del navegador.')
    }
    rec.onend = () => { setListening(false); stopMicMeter() }
    recognitionRef.current = rec
    rec.start()
    setListening(true)
    startMicMeter()
  }

  function startMicMeter() {
    if (micCtxRef.current || micStreamRef.current) return
    navigator.mediaDevices?.getUserMedia({ audio: true }).then(stream => {
      micStreamRef.current = stream
      const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      micCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      micAnalyserRef.current = analyser
      source.connect(analyser)
      const data = new Uint8Array(analyser.fftSize)
      const tick = () => {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.min(1, Math.sqrt(sum / data.length) * 2.2)
        setMicLevel(rms)
        micRafRef.current = requestAnimationFrame(tick)
      }
      tick()
    }).catch(() => {
      setMicLevel(0)
    })
  }

  function stopMicMeter() {
    if (micRafRef.current) { cancelAnimationFrame(micRafRef.current); micRafRef.current = null }
    micStreamRef.current?.getTracks().forEach(t => t.stop())
    micStreamRef.current = null
    micAnalyserRef.current = null
    micCtxRef.current?.close()
    micCtxRef.current = null
    setMicLevel(0)
  }

  function handleBooked(confirmMsg: string, bookedType: 'transport' | 'restaurant') {
    setMessages(prev => [...prev, { role: 'assistant', content: confirmMsg }])
    speak(confirmMsg, lang, muted)

    const upsellTarget: MsgType = bookedType === 'transport' ? 'restaurant' : 'transport'
    if (!upsellShownRef.current.has(upsellTarget as 'transport' | 'restaurant')) {
      upsellShownRef.current.add(upsellTarget as 'transport' | 'restaurant')
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: UPSELL_BY_LANG[lang][bookedType],
          actions: [
            { label: YES_LABEL[lang], value: 'yes' },
            { label: NO_LABEL[lang], value: 'no' },
          ],
          actionTarget: upsellTarget,
        }])
      }, 2000)
    }
  }

  function handleUpsellAction(value: 'yes' | 'no', msgIndex: number, target?: MsgType) {
    setMessages(prev => [
      ...prev.map((m, i) => i === msgIndex ? { ...m, actions: undefined } : m),
      { role: 'user', content: value === 'yes' ? YES_LABEL[lang] : NO_LABEL[lang] },
    ])
    setTimeout(() => {
      if (value === 'yes' && target) {
        const intro = target === 'restaurant' ? RESTAURANT_INTRO_BY_LANG[lang] : TRANSPORT_INTRO_BY_LANG[lang]
        setMessages(prev => [...prev, { role: 'assistant', content: intro, type: target }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: DECLINE_BY_LANG[lang] }])
      }
    }, 700)
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

      {/* Skip intro — appears after 3s via CSS animation */}
      {phase === 'intro' && (
        <button onClick={skipIntro} className="cv-skip-btn"
          style={{ position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 100, padding: '8px 22px', color: 'rgba(255,255,255,0.38)', fontFamily: '"Anton", sans-serif', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', cursor: 'pointer', opacity: 0 }}>
          SALTAR INTRO
        </button>
      )}

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

            {/* Language selector */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setLangOpen(o => !o)}
                style={{ height: 32, padding: '0 12px', borderRadius: 100, border: `1px solid ${langOpen ? '#C8FF00' : 'rgba(255,255,255,0.1)'}`, background: 'transparent', color: langOpen ? '#C8FF00' : 'rgba(255,255,255,0.45)', fontFamily: '"Anton", sans-serif', fontSize: 10, letterSpacing: '0.14em', cursor: 'pointer' }}>
                {lang.toUpperCase()}
              </button>
              {langOpen && (
                <div style={{ position: 'absolute', top: 38, right: 0, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', zIndex: 200, minWidth: 64 }}>
                  {(['es', 'en', 'pt', 'fr'] as Lang[]).map(l => (
                    <button key={l} onClick={() => changeLang(l)}
                      style={{ display: 'block', width: '100%', padding: '9px 16px', background: l === lang ? 'rgba(200,255,0,0.1)' : 'transparent', border: 'none', color: l === lang ? '#C8FF00' : 'rgba(255,255,255,0.55)', fontFamily: '"Anton", sans-serif', fontSize: 10, letterSpacing: '0.14em', textAlign: 'left', cursor: 'pointer' }}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setMuted(m => !m)}
              style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: muted ? 'rgba(255,255,255,0.25)' : '#C8FF00', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <button onClick={() => { setShowItinerary(true) }}
              style={{ position: 'relative', width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={13} />
              {guest.bookings.length > 0 && (
                <div style={{ position: 'absolute', top: -3, right: -3, minWidth: 14, height: 14, borderRadius: 7, background: '#C8FF00', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                  <span style={{ fontSize: 8, color: '#000', fontFamily: '"Anton", sans-serif' }}>{guest.bookings.length}</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={msgsRef} className="cv-msgs" style={{ flex: 1, overflowY: 'auto', padding: 'clamp(24px,4vw,48px) clamp(16px,5vw,48px) 16px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 860, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {messages.map((m, i) => {
            const isCard = m.type === 'transport' || m.type === 'restaurant' || m.type === 'driver'
            const isLast = i === messages.length - 1
            return (
              <div key={i} ref={isLast ? lastMsgRef : null} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 14 }}>
                {m.role === 'assistant' && (
                  <div style={{ flexShrink: 0, marginTop: 4, width: 24, height: 24, borderRadius: '50%', background: '#C8FF00', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(200,255,0,0.4)' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#000' }} />
                  </div>
                )}
                <div style={{ flex: isCard ? 1 : undefined, minWidth: 0, maxWidth: m.role === 'user' ? '62%' : '90%' }}>
                  <div style={m.role === 'user'
                    ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '18px 18px 3px 18px', padding: '11px 16px' }
                    : { padding: '2px 0', marginBottom: isCard && m.content ? 12 : 0 }}>
                    <div style={{ color: m.role === 'user' ? '#FFF' : 'rgba(255,255,255,0.82)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.8, fontFamily: 'system-ui, sans-serif' }}
                      dangerouslySetInnerHTML={{ __html: renderMsg(m.content) }} />
                  </div>
                  {m.actions && m.actions.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      {m.actions.map(a => (
                        <button key={a.value} onClick={() => handleUpsellAction(a.value, i, m.actionTarget)}
                          style={{ fontFamily: '"Anton", sans-serif', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '10px 18px', borderRadius: 100, cursor: 'pointer', background: a.value === 'yes' ? '#C8FF00' : 'transparent', color: a.value === 'yes' ? '#000' : 'rgba(255,255,255,0.55)', border: a.value === 'yes' ? 'none' : '1px solid rgba(255,255,255,0.2)' }}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {m.type === 'transport' && <TransportCards destination={m.destination ?? 'Estadio Azteca'} onBooked={handleBooked} />}
                  {m.type === 'restaurant' && <RestaurantCards onBooked={handleBooked} />}
                  {m.type === 'driver' && <DriverCards onBooked={handleBooked} />}
                </div>
              </div>
            )
          })}

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
            {listening && (
              <div style={{ display: 'flex', gap: 3, paddingRight: 6, alignItems: 'center' }} aria-hidden>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ width: 3, height: 16, borderRadius: 8, background: '#C8FF00', opacity: 0.9, transform: `scaleY(${0.35 + micLevel * (1.6 - i * 0.18)})`, transformOrigin: 'center', transition: 'transform 80ms linear' }} />
                ))}
              </div>
            )}
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
        @keyframes cv-skip-appear { to { opacity: 1 } }
        .cv-skip-btn { animation: cv-skip-appear 0.5s ease forwards 3s !important; }
        .cv-msgs::-webkit-scrollbar { display: none; }
        .cv-msgs { scrollbar-width: none; }
      `}</style>
    </div>
  )
}
