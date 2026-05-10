import { Mail, Twitter, Github } from 'lucide-react'

const CTA_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4'

const SOCIAL_ICONS = [Mail, Twitter, Github]

export default function CTASection() {
  return (
    <section className="relative w-full bg-background">
      {/* Background video — native aspect ratio, not object-cover */}
      <video
        className="w-full h-auto block"
        src={CTA_VIDEO}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Text overlay — absolute over video */}
      <div className="absolute inset-0 flex items-center justify-end lg:pr-[20%] lg:pl-[15%] pr-6 pl-6">
        <div className="relative text-right">
          {/* Cursive "Go beyond" accent */}
          <span
            className="absolute -top-8 sm:-top-10 md:-top-12 lg:-top-16 left-0 font-condiment text-neon blend-exclusion opacity-90 pointer-events-none select-none text-[17px] sm:text-[28px] md:text-[44px] lg:text-[68px]"
          >
            Go beyond
          </span>

          {/* Main CTA heading */}
          <div className="font-grotesk uppercase text-cream text-[16px] sm:text-[24px] md:text-[40px] lg:text-[60px] leading-[1.05] lg:leading-[1]">
            <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-12">JOIN US.</div>
            <div>REVEAL WHAT'S HIDDEN.</div>
            <div>DEFINE WHAT'S NEXT.</div>
            <div>FOLLOW THE SIGNAL.</div>
          </div>
        </div>
      </div>

      {/* Bottom-left social icons — absolute */}
      <div
        className="absolute left-[8%] bottom-[12%] sm:bottom-[14%] md:bottom-[16%] lg:bottom-[20%]"
      >
        <div
          className="liquid-glass rounded-[0.5rem] sm:rounded-[0.75rem] md:rounded-[1rem] lg:rounded-[1.25rem] overflow-hidden flex flex-col"
        >
          {SOCIAL_ICONS.map((Icon, i) => (
            <button
              key={i}
              className={`
                flex items-center justify-center text-cream hover:bg-white/10 transition-colors duration-200
                w-[14vw] sm:w-[14.375rem] md:w-[10.78125rem] lg:w-[16.77rem]
                h-[14vw] sm:h-[4rem] md:h-[3rem] lg:h-[5rem]
                ${i < SOCIAL_ICONS.length - 1 ? 'border-b border-white/10' : ''}
              `}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
