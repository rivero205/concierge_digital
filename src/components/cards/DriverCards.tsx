// src/components/cards/DriverCards.tsx
import { useState } from 'react'
import { DRIVER_PACKAGES, DriverPackage } from '../../data/mock'
import { useGuest } from '../../context/GuestContext'
import { Booking } from '../../context/GuestContext'

type Props = { onBooked: (msg: string, type: 'transport' | 'restaurant') => void }

const META = [
  {
    badge: 'FLEXIBLE',
    badgeStyle: { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' },
    featured: false,
    tag: '',
    proof: '12 reservas hoy',
    perHour: '$30/hr',
    highlights: ['4 horas continuas', 'Traslados ilimitados', 'Espera incluida'],
    cta: 'RESERVAR',
    driver: 'Fernando T.',
  },
  {
    badge: '★ MÁS SOLICITADO',
    badgeStyle: { background: '#C8FF00', color: '#000' },
    featured: true,
    tag: 'Solo 2 disponibles',
    proof: '28 reservas esta semana',
    perHour: '$27.5/hr',
    highlights: ['8 horas sin restricciones', 'Pre + post partido incluido', 'SUV Premium garantizado'],
    cta: 'RESERVAR AHORA',
    driver: 'Carlos M.',
  },
  {
    badge: 'VIP TOTAL',
    badgeStyle: { background: 'rgba(200,255,0,0.15)', color: '#C8FF00' },
    featured: false,
    tag: 'Última unidad',
    proof: '4 reservas este mes',
    perHour: '$15.8/hr',
    highlights: ['Disponibilidad 24/7', 'SUV Ejecutivo incluido', 'Chofer bilingüe privado'],
    cta: 'RESERVAR',
    driver: 'Alejandro R.',
  },
]

const START_TIMES = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '16:00', '18:00']

type Pending = { pkg: DriverPackage; meta: typeof META[0] }

export default function DriverCards({ onBooked }: Props) {
  const { addBooking } = useGuest()
  const [booked, setBooked] = useState<string[]>([])
  const [pending, setPending] = useState<Pending | null>(null)
  const [startTime, setStartTime] = useState('09:00')

  function openConfirm(pkg: DriverPackage, m: typeof META[0]) {
    if (booked.includes(pkg.id)) return
    setStartTime('09:00')
    setPending({ pkg, meta: m })
  }

  function confirmReserve() {
    if (!pending) return
    const { pkg, meta: m } = pending
    const booking: Booking = {
      id: `driver-${Date.now()}`,
      type: 'transport',
      title: `Driver Privado · ${pkg.name}`,
      subtitle: `${pkg.hours} · ${m.driver}`,
      datetime: `Hoy · ${startTime} hrs`,
      detail: 'A disposición completa',
      confirmedAt: Date.now(),
    }
    addBooking(booking)
    setBooked(prev => [...prev, pkg.id])
    onBooked(
      `✅ Paquete **${pkg.name}** confirmado · ${startTime} hrs · Tu chofer **${m.driver}** (★ 4.9) estará a tu disposición. Puedes verlo en **MI ITINERARIO** arriba.`,
      'transport'
    )
    setPending(null)
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14, borderLeft: '2px solid rgba(200,255,0,0.35)', paddingLeft: 8 }}>
        Chofer privado · Paquetes por horas
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(178px, 1fr))', gap: 12 }}>
        {DRIVER_PACKAGES.map((pkg, i) => {
          const m = META[i] ?? META[0]
          const done = booked.includes(pkg.id)

          return (
            <div key={pkg.id} style={{
              position: 'relative', borderRadius: 16, overflow: 'hidden',
              border: m.featured ? '1.5px solid #C8FF00' : '1px solid rgba(255,255,255,0.1)',
              background: '#0d0d0d',
              boxShadow: m.featured ? '0 0 28px rgba(200,255,0,0.13), 0 4px 24px rgba(0,0,0,0.5)' : '0 2px 12px rgba(0,0,0,0.4)',
              transform: m.featured ? 'translateY(-4px)' : 'none',
            }}>

              {/* Image */}
              <div style={{ position: 'relative', height: 128 }}>
                <img src={pkg.img} alt={pkg.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
                {/* Hours overlay */}
                <div style={{ position: 'absolute', bottom: 10, left: 14 }}>
                  <span style={{ fontFamily: '"Anton", sans-serif', fontSize: 11, color: '#C8FF00', letterSpacing: '0.08em' }}>{pkg.hours}</span>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '12px 14px 16px' }}>
                <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#FFFFFF', marginBottom: 2 }}>
                  {pkg.name}
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.68)', marginBottom: 10 }}>
                  Chofer: {m.driver} · ★ 4.9
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                  {m.highlights.map((h, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ color: '#C8FF00', fontSize: 10, lineHeight: 1, flexShrink: 0 }}>✓</span>
                      <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.35 }}>{h}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>🔥</span><span>{m.proof}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 4 }}>
                  <span style={{ fontFamily: '"Anton", sans-serif', fontSize: 22, color: '#C8FF00', lineHeight: 1 }}>{pkg.price}</span>
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.38)', marginBottom: 10 }}>
                  equivale a {m.perHour}
                </div>

                {done ? (
                  <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 10, letterSpacing: '0.2em', color: '#C8FF00', textAlign: 'center', padding: '9px 0', border: '1px solid rgba(200,255,0,0.3)', borderRadius: 100 }}>
                    ✓ RESERVADO
                  </div>
                ) : (
                  <>
                    <button onClick={() => openConfirm(pkg, m)} style={{
                      width: '100%',
                      fontFamily: '"Anton", sans-serif', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                      background: m.featured ? '#C8FF00' : 'transparent',
                      color: m.featured ? '#000' : '#C8FF00',
                      border: m.featured ? 'none' : '1.5px solid rgba(200,255,0,0.5)',
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
            <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
              Confirmar paquete
            </div>
            <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 20, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#FFF', marginBottom: 2 }}>
              Driver Privado · {pending.pkg.name}
            </div>
            <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
              {pending.pkg.hours} · {pending.meta.driver} ★ 4.9
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '0.05em' }}>
                HORA DE INICIO
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {START_TIMES.map(t => (
                  <button key={t} onClick={() => setStartTime(t)} style={{
                    fontFamily: '"Anton", sans-serif', fontSize: 11, letterSpacing: '0.08em',
                    padding: '6px 12px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                    background: startTime === t ? '#C8FF00' : 'rgba(255,255,255,0.05)',
                    color: startTime === t ? '#000' : 'rgba(255,255,255,0.55)',
                    border: startTime === t ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.15)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                  Inicio: {startTime} hrs · {pending.pkg.hours}
                </div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                  {pending.meta.perHour} · Chofer: {pending.meta.driver}
                </div>
              </div>
              <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 22, color: '#C8FF00' }}>
                {pending.pkg.price}
              </div>
            </div>

            <button
              onClick={confirmReserve}
              style={{ width: '100%', fontFamily: '"Anton", sans-serif', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', background: '#C8FF00', color: '#000', border: 'none', borderRadius: 100, padding: '14px 0', cursor: 'pointer' }}
            >
              Confirmar paquete →
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
