// src/components/cards/RestaurantCards.tsx
import { useState } from 'react'
import { RESTAURANTS, Restaurant } from '../../data/mock'
import { useGuest } from '../../context/GuestContext'
import { Booking } from '../../context/GuestContext'

type Props = {
  onBooked: (msg: string) => void
  onAskParty: (restaurant: Restaurant) => void
}

export default function RestaurantCards({ onBooked, onAskParty }: Props) {
  const { guest, addBooking } = useGuest()
  const [booked, setBooked] = useState<string[]>([])

  const cityRestaurants = RESTAURANTS.filter(r =>
    r.cities.includes(guest.city) || guest.city === ''
  ).slice(0, 5)

  function reserve(r: Restaurant, party = '2 personas', time = '9:00 PM') {
    const booking: Booking = {
      id: `restaurant-${r.id}-${Date.now()}`,
      type: 'restaurant',
      title: r.name,
      subtitle: `${r.cuisine} · ${r.zone}`,
      datetime: `Hoy · ${time}`,
      detail: `${party}`,
      confirmedAt: Date.now(),
    }
    addBooking(booking)
    setBooked(prev => [...prev, r.id])
    onBooked(`Perfecto. Mesa en ${r.name} reservada para ${party} a las ${time}. Recibirás confirmación en breve.`)
  }
  // Expose reserve so parent can confirm after collecting party size
  void reserve

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
        Mejores mesas · {guest.city || 'CDMX'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
        {cityRestaurants.map(r => {
          const isBooked = booked.includes(r.id)
          return (
            <div key={r.id}
              style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: `1px solid ${isBooked ? 'rgba(200,255,0,0.25)' : 'rgba(255,255,255,0.08)'}`, background: '#0a0a0a', transition: 'border-color 0.2s' }}>
              <div style={{ position: 'relative', height: 110 }}>
                <img src={r.img} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, transparent 55%)' }} />
                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 100, padding: '2px 8px' }}>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)', fontFamily: '"Anton", sans-serif', letterSpacing: '0.1em' }}>{r.price}</span>
                </div>
              </div>
              <div style={{ padding: '10px 12px 14px' }}>
                <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#FFF', marginBottom: 2 }}>{r.name}</div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{r.cuisine}</div>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 10, lineHeight: 1.4 }}>{r.zone}</div>
                {isBooked ? (
                  <div style={{ fontFamily: '"Anton", sans-serif', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8FF00', textAlign: 'center' }}>✓ RESERVADO</div>
                ) : (
                  <button onClick={() => { onAskParty(r) }}
                    style={{ width: '100%', fontFamily: '"Anton", sans-serif', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', background: '#C8FF00', color: '#000', border: 'none', borderRadius: 100, padding: '7px 0', cursor: 'pointer' }}>
                    RESERVAR MESA
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
