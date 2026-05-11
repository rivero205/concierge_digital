import { useEffect, useState } from 'react'
import HeroSection from './components/HeroSection'
import AboutSection from './components/AboutSection'
import CollectionSection from './components/CollectionSection'
import ConciergeChat from './components/ConciergeChat'
import ConciergeView from './components/ConciergeView'

export default function App() {
  const [showConcierge, setShowConcierge] = useState(
    () => window.location.hash === '#concierge'
  )

  useEffect(() => {
    const onPop = () => setShowConcierge(window.location.hash === '#concierge')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function openConcierge() {
    history.pushState(null, '', '#concierge')
    setShowConcierge(true)
  }

  function closeConcierge() {
    history.pushState(null, '', window.location.pathname)
    setShowConcierge(false)
  }

  return (
    <div className="relative bg-black min-h-screen text-cream">

      {/* Fixed full-screen texture overlay */}
      <div
        className="fixed inset-0 z-50 pointer-events-none"
        style={{
          backgroundImage: 'url(/texture.png)',
          backgroundSize: '256px 256px',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'lighten',
          opacity: 0.2,
        }}
      />

      <HeroSection />
      <AboutSection />
      <CollectionSection onActivate={openConcierge} />
      <ConciergeChat onOpen={openConcierge} hidden={showConcierge} />
      {showConcierge && <ConciergeView onClose={closeConcierge} />}
    </div>
  )
}
