import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { X, ArrowUp } from 'lucide-react'
import { streamChat, type Message } from '../lib/openrouter'
import { SYSTEM_PROMPT } from '../lib/concierge-prompt'

// ─── Types ────────────────────────────────────────────────────────────────────

type CardItem = { img: string; title: string; tag: string; desc: string }
type LocalMsg  = Message & { cards?: CardItem[] }

// ─── Static chip responses ────────────────────────────────────────────────────

const INITIAL_MESSAGE: LocalMsg = {
  role: 'assistant',
  content:
    "Welcome. I'm your exclusive concierge for **FIFA World Cup 2026 México**.\n\nI'm here to make your experience extraordinary — hotels, restaurants, transport, match day plans, and everything in between.\n\nWhere shall we begin?",
}

const CHIPS = [
  { label: 'Hotels',         prompt: 'What are the best hotels near Estadio Azteca?' },
  { label: 'Where to eat',   prompt: 'Best restaurants in CDMX for FIFA 2026?' },
  { label: 'Match day plan', prompt: 'Create my perfect match day plan for Estadio Azteca' },
  { label: 'Getting around', prompt: 'How do I get around CDMX during the World Cup?' },
  { label: 'Plan my 3 days', prompt: 'I have 3 days in CDMX for the World Cup. Plan everything.' },
]

type ChipReply =
  | { type: 'cards'; thinkingMsg: string; introText: string; label: string; cards: CardItem[] }
  | { type: 'text';  thinkingMsg: string; content: string }

