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
