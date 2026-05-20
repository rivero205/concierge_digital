// src/context/GuestContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Booking = {
  id: string
  type: 'transport' | 'restaurant'
  title: string
  subtitle: string
  datetime: string
  detail: string
  confirmedAt: number
}

export type GuestProfile = {
  language: string
  title: string
  firstName: string
  lastName: string
  city: string
  hotel: string
  interests: string[]
  matches: string[]
  bookings: Booking[]
  onboardingDone: boolean
}

const DEFAULT_PROFILE: GuestProfile = {
  language: 'es',
  title: '',
  firstName: '',
  lastName: '',
  city: '',
  hotel: '',
  interests: [],
  matches: ['m1'],
  bookings: [],
  onboardingDone: false,
}

type GuestContextType = {
  guest: GuestProfile
  setGuest: (g: GuestProfile) => void
  addBooking: (b: Booking) => void
  removeBooking: (id: string) => void
  completeOnboarding: (data: Omit<GuestProfile, 'bookings' | 'onboardingDone'>) => void
}

const GuestContext = createContext<GuestContextType | null>(null)

const STORAGE_KEY = 'concierge_guest'

export function GuestProvider({ children }: { children: ReactNode }) {
  const [guest, setGuestState] = useState<GuestProfile>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE
    } catch {
      return DEFAULT_PROFILE
    }
  })

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(guest))
  }, [guest])

  function setGuest(g: GuestProfile) {
    setGuestState(g)
  }

  function addBooking(b: Booking) {
    setGuestState(prev => ({ ...prev, bookings: [b, ...prev.bookings] }))
  }

  function removeBooking(id: string) {
    setGuestState(prev => ({ ...prev, bookings: prev.bookings.filter(b => b.id !== id) }))
  }

  function completeOnboarding(data: Omit<GuestProfile, 'bookings' | 'onboardingDone'>) {
    setGuestState(prev => ({ ...prev, ...data, onboardingDone: true }))
  }

  return (
    <GuestContext.Provider value={{ guest, setGuest, addBooking, removeBooking, completeOnboarding }}>
      {children}
    </GuestContext.Provider>
  )
}

export function useGuest() {
  const ctx = useContext(GuestContext)
  if (!ctx) throw new Error('useGuest must be used inside GuestProvider')
  return ctx
}
