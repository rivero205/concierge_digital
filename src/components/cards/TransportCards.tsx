// src/components/cards/TransportCards.tsx
import { useState } from 'react'
import { VEHICLES, Vehicle } from '../../data/mock'
import { useGuest } from '../../context/GuestContext'
import { Booking } from '../../context/GuestContext'

type Props = { destination?: string; onBooked: (msg: string, type: 'transport' | 'restaurant') => void }

const META = [
  {
    badge: 'ECONÓMICO',
    badgeStyle: { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' },
    popular: false,
    tag: '',
    proof: '7 reservas hoy',
    benefits: ['Chofer certificado', 'A/C + WiFi', 'Puntualidad garantizada'],
    cta: 'RESERVAR',
    unit: 'por trayecto',
    driver: 'Fernando T.',
    maxPeople: 3,
  },
  {
    badge: '★ MÁS POPULAR',
    badgeStyle: { background: '#C8FF00', color: '#000' },
    popular: true,
    tag: 'Solo 3 disponibles',
    proof: '18 reservas hoy',
    benefits: ['Chofer VIP certificado', 'Agua, snacks + WiFi', 'Carga USB · A/C premium'],
    cta: 'RESERVAR AHORA',
    unit: 'por trayecto',
    driver: 'Carlos M.',
    maxPeople: 5,
  },
  {
    badge: 'LUJO VIP',
    badgeStyle: { background: 'rgba(200,255,0,0.15)', color: '#C8FF00' },
    popular: false,
    tag: 'Última unidad',
    proof: '4 reservas hoy',
    benefits: ['Chofer ejecutivo privado', 'Bar + amenidades a bordo', 'Servicio puerta a puerta'],
    cta: 'RESERVAR',
    unit: 'por trayecto',
    driver: 'Alejandro R.',
    maxPeople: 8,
  },
]

const TIME_OPTIONS = ['15:00', '16:00', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '21:00']

type Pending = { vehicle: Vehicle; meta: typeof META[0] }

export default function TransportCards({ destination = 'Estadio Azteca', onBooked }: Props) {
  const { addBooking } = useGuest()
  const [booked, setBooked] = useState<string[]>([])
  const [pending, setPending] = useState<Pending | null>(null)
  const [people, setPeople] = useState(2)
  const [time, setTime] = useState('18:30')

  function openConfirm(v: Vehicle, m: typeof META[0]) {
    if (booked.includes(v.id)) return
    setPeople(2)
    setTime('18:30')
    setPending({ vehicle: v, meta: m })
  }

  function confirmReserve() {
    if (!pending) return
    const { vehicle: v, meta: m } = pending
    const booking: Booking = {
      id: `transport-${Date.now()}`,
      type: 'transport',
      title: v.name,
      subtitle: `${v.level} · ${people} persona${people > 1 ? 's' : ''}`,
      datetime: `Hoy · ${time} hrs`,
      detail: `Hotel → ${destination}`,
      confirmedAt: Date.now(),
    }
    addBooking(booking)
    setBooked(prev => [...prev, v.id])
    onBooked(
      `✅ Tu **${v.name}** está confirmado · ${time} hrs · ${people} persona${people > 1 ? 's' : ''}. Tu chofer **${m.driver}** (★ 4.9) te recoge en el hotel. Puedes verlo en **MI ITINERARIO** arriba.`,
      'transport'
    )
    setPending(null)
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Section label — styled as muted caption, not a button */}
      <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14, borderLeft: '2px solid rgba(200,255,0,0.35)', paddingLeft: 8 }}>
        Transporte al estadio · {destination}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(178px, 1fr))', gap: 12 }}>
        {VEHICLES.map((v, i) => {
          const m = META[i] ?? META[0]
          const done = booked.includes(v.id)

          return (
            <div key={v.id} style={{
              position: 'relative', borderRadius: 16, overflow: 'hidden',
              border: m.popular ? '1.5px solid #C8FF00' : '1px solid rgba(255,255,255,0.1)',
              background: '#0d0d0d',
              boxShadow: m.popular ? '0 0 28px rgba(200,255,0,0.13), 0 4px 24px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.4)',
              transform: m.popular ? 'translateY(-4px)' : 'none',
              transition: 'transform 0.2s',
            }}>

              {/* Image */}
              <div style={{ position: 'relative', height: 128 }}>
                <img src={v.img} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d0d0d 5%, rgba(0,0,0,0.25) 55%, transparent 100%)' }} />
                <div style={{ position: 'absolute', top: 10, left: 10 }}>
                  <span style={{ ...m.badgeStyle, fontFamily: '"Anton", sans-serif', fontSize: 8, letterSpacing: '0.12em', padding: '3px 10px', borderRadius: 100, display: 'inline-block' }}>
                    {m.badge}
                  </span>
                </div>
                {m.tag && (
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <span style={{ background: 'rgba(255,50,50,0.22)', border: '1px solid rgba(255,80,80,0.45)', color: '#FF7070', fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 8, padding: '3px 8px', borderRadius: 100, display: 'inline-block', letterSpacing: '0.04em' }}>
                      ⚡ {m.tag}
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: '12px 14px 16px' }}>
                <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: 2 }}>
                  {v.name}
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.68)', marginBottom: 10 }}>
                  {v.capacity}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                  {m.benefits.map((b, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ color: '#C8FF00', fontSize: 10, lineHeight: 1, flexShrink: 0 }}>✓</span>
                      <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.35 }}>{b}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>🔥</span><span>{m.proof}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 10 }}>
                  <span style={{ fontFamily: '"Anton", sans-serif', fontSize: 22, color: '#C8FF00', lineHeight: 1 }}>{v.price}</span>
                  <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{m.unit}</span>
                </div>

                {done ? (
                  <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 10, letterSpacing: '0.2em', color: '#C8FF00', textAlign: 'center', padding: '9px 0', border: '1px solid rgba(200,255,0,0.3)', borderRadius: 100 }}>
                    ✓ RESERVADO
                  </div>
                ) : (
                  <>
                    <button onClick={() => openConfirm(v, m)} style={{
                      width: '100%',
                      fontFamily: '"Anton", sans-serif', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                      background: m.popular ? '#C8FF00' : 'transparent',
                      color: m.popular ? '#000' : '#C8FF00',
                      border: m.popular ? 'none' : '1.5px solid rgba(200,255,0,0.5)',
                      borderRadius: 100, padding: '10px 0', cursor: 'pointer',
                    }}>
                      {m.cta}
                    </button>
                    <div style={{ textAlign: 'center', fontFamily: 'system-ui, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.32)', marginTop: 6 }}>
                      🔒 Cancelación gratis · Pago seguro
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Confirmation modal */}
      {pending && (
        <div
          onClick={() => setPending(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: 28, maxWidth: 340, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
          >
            {/* Header */}
            <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
              Confirmar reserva
            </div>

            {/* Vehicle */}
            <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 20, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#FFF', marginBottom: 4 }}>
              {pending.vehicle.name}
            </div>
            <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
              Hotel → {destination}
            </div>

            {/* People selector */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '0.05em' }}>
                PERSONAS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <button
                  onClick={() => setPeople(p => Math.max(1, p - 1))}
                  style={{ background: 'transparent', border: 'none', color: people > 1 ? '#C8FF00' : 'rgba(255,255,255,0.2)', fontSize: 20, width: 48, height: 48, cursor: people > 1 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >−</button>
                <span style={{ flex: 1, textAlign: 'center', fontFamily: '"Anton", sans-serif', fontSize: 18, color: '#FFF' }}>{people}</span>
                <button
                  onClick={() => setPeople(p => Math.min(pending.meta.maxPeople, p + 1))}
                  style={{ background: 'transparent', border: 'none', color: people < pending.meta.maxPeople ? '#C8FF00' : 'rgba(255,255,255,0.2)', fontSize: 20, width: 48, height: 48, cursor: people < pending.meta.maxPeople ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >+</button>
              </div>
              <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 5 }}>
                Máx. {pending.meta.maxPeople} personas en este vehículo
              </div>
            </div>

            {/* Time selector */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '0.05em' }}>
                HORA DE SALIDA
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TIME_OPTIONS.map(t => (
                  <button key={t} onClick={() => setTime(t)} style={{
                    fontFamily: '"Anton", sans-serif', fontSize: 11, letterSpacing: '0.08em',
                    padding: '6px 12px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                    background: time === t ? '#C8FF00' : 'rgba(255,255,255,0.05)',
                    color: time === t ? '#000' : 'rgba(255,255,255,0.55)',
                    border: time === t ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Summary row */}
            <div style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                  {people} persona{people > 1 ? 's' : ''} · {time} hrs
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                  Chofer: {pending.meta.driver} ★ 4.9
                </div>
              </div>
              <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 22, color: '#C8FF00' }}>
                {pending.vehicle.price}
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={confirmReserve}
              style={{ width: '100%', fontFamily: '"Anton", sans-serif', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', background: '#C8FF00', color: '#000', border: 'none', borderRadius: 100, padding: '14px 0', cursor: 'pointer' }}
            >
              Confirmar reserva →
            </button>
            <div style={{ textAlign: 'center', fontFamily: 'system-ui, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 10 }}>
              🔒 Cancelación gratis hasta 2h antes · Pago al finalizar
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
