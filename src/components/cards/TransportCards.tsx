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
