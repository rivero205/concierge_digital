import { useState } from 'react'
import { Mail, Twitter, Github, Menu, X } from 'lucide-react'

const HERO_MEDIA = '/videos/hero5.png'
const isVideo = (src: string) => /\.(mp4|webm|ogg|mov)$/i.test(src)
const NAV_LINKS = ['Home', 'Experiences', 'Stadiums', 'Hotels', 'Contact']

function SocialButtons({ className = '' }: { className?: string }) {
  return (
    <>
      {[Mail, Twitter, Github].map((Icon, i) => (
        <button
          key={i}
          className={`liquid-glass rounded-[1rem] w-14 h-14 flex items-center justify-center text-cream hover:bg-white/10 transition-colors duration-200 anim-pop-in delay-${i + 5} ${className}`}
        >
          <Icon size={20} />
        </button>
      ))}
    </>
  )
}

export default function HeroSection() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <section className="relative w-full h-screen overflow-hidden rounded-b-[32px]">

      {/* Background — slow zoom out on load */}
      <div className="absolute inset-0 anim-zoom-out">
        {isVideo(HERO_MEDIA) ? (
          <video className="w-full h-full object-cover" src={HERO_MEDIA} autoPlay loop muted playsInline />
        ) : (
          <img
            className="w-full h-full object-cover"
            src={HERO_MEDIA}
            alt=""
            loading="eager"
            decoding="sync"
            fetchPriority="high"
          />
        )}
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none z-10" />

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col px-5 py-5">
          <div className="flex items-center justify-between">
            <span className="font-grotesk text-[16px] uppercase text-cream tracking-wide">
              Concierge.Mx
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              className="liquid-glass rounded-[1rem] w-11 h-11 flex items-center justify-center text-cream"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 flex flex-col justify-center gap-5">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="font-grotesk text-[38px] uppercase text-cream hover:text-neon transition-colors duration-200 leading-none"
                onClick={() => setMenuOpen(false)}
              >
                {link}
              </a>
            ))}
          </nav>

          <div className="flex gap-3 pb-4">
            <SocialButtons />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col max-w-[1831px] mx-auto px-5 sm:px-8 lg:px-12">

        {/* Header */}
        <div className="flex items-center justify-between pt-5 lg:pt-7">

          <span className="font-grotesk text-[16px] uppercase text-cream tracking-wide anim-fade-in delay-1">
            Concierge.Mx
          </span>

          <nav className="hidden lg:block liquid-glass rounded-[28px] px-[52px] py-[24px] anim-slide-down delay-2">
            <ul className="flex items-center gap-8">
              {NAV_LINKS.map((link, i) => (
                <li key={link} className={`anim-fade-in delay-${i + 3}`}>
                  <a href="#" className="font-grotesk text-[13px] uppercase text-cream hover:text-neon transition-colors duration-200">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden lg:flex flex-row gap-3">
            <SocialButtons />
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden liquid-glass rounded-[1rem] w-11 h-11 flex items-center justify-center text-cream anim-fade-in delay-2"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Hero content */}
        <div className="flex-1 flex flex-col justify-start pt-12 lg:justify-end lg:pt-0 lg:pb-20">
          <div className="relative lg:ml-32 max-w-full lg:max-w-[780px]">

            <h1 className="font-grotesk uppercase text-cream leading-[1.05] lg:leading-[1] text-[40px] sm:text-[60px] md:text-[75px] lg:text-[90px]">
              <span className="block overflow-hidden">
                <span className="block anim-reveal-up delay-3">Discover México</span>
              </span>
              <span className="block overflow-hidden">
                <span className="block anim-reveal-up delay-4">beyond ( the ) game</span>
              </span>
              <span className="block overflow-hidden">
                <span className="block anim-reveal-up delay-5">it awaits you</span>
              </span>
            </h1>

            {/* Cursive accent */}
            <span className="block mt-3 sm:absolute sm:right-0 sm:top-4 sm:mt-0 sm:-right-4 md:-right-8 font-condiment text-neon blend-exclusion -rotate-1 text-[20px] sm:text-[32px] md:text-[40px] lg:text-[48px] pointer-events-none select-none anim-accent delay-6">
              World Cup 2026
            </span>
          </div>

          {/* Mobile social */}
          <div className="flex lg:hidden justify-center gap-4 mt-auto pb-10">
            <SocialButtons />
          </div>
        </div>
      </div>
    </section>
  )
}