const CHIP_REPLIES: Record<string, ChipReply> = {
  Hotels: {
    type: 'cards',
    thinkingMsg: 'Finding the best hotels',
    introText: "I've handpicked these properties based on distance to Estadio Azteca, service level, and World Cup experience. All offer match-day packages — book early, they fill by kick-off season.",
    label: 'Top hotels · Estadio Azteca, CDMX',
    cards: [
      { img: 'https://picsum.photos/seed/hcdmx1/600/400', title: 'Camino Real Pedregal', tag: '8 min · Garden Resort',  desc: 'Iconic pools & spa, direct match-day transfers' },
      { img: 'https://picsum.photos/seed/hcdmx2/600/400', title: 'Four Seasons MX',       tag: 'Reforma · Five-Star',   desc: 'Legendary service near fan zones & Paseo' },
      { img: 'https://picsum.photos/seed/hcdmx3/600/400', title: 'Las Alcobas',           tag: 'Polanco · Boutique',   desc: 'Intimate luxury, world-class restaurant on-site' },
      { img: 'https://picsum.photos/seed/hcdmx4/600/400', title: 'Hilton Reforma',        tag: 'Central · Rooftop',   desc: 'City-view bar, walking distance to Zócalo' },
      { img: 'https://picsum.photos/seed/hcdmx5/600/400', title: 'JW Marriott Santa Fe', tag: '20 min · Modern',     desc: 'Contemporary design, quieter zone, match packages' },
    ],
  },

  'Where to eat': {
    type: 'cards',
    thinkingMsg: 'Finding the best tables',
    introText: "CDMX is having a culinary moment. For FIFA 2026 these are the tables worth securing **now** — from the world's #1 Latin American restaurant to an iconic seafood spot in Roma Norte. Most will be fully booked by tournament week.",
    label: 'Best tables in CDMX · FIFA 2026',
    cards: [
      { img: 'https://picsum.photos/seed/rcdmx1/600/400', title: 'Pujol',            tag: 'Polanco · #1 LATAM',     desc: "Enrique Olvera's mole madre — reserve weeks ahead" },
      { img: 'https://picsum.photos/seed/rcdmx2/600/400', title: 'Quintonil',        tag: 'Polanco · World Top 30', desc: 'Modern Mexican haute cuisine at its finest' },
      { img: 'https://picsum.photos/seed/rcdmx3/600/400', title: 'Contramar',        tag: 'Roma Norte · Seafood',   desc: 'Legendary tuna tostadas, perfect for lunch' },
      { img: 'https://picsum.photos/seed/rcdmx4/600/400', title: 'El Cardenal',      tag: 'Historic · Since 1969',  desc: 'Traditional Mexican breakfast institution' },
      { img: 'https://picsum.photos/seed/rcdmx5/600/400', title: 'Mercado Medellín', tag: 'Roma Sur · Street Food', desc: 'Best local market experience in the city' },
    ],
  },

  'Match day plan': {
    type: 'text',
    thinkingMsg: 'Building your match day plan',
    content:
      '**Your perfect Estadio Azteca match day:**\n\n> **5h before** · Breakfast at Mercado de Medellín, Roma Sur\n\n> **3h before** · Metro Line 2 → Tasqueña, then Tren Ligero direct to Azteca\n\n> **2h before** · Fan zone on Av. Insurgentes Sur — live music & food trucks\n\n> **90 min before** · Gates open — Sección Baja recommended for best views\n\n> **Post-match** · Condesa or Roma Norte to celebrate — pre-book Uber, surge will be high\n\n**Bring:** ID, printed ticket, cash (MXN), light jacket.',
  },

  'Getting around': {
    type: 'text',
    thinkingMsg: 'Checking transport options',
    content:
      '**CDMX transport during World Cup:**\n\n**Metro** · Line 2 (blue) for Azteca area · MXN $6/ride · Avoid 7–9am & 6–8pm\n\n**Metrobús** · BRT on Insurgentes · Day pass recommended · Covers all tourist zones\n\n**Uber** · Most comfortable · Always available · Expect surge on match days\n\n**Hotel transfers** · Best for match days · Book 48h ahead · Fixed group rates\n\n**Avoid driving** · Severe gridlock on match days · Parking scarce & expensive\n\n> Download the CDMX Metro app and grab a tarjeta de transporte on arrival.',
  },

  'Plan my 3 days': {
    type: 'text',
    thinkingMsg: 'Planning your itinerary',
    content:
      '**Your 3-day FIFA 2026 CDMX itinerary:**\n\n**Day 1 — Arrive & Discover**\nCheck in → Paseo de la Reforma → Polanco (Av. Masaryk) → Dinner at Quintonil → Drinks in Condesa\n\n**Day 2 — Match Day**\nLate breakfast → Fan zone at Insurgentes Sur → Estadio Azteca → Post-match in Roma Norte\n\n**Day 3 — Culture & Depart**\nMorning: Teotihuacán pyramids (1.5h from city) OR Xochimilco floating gardens\nAfternoon: Zócalo & Palacio de Bellas Artes → Airport transfer\n\n> Tell me your match dates and I\'ll build a custom plan around kickoff times.',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderMsg(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(
      /^> (.+)$/gm,
      '<span style="display:block;opacity:.5;padding-left:10px;border-left:2px solid rgba(200,255,0,.3);margin:3px 0">$1</span>',
    )
    .replace(/\n/g, '<br/>')
}

// ─── Component ────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'interface'

export default function ConciergeView({ onClose }: { onClose: () => void }) {
  const [phase,     setPhase]     = useState<Phase>('intro')
  const [messages,  setMessages]  = useState<LocalMsg[]>([INITIAL_MESSAGE])
  const [input,     setInput]     = useState('')
  const [streaming, setStreaming] = useState(false)
  const [thinking,    setThinking]    = useState(false)
  const [thinkingMsg, setThinkingMsg] = useState('')

  // Refs — GSAP targets
  const rootRef      = useRef<HTMLDivElement>(null)
  const gooeyWrapRef = useRef<HTMLDivElement>(null)
  const blob1Ref     = useRef<HTMLDivElement>(null)
  const blob2Ref     = useRef<HTMLDivElement>(null)
  const blob3Ref     = useRef<HTMLDivElement>(null)
  const introTxtRef  = useRef<HTMLDivElement>(null)
  const uiRef        = useRef<HTMLDivElement>(null)
  const inputBoxRef  = useRef<HTMLDivElement>(null)
  const msgsRef      = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const thinkRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const simRef       = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Lock body scroll while open, restore position on close ───────────────
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top      = `-${scrollY}px`
    document.body.style.width    = '100%'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = ''
      document.body.style.top      = ''
      document.body.style.width    = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  // ── Cleanup timers on unmount ─────────────────────────────────────────────
  useEffect(() => () => {
    if (thinkRef.current) clearTimeout(thinkRef.current)
    if (simRef.current)   clearInterval(simRef.current)
  }, [])

  // ── Scroll to bottom on new messages / thinking ───────────────────────────
  useEffect(() => {
    const el = msgsRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, thinking])

  // ── Focus input when interface appears ────────────────────────────────────
  useEffect(() => {
    if (phase === 'interface') setTimeout(() => inputRef.current?.focus(), 200)
  }, [phase])

  // ── GSAP Intro Timeline ───────────────────────────────────────────────────
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

      gsap.set(uiRef.current,       { opacity: 0, y: 40 })
      gsap.set(introTxtRef.current, { opacity: 0 })

      const tl = gsap.timeline({ onComplete: () => setPhase('interface') })

      tl.from(blob1Ref.current, { x: -vw * 0.40, y: -vh * 0.30, scale: 0.15, opacity: 0, duration: 1.9, ease: 'power3.out' })
        .from(blob2Ref.current, { x: vw * 0.38,  y: -vh * 0.28, scale: 0.15, opacity: 0, duration: 1.9, ease: 'power3.out' }, '-=1.70')
        .from(blob3Ref.current, { x: -vw * 0.02, y: vh * 0.42,  scale: 0.15, opacity: 0, duration: 1.9, ease: 'power3.out' }, '-=1.65')
        .to(introTxtRef.current,  { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.55')
        .to({}, { duration: 0.7 })
        .to([blob1Ref.current, blob2Ref.current, blob3Ref.current], { scale: 7, opacity: 0, duration: 0.85, ease: 'power3.in', stagger: 0.04 })
        .to(introTxtRef.current,  { opacity: 0, duration: 0.25 }, '-=0.75')
        .to(gooeyWrapRef.current, { opacity: 0, duration: 0.25 }, '-=0.45')
        .to(uiRef.current,        { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' }, '-=0.15')

    }, rootRef)

    return () => ctx.revert()
  }, [])

  // ── Simulate typing for static text responses ─────────────────────────────
  function simulateText(content: string) {
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])
    setStreaming(true)
    let i = 0
    simRef.current = setInterval(() => {
      i += 9
      const slice = content.slice(0, i)
      setMessages(prev => {
        const upd = [...prev]
        upd[upd.length - 1] = { role: 'assistant', content: slice }
        return upd
      })
      if (i >= content.length) {
        clearInterval(simRef.current!)
        simRef.current = null
        setStreaming(false)
      }
    }, 18)
  }

  // ── Chip handler — all static, no AI ─────────────────────────────────────
  function sendChip(chip: typeof CHIPS[0]) {
    if (streaming || thinking) return
    const reply = CHIP_REPLIES[chip.label]
    if (!reply) { send(chip.prompt); return }

    setMessages(prev => [...prev, { role: 'user', content: chip.prompt }])
    setThinkingMsg(reply.thinkingMsg)
    setThinking(true)

    thinkRef.current = setTimeout(() => {
      setThinking(false)
      if (reply.type === 'cards') {
        // First type the intro message, then append cards after a brief pause
        const { introText, label, cards } = reply
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])
        setStreaming(true)
        let i = 0
        simRef.current = setInterval(() => {
          i += 9
          const slice = introText.slice(0, i)
          setMessages(prev => {
            const upd = [...prev]
            upd[upd.length - 1] = { role: 'assistant', content: slice }
            return upd
          })
          if (i >= introText.length) {
            clearInterval(simRef.current!)
            simRef.current = null
            setStreaming(false)
            setTimeout(() => {
              setMessages(prev => [...prev, { role: 'assistant', content: label, cards }])
            }, 300)
          }
        }, 18)
      } else {
        simulateText(reply.content)
      }
    }, 1600)
  }

  // ── Send free-form message to AI ──────────────────────────────────────────
  async function send(text: string) {
    if (!text.trim() || streaming || thinking) return

    const userMsg: LocalMsg = { role: 'user', content: text }
    // Strip cards from history before sending to API
    const history = [...messages, userMsg]
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content } as Message))

    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    try {
      await streamChat(
        [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
        chunk => {
          setMessages(prev => {
            const upd = [...prev]
            upd[upd.length - 1] = { role: 'assistant', content: upd[upd.length - 1].content + chunk }
            return upd
          })
        },
        () => setStreaming(false),
      )
    } catch (err) {
      console.error('[ConciergeView]', err)
      setMessages(prev => {
        const upd = [...prev]
        upd[upd.length - 1] = { role: 'assistant', content: 'Connection error. Please try again.' }
        return upd
      })
      setStreaming(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={rootRef}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000000', fontFamily: '"Anton", sans-serif', overflow: 'hidden' }}
    >
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
        <div style={{ position: 'absolute', borderRadius: '50%', width: 350, height: 350, left: '45%', bottom: '-5%', background: 'radial-gradient(circle, rgba(200,255,0,0.025) 0%, transparent 70%)', animation: 'cv-drift3 18s ease-in-out infinite' }} />
      </div>

      {/* ── INTRO — Gooey blobs + text ──────────────────────────────────── */}
      <div ref={gooeyWrapRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'url(#cv-gooey)' }}>
          <div ref={blob1Ref} style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: '#C8FF00', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div ref={blob2Ref} style={{ position: 'absolute', width: 270, height: 270, borderRadius: '50%', background: '#C8FF00', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div ref={blob3Ref} style={{ position: 'absolute', width: 210, height: 210, borderRadius: '50%', background: '#C8FF00', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        </div>
      </div>

      <div ref={introTxtRef} style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(18px, 2.4vw, 28px)', letterSpacing: '0.45em', textTransform: 'uppercase', color: '#000000', lineHeight: 1 }}>CONCIERGE</div>
          <div style={{ fontFamily: '"Condiment", cursive', fontSize: 'clamp(46px, 6.5vw, 76px)', color: '#000000', lineHeight: 1, marginTop: -6, letterSpacing: '0.01em', alignSelf: 'flex-end', marginRight: '-8%', transform: 'rotate(-2deg)' }}>Digital</div>
          <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 'clamp(7px, 0.9vw, 10px)', letterSpacing: '0.5em', textTransform: 'uppercase', color: '#000000', opacity: 0.6, marginTop: 16 }}>FIFA 2026 · México</div>
        </div>
      </div>

      {/* ── INTERFACE ───────────────────────────────────────────────────── */}
      <div
        ref={uiRef}
        style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#000000', opacity: 0 }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div
            onClick={onClose}
            style={{ display: 'flex', alignItems: 'baseline', gap: 10, cursor: 'pointer' }}
          >
            <span style={{ fontFamily: '"Anton", sans-serif', color: '#FFFFFF', fontSize: 22, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>CONCIERGE</span>
            <span style={{ fontFamily: '"Condiment", cursive', fontSize: 22, color: '#C8FF00', lineHeight: 1 }}>Digital</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: '"Anton", sans-serif' }}>FIFA 2026 · MX</span>
            <button onClick={onClose}
              style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s, color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,255,0,0.4)'; e.currentTarget.style.color = '#C8FF00' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={msgsRef} className="cv-msgs" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 'clamp(24px,4vw,48px) clamp(16px,5vw,48px) 16px', display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 820, width: '100%', margin: '0 auto', boxSizing: 'border-box', scrollbarWidth: 'none' }}>

          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 14 }}>
              {m.role === 'assistant' && (
                <div style={{ flexShrink: 0, marginTop: 4, width: 24, height: 24, borderRadius: '50%', background: '#C8FF00', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(200,255,0,0.4)' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#000000' }} />
                </div>
              )}

              {/* Cards response */}
              {m.cards ? (
                <div style={{ flex: 1, minWidth: 0 }}>
                  {m.content && (
                    <div style={{ marginBottom: 10, fontFamily: '"Anton", sans-serif', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                      {m.content}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 8 }}>
                    {m.cards.map((card, ci) => (
                      <div key={ci}
                        style={{ position: 'relative', height: 190, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', transition: 'border-color 0.25s, transform 0.25s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,255,0,0.25)'; e.currentTarget.style.transform = 'scale(1.025)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'scale(1)' }}>
                        <img src={card.img} alt={card.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.65) 50%, transparent 100%)' }} />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 11px' }}>
                          <div style={{ display: 'inline-block', background: 'rgba(200,255,0,0.13)', border: '1px solid rgba(200,255,0,0.22)', borderRadius: 100, padding: '2px 7px', marginBottom: 4 }}>
                            <span style={{ fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C8FF00', fontFamily: '"Anton", sans-serif' }}>{card.tag}</span>
                          </div>
                          <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 12, letterSpacing: '0.06em', color: '#FFF', lineHeight: 1.2, textTransform: 'uppercase' }}>{card.title}</div>
                          <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, marginTop: 3 }}>{card.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Text response / user bubble */
                <div style={{ maxWidth: m.role === 'user' ? '62%' : '86%', ...(m.role === 'user' ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '18px 18px 3px 18px', padding: '11px 16px' } : { padding: '2px 0' }) }}>
                  <div
                    style={{ color: m.role === 'user' ? '#FFFFFF' : 'rgba(255,255,255,0.82)', fontSize: 'clamp(13px,1.4vw,15px)', lineHeight: 1.8, letterSpacing: '0.01em', fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}
                    dangerouslySetInnerHTML={{ __html: m.role === 'assistant' ? renderMsg(m.content) : m.content }}
                  />
                  {m.role === 'assistant' && streaming && i === messages.length - 1 && (
                    <span style={{ display: 'inline-block', width: 2, height: 14, background: '#C8FF00', verticalAlign: 'middle', marginLeft: 3, animation: 'cv-blink 0.7s ease infinite' }} />
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Thinking bubble */}
          {thinking && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flexShrink: 0, marginTop: 4, width: 24, height: 24, borderRadius: '50%', background: '#C8FF00', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(200,255,0,0.4)' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#000000' }} />
              </div>
              <div style={{ padding: '11px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px 18px 18px 3px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.01em' }}>{thinkingMsg}</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: '#C8FF00', opacity: 0.7, animation: `cv-dot 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick chips */}
        <div style={{ maxWidth: 820, width: '100%', margin: '0 auto', padding: '10px clamp(16px,5vw,48px) 0', boxSizing: 'border-box', flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CHIPS.map(c => (
            <button key={c.label} onClick={() => sendChip(c)} disabled={streaming || thinking}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 100, padding: '7px 16px', color: (streaming || thinking) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.45)', fontSize: 10, cursor: (streaming || thinking) ? 'default' : 'pointer', letterSpacing: '0.14em', textTransform: 'uppercase', transition: 'all 0.2s', fontFamily: '"Anton", sans-serif' }}
              onMouseEnter={e => { if (streaming || thinking) return; e.currentTarget.style.borderColor = '#C8FF00'; e.currentTarget.style.color = '#C8FF00' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = (streaming || thinking) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.45)' }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(12px,2vw,20px) clamp(16px,5vw,48px) clamp(20px,3vw,32px)', maxWidth: 820, width: '100%', margin: '0 auto', boxSizing: 'border-box', flexShrink: 0 }}>
          <div ref={inputBoxRef} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '4px 4px 4px 20px', transition: 'border-color 0.25s' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              onFocus={() => { if (inputBoxRef.current) inputBoxRef.current.style.borderColor = 'rgba(200,255,0,0.28)' }}
              onBlur={() => { if (inputBoxRef.current) inputBoxRef.current.style.borderColor = 'rgba(255,255,255,0.1)' }}
              placeholder={streaming || thinking ? 'Concierge is responding...' : 'Ask me anything about México...'}
              disabled={streaming || thinking}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#EFF4FF', fontSize: 'clamp(13px,1.4vw,15px)', letterSpacing: '0.02em', padding: '12px 0', fontFamily: 'system-ui, sans-serif' }}
            />
            {(streaming || thinking) && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', paddingRight: 6 }}>
                {[0, 1, 2].map(j => <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: '#C8FF00', opacity: 0.7, animation: `cv-dot 1.2s ease-in-out ${j * 0.2}s infinite` }} />)}
              </div>
            )}
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming || thinking}
              style={{ width: 42, height: 42, borderRadius: 13, border: 'none', flexShrink: 0, background: input.trim() && !streaming && !thinking ? '#C8FF00' : 'rgba(255,255,255,0.07)', color: input.trim() && !streaming && !thinking ? '#010828' : 'rgba(255,255,255,0.25)', cursor: input.trim() && !streaming && !thinking ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: input.trim() && !streaming && !thinking ? '0 0 20px rgba(200,255,0,0.25)' : 'none' }}
              onMouseEnter={e => { if (!input.trim() || streaming || thinking) return; e.currentTarget.style.boxShadow = '0 0 32px rgba(200,255,0,0.45)'; e.currentTarget.style.transform = 'scale(1.05)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = input.trim() && !streaming ? '0 0 20px rgba(200,255,0,0.25)' : 'none'; e.currentTarget.style.transform = 'scale(1)' }}>
              <ArrowUp size={17} />
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, color: 'rgba(255,255,255,0.15)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: '"Anton", sans-serif' }}>
            CONCI · FIFA 2026 · MÉXICO
          </div>
        </div>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes cv-drift1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,70px) scale(1.08)} 66%{transform:translate(-35px,30px) scale(0.95)} }
        @keyframes cv-drift2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-55px,-45px) scale(1.06)} 70%{transform:translate(30px,-20px) scale(0.97)} }
        @keyframes cv-drift3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,-50px) scale(1.1)} }
        @keyframes cv-pulse  { 0%,100%{opacity:1;box-shadow:0 0 10px #C8FF00,0 0 20px rgba(200,255,0,.4)} 50%{opacity:.4;box-shadow:0 0 4px #C8FF00} }
        @keyframes cv-blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes cv-dot    { 0%,80%,100%{transform:scale(1);opacity:.7} 40%{transform:scale(1.5);opacity:1} }
        .cv-msgs::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
