import { useEffect, useRef, useState } from 'react'
import { useInView } from '../hooks/useInView'

const ABOUT_MEDIA = '/videos/about1.png'
const isVideo = (src: string) => /\.(mp4|webm|ogg|mov)$/i.test(src)

function Counter({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView()
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(tick)
      else setCount(target)
    }
    requestAnimationFrame(tick)
  }, [inView, target, duration])

  return <span ref={ref}>{count}</span>
}

export default function AboutSection() {
  const { ref: sectionRef, inView } = useInView(0.1)

  return (
    <section className="relative w-full min-h-screen overflow-hidden">
      {isVideo(ABOUT_MEDIA) ? (
        <video className="absolute inset-0 w-full h-full object-cover" src={ABOUT_MEDIA} autoPlay loop muted playsInline />
      ) : (
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src={ABOUT_MEDIA}
          alt=""
          loading="eager"
          decoding="async"
        />
      )}

      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/60 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none z-10" />

      <div
        ref={sectionRef}
        className="relative z-10 h-full flex flex-col justify-between max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-12 py-20 md:py-28 min-h-screen"
      >
        {/* Top row */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10">

          {/* Left: heading */}
          <div className={`relative scroll-fade-up ${inView ? 'is-visible' : ''}`}>
            <h2 className="font-grotesk uppercase text-cream leading-[1] text-[32px] sm:text-[45px] md:text-[52px] lg:text-[60px]">
              Your guide<br />to México
            </h2>
            <span className="block mt-2 lg:absolute lg:bottom-5 lg:mt-0 lg:-right-4 font-condiment text-neon blend-exclusion rotate-[-3deg] text-[26px] sm:text-[36px] md:text-[44px] lg:text-[52px] pointer-events-none select-none">
              Welcome
            </span>
          </div>

          {/* Right: body */}
          <p className={`font-grotesk text-[13px] lg:text-[14px] uppercase text-cream max-w-full sm:max-w-[300px] leading-loose tracking-wider scroll-fade-up stagger-2 ${inView ? 'is-visible' : ''}`}>
            Your digital concierge for the 2026 World Cup. Hotels, stadiums, experiences and everything you need to make the most of México.
          </p>
        </div>

        {/* Bottom row — stats */}
        <div className="flex flex-row justify-between items-end mt-auto">
          <div className={`flex flex-col gap-1 scroll-fade-up stagger-2 ${inView ? 'is-visible' : ''}`}>
            <span className="font-grotesk uppercase text-cream text-[40px] sm:text-[56px] lg:text-[72px] leading-none">
              <Counter target={32} />
            </span>
            <span className="font-grotesk uppercase text-cream/40 text-[11px] tracking-[0.2em]">Nations</span>
          </div>
          <div className={`flex flex-col gap-1 items-center scroll-fade-up stagger-3 ${inView ? 'is-visible' : ''}`}>
            <span className="font-grotesk uppercase text-cream text-[40px] sm:text-[56px] lg:text-[72px] leading-none">
              <Counter target={3} duration={1200} />
            </span>
            <span className="font-grotesk uppercase text-cream/40 text-[11px] tracking-[0.2em]">Host Cities</span>
          </div>
          <div className={`flex flex-col gap-1 items-end scroll-fade-up stagger-4 ${inView ? 'is-visible' : ''}`}>
            <span className="font-grotesk uppercase text-cream text-[40px] sm:text-[56px] lg:text-[72px] leading-none">
              <Counter target={2026} duration={2000} />
            </span>
            <span className="font-grotesk uppercase text-cream/40 text-[11px] tracking-[0.2em]">The World's Stage</span>
          </div>
        </div>
      </div>
    </section>
  )
}
