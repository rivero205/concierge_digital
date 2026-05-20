// src/components/ItineraryPanel.tsx
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { X, MapPin, Phone, Trash2 } from 'lucide-react'
import { useGuest } from '../context/GuestContext'
import { Booking } from '../context/GuestContext'

type Props = { onClose: () => void }

const FAKE_PHONES: Record<string, string> = {
  'Fernando T.': '+52 55 8821 3490',
  'Carlos M.': '+52 55 9134 7620',
  'Alejandro R.': '+52 55 7043 1985',
}

function mapSearchFor(b: Booking): string {
  if (b.type === 'restaurant') return `https://www.google.com/maps/search/${encodeURIComponent(b.title + ' ' + (b.subtitle.split('·')[1]?.trim() ?? 'CDMX'))}`
  return `https://www.google.com/maps/search/Estadio+Azteca+CDMX`
}

export default function ItineraryPanel({ onClose }: Props) {
  const { guest, removeBooking } = useGuest()
  const panelRef = useRef<HTMLDivElement>(null)
  const [contactCard, setContactCard] = useState<Booking | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null)

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

  function handleCancel(id: string) {
    if (cancelConfirm === id) {
      removeBooking(id)
      setCancelConfirm(null)
    } else {
      setCancelConfirm(id)
    }
  }

  // Extract driver name from subtitle for transport bookings
  function getDriverPhone(b: Booking): string | null {
    if (b.type !== 'transport') return null
    for (const [name, phone] of Object.entries(FAKE_PHONES)) {
      if (b.subtitle.includes(name)) return `${name} · ${phone}`
    }
    return '+52 55 0000 0000'
  }

  return (
    <div ref={panelRef}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(380px, 100%)', background: '#0a0a0a', borderLeft: '1px solid rgba(255,255,255,0.07)', zIndex: 10, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 16, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FFF' }}>Mi Itinerario</div>
          <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            {guest.bookings.length} reserva{guest.bookings.length !== 1 ? 's' : ''} confirmada{guest.bookings.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button onClick={handleClose}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={13} />
        </button>
      </div>

      {/* Bookings list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {guest.bookings.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, paddingTop: 60 }}>
            <div style={{ fontSize: 32 }}>🗓</div>
            <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Aún no tienes reservas</div>
            <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}>Pídele al concierge lo que necesites.</div>
          </div>
        ) : (
          guest.bookings.map(b => (
            <div key={b.id}
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${cancelConfirm === b.id ? 'rgba(255,70,70,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '14px 16px', transition: 'border-color 0.2s' }}>

              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{b.type === 'transport' ? '🚗' : '🍽'}</span>
                  <span style={{ fontFamily: '"Anton", sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#FFF' }}>{b.title}</span>
                </div>
                <div style={{ background: 'rgba(200,255,0,0.12)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 100, padding: '2px 8px' }}>
                  <span style={{ fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C8FF00', fontFamily: '"Anton", sans-serif' }}>● CONFIRMADO</span>
                </div>
              </div>

              {/* Details */}
              <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 12 }}>
                <div>{b.subtitle}</div>
                <div>{b.datetime}</div>
                <div>{b.detail}</div>
              </div>

              {/* Contact info (shown on tap) */}
              {contactCard?.id === b.id && (
                <div style={{ background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.18)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                  <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                    {b.type === 'transport' ? getDriverPhone(b) : `Reservas · ${b.title}`}
                  </div>
                  <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                    {b.type === 'transport' ? 'Contacto directo del chofer' : 'El restaurante te confirmará por email'}
                  </div>
                </div>
              )}

              {/* Cancel confirmation */}
              {cancelConfirm === b.id && (
                <div style={{ background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,70,70,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                  <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: 'rgba(255,120,120,0.9)' }}>
                    ¿Confirmar cancelación?
                  </div>
                  <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    Toca cancelar de nuevo para confirmar
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={mapSearchFor(b)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 0', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', cursor: 'pointer' }}
                >
                  <MapPin size={12} />
                  <span style={{ fontFamily: '"Anton", sans-serif', fontSize: 9, letterSpacing: '0.12em' }}>VER MAPA</span>
                </a>
                <button
                  onClick={() => setContactCard(contactCard?.id === b.id ? null : b)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 0', background: contactCard?.id === b.id ? 'rgba(200,255,0,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${contactCard?.id === b.id ? 'rgba(200,255,0,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, color: contactCard?.id === b.id ? '#C8FF00' : 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                >
                  <Phone size={12} />
                  <span style={{ fontFamily: '"Anton", sans-serif', fontSize: 9, letterSpacing: '0.12em' }}>CONTACTAR</span>
                </button>
                <button
                  onClick={() => handleCancel(b.id)}
                  style={{ width: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', background: cancelConfirm === b.id ? 'rgba(255,50,50,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${cancelConfirm === b.id ? 'rgba(255,70,70,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, color: cancelConfirm === b.id ? '#FF7070' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
