import { useInView } from '../hooks/useInView'

export default function CollectionSection({ onActivate }: { onActivate?: () => void }) {
  const { ref, inView } = useInView(0.1)
  return (
    <section className="relative w-full min-h-screen bg-[#080808] flex flex-col overflow-hidden">

      {/* Top fade — comes from section 2 */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black via-black/60 to-transparent pointer-events-none z-[4]" />

      {/* Ribbons */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        <div className="absolute" style={{
          bottom: '-15%', left: '-5%',
          width: '55%', height: '130%',
          background: 'linear-gradient(135deg, rgba(20,35,75,0.45) 0%, rgba(15,25,55,0.25) 40%, transparent 70%)',
          transform: 'rotate(-15deg)',
          filter: 'blur(35px)',
        }} />
        <div className="absolute" style={{
          top: '-20%', left: '-10%',
          width: '45%', height: '80%',
          background: 'linear-gradient(135deg, rgba(10,30,80,0.30) 0%, transparent 65%)',
          transform: 'rotate(-15deg)',
          filter: 'blur(45px)',
        }} />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 z-[2]" />

      {/* Heading — top, pointer-events-none so button below is clickable */}
      <div ref={ref} className="absolute top-0 left-0 right-0 z-[5] pointer-events-none max-w-[1831px] mx-auto w-full px-5 sm:px-8 lg:px-12 py-16 md:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8 w-full">
          <div className={`scroll-fade-up ${inView ? 'is-visible' : ''}`}>
            <h2 className="font-grotesk uppercase text-cream leading-[1] text-[32px] sm:text-[45px] md:text-[52px] lg:text-[60px]">
              Explore the
            </h2>
            <div className="ml-8 mt-1">
              <h2 className="font-grotesk uppercase text-cream leading-[1] text-[32px] sm:text-[45px] md:text-[52px] lg:text-[60px]">
                <span className="font-condiment text-neon normal-case">best</span>
                {' '}
                <span>of México</span>
              </h2>
            </div>
          </div>
          <div className={`hidden sm:block flex-shrink-0 scroll-fade-up stagger-2 ${inView ? 'is-visible' : ''}`}>
            <div className="flex items-end gap-2">
              <span className="font-grotesk uppercase text-cream text-[32px] sm:text-[45px] md:text-[52px] lg:text-[60px] leading-none">SEE</span>
              <div className="flex flex-col leading-none pb-1">
                <span className="font-grotesk uppercase text-cream text-[20px] sm:text-[28px] md:text-[32px] lg:text-[36px]">ALL</span>
                <span className="font-grotesk uppercase text-cream text-[20px] sm:text-[28px] md:text-[32px] lg:text-[36px]">SERVICES</span>
              </div>
            </div>
            <div className="w-full h-[6px] sm:h-[8px] lg:h-[10px] bg-neon mt-2" />
          </div>
        </div>
      </div>

      {/* Image + button — z-[3], fully interactive */}
      <div className="flex-1 flex flex-col items-center justify-center gap-0 relative z-[3] py-16">
        <img
          src="/videos/collection1.png"
          alt=""
          className={`w-[80%] sm:w-[65%] lg:w-[50%] max-h-[70vh] object-contain scroll-fade-up stagger-3 ${inView ? 'is-visible' : ''}`}
        />
        <button
          style={{ boxShadow: '0 4px 24px rgba(255,255,255,0.12)', transition: 'all 0.3s ease-out' }}
          className="bg-white rounded-full px-8 sm:px-12 py-3 sm:py-4 mt-4 sm:-mt-4"
          onMouseEnter={e => {
            const b = e.currentTarget
            b.style.boxShadow = '0 0 40px rgba(255,255,255,0.35), 0 0 80px rgba(255,255,255,0.15)'
            b.style.transform = 'scale(1.04)'
          }}
          onMouseLeave={e => {
            const b = e.currentTarget
            b.style.boxShadow = '0 4px 24px rgba(255,255,255,0.12)'
            b.style.transform = 'scale(1)'
          }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.04)' }}
          onClick={onActivate}
        >
          <span className="font-grotesk uppercase text-background text-[15px] sm:text-[17px] tracking-[0.2em]">
            Activate Concierge
          </span>
        </button>
      </div>
    </section>
  )
}
