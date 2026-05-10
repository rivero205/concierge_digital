import { Bell } from 'lucide-react'

export default function ConciergeChat({ onOpen, hidden }: { onOpen: () => void; hidden?: boolean }) {
  if (hidden) return null

  return (
    <button
      onClick={onOpen}
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 1000,
        width: 56, height: 56, borderRadius: '50%',
        background: '#6FFF00', border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 24px rgba(111,255,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.08)'
        e.currentTarget.style.boxShadow = '0 0 40px rgba(111,255,0,0.5)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(111,255,0,0.35)'
      }}
    >
      <Bell size={22} color="#000000" strokeWidth={2} />
    </button>
  )
}
