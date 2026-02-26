'use client'

import BdiLogo from '@/components/common/bdiLogo'
import HomeCards from '@/components/home/home-card'
import { WarpBackground } from '@/components/ui/warp-background'
import { useClerk, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const Hero = () => {
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()

  return (
    <div className="h-dvh w-full overflow-hidden bg-midnight">
      <WarpBackground
        className="relative h-full overflow-hidden rounded-none border-0 p-0 bg-midnight"
        gridColor="rgba(245, 184, 0, 0.09)"
        beamSize={5}
        beamsPerSide={4}
        beamDuration={6}
        beamDelayMax={4}
        perspective={100}
      >
        {/* Ambient color glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gold/4 blur-[150px]" />
          <div className="absolute top-[40%] -left-60 h-[400px] w-[400px] rounded-full bg-royal/5 blur-[130px]" />
          <div className="absolute top-[60%] -right-60 h-[400px] w-[400px] rounded-full bg-neon/3 blur-[130px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col">
          {/* nav */}
          <nav className="container mx-auto flex items-center justify-between px-3 pt-3 sm:px-6 sm:pt-5">
            {/* left */}
            <Link href="/" className="group flex items-center gap-2 sm:gap-3">
              <BdiLogo multicolor className="transition-transform duration-300 group-hover:scale-110" size={28} />
              <div className="hidden min-[420px]:flex flex-col leading-none">
                <span className="font-syne text-xs font-extrabold tracking-wide text-white transition-all duration-300 group-hover:text-gold group-hover:glow-gold-bright sm:text-sm md:text-lg">
                  BAD DECISIONS
                </span>
                <span className="font-syne text-[8px] tracking-[0.2em] text-smoke transition-all duration-300 group-hover:text-gold-dim group-hover:glow-gold-bright sm:text-[10px]">
                  INCORPORATED
                </span>
              </div>
            </Link>

            {/* right */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link
                href="/games"
                className="flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-[11px] font-semibold text-gold-light transition-all duration-300 hover:bg-gold/20 hover:shadow-[0_0_20px_rgba(245,184,0,0.15)] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:h-[18px] sm:w-[18px]">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M6 12h4M8 10v4" />
                  <circle cx="17" cy="10" r="1" fill="currentColor" />
                  <circle cx="15" cy="13" r="1" fill="currentColor" />
                </svg>
                <span className="hidden min-[360px]:inline">Browse Games</span>
              </Link>

              {/* auth */}
              {user ? (
                <>
                  <button
                    className="flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-[11px] font-semibold text-gold-light transition-all duration-300 hover:bg-gold/20 hover:shadow-[0_0_20px_rgba(245,184,0,0.15)] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                    onClick={() => router.push('/host')}
                  >
                    Dashboard
                  </button>
                  <button
                    className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-ash transition-colors hover:bg-white/5 sm:px-4 sm:py-2 sm:text-sm"
                    onClick={() => void signOut()}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  className="flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-[11px] font-semibold text-gold-light transition-all duration-300 hover:bg-gold/20 hover:shadow-[0_0_20px_rgba(245,184,0,0.15)] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                  onClick={() => router.push('/sign-in')}
                >
                  Login
                </button>
              )}
            </div>
          </nav>

          {/* hero center */}
          <section className="flex flex-1 flex-col items-center justify-center px-3 sm:px-4">
            <h1 className="text-glow-gold text-center text-3xl font-extrabold tracking-tight min-[375px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="text-white">BAD</span>{' '}
              <span className="text-gold">DECISIONS</span>
            </h1>
            <p className="font-syne mt-1 text-center text-lg tracking-[0.3em] text-smoke min-[375px]:text-lg">
              INCORPORATED
            </p>

            <div className="mt-16 w-full max-w-3xl">
              <HomeCards />
            </div>

            <p className="mt-1.5 text-center text-[11px] tracking-wide text-ash/70 sm:mt-2 sm:text-sm">
              indecisive? put it all on{' '}
              <span className="font-semibold text-neon">red</span>
            </p>

            <div className="mt-4 sm:mt-5">
              <button
                className="group relative cursor-pointer overflow-hidden rounded-lg bg-gold px-7 py-2.5 font-syne text-xs font-bold tracking-wide text-midnight transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,184,0,0.35)] sm:px-12 sm:py-3.5 sm:text-base"
                onClick={() => router.push(user ? '/host' : '/sign-in')}
              >
                <span className="relative z-10">{user ? 'OPEN DASHBOARD' : 'START PLAYING'}</span>
                <div className="absolute inset-0 bg-gold-light opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </button>
            </div>
          </section>

          {/* Footer */}
          <div className="container mx-auto flex w-full flex-col items-center gap-1 px-3 pb-3 sm:flex-row sm:justify-between sm:px-6 sm:pb-4">
            <span className="text-[10px] text-smoke/30 sm:text-xs">© 2026 Bad Decisions Inc</span>
            <p className="text-center text-[10px] leading-relaxed text-smoke/40 sm:text-xs">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-2 transition-colors hover:text-ash">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline underline-offset-2 transition-colors hover:text-ash">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </WarpBackground>
    </div>
  )
}

export default Hero
