import { ACCENT_STYLES, GAMES } from '@/data/hero-data'
import BdiLogo from '@/components/common/bdiLogo'
import Link from 'next/link'

const accentBg: Record<string, string> = {
  neon: 'from-neon/10 to-neon/3',
  electric: 'from-electric/10 to-electric/3',
  gold: 'from-gold/10 to-gold/3',
  royal: 'from-royal/10 to-royal/3',
}

const accentNumber: Record<string, string> = {
  neon: 'text-neon/20',
  electric: 'text-electric/20',
  gold: 'text-gold/20',
  royal: 'text-royal/20',
}

export default function GamesPage() {
  return (
    <div className="min-h-dvh bg-midnight">
      {/* Nav */}
      <nav className="container mx-auto flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-6">
        <Link href="/" className="group flex items-center gap-2 sm:gap-3">
          <BdiLogo className="text-gold transition-transform duration-300 group-hover:scale-110" size={28} />
          <div className="flex flex-col leading-none">
            <span className="font-syne text-xs font-extrabold tracking-wide text-gold-light transition-all duration-300 group-hover:text-gold group-hover:glow-gold-bright sm:text-sm md:text-lg">
              BAD DECISIONS
            </span>
            <span className="font-syne text-[8px] tracking-[0.2em] text-smoke transition-all duration-300 group-hover:text-gold-dim group-hover:glow-gold-bright sm:text-[10px]">
              INCORPORATED
            </span>
          </div>
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-ash transition-colors hover:bg-white/5 sm:px-4 sm:py-2 sm:text-sm"
        >
          Back Home
        </Link>
      </nav>

      {/* Header */}
      <header className="container mx-auto px-4 pt-10 pb-4 sm:px-6 sm:pt-16 sm:pb-6">
        <h1 className="text-glow-gold font-syne text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
          Mini<span className="text-gold">games</span>
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ash/70 sm:text-base">
          Five quick-fire challenges. The loser? Well... they make a bad decision.
        </p>
      </header>

      {/* Games Grid */}
      <section className="container mx-auto grid gap-4 px-4 pb-12 sm:grid-cols-2 sm:gap-5 sm:px-6 lg:grid-cols-3">
        {GAMES.map((game, i) => {
          const style = ACCENT_STYLES[game.accent]
          return (
            <div
              key={game.title}
              className={`group relative overflow-hidden rounded-2xl border bg-surface transition-all duration-300 ${style.border} ${style.glow}`}
            >
              {/* Gradient top accent */}
              <div className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${accentBg[game.accent]}`} />

              <div className="relative p-5 sm:p-6">
                {/* Number */}
                <span className={`font-syne absolute top-3 right-4 text-5xl font-black ${accentNumber[game.accent]} sm:text-6xl`}>
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Icon circle */}
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${style.icon}`}>
                  <GameIcon index={i} className={style.title} />
                </div>

                <h2 className={`font-syne text-lg font-bold tracking-tight sm:text-xl ${style.title}`}>
                  {game.title}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-ash/70">
                  {game.desc}
                </p>
              </div>
            </div>
          )
        })}
      </section>

      {/* Footer */}
      <footer className="container mx-auto flex flex-col items-center gap-2 border-t border-white/5 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
        <span className="text-xs text-smoke/30">© 2026 Bad Decisions Inc</span>
        <div className="flex gap-4 text-xs text-smoke/30">
          <Link href="/terms" className="transition-colors hover:text-ash">Terms</Link>
          <Link href="/privacy" className="transition-colors hover:text-ash">Privacy</Link>
          <Link href="/contact" className="transition-colors hover:text-ash">Contact</Link>
        </div>
      </footer>
    </div>
  )
}

function GameIcon({ index, className }: { index: number; className: string }) {
  const icons = [
    // Shake
    <svg key="shake" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2" /><path d="M6 16v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" /><rect x="6" y="8" width="12" height="8" rx="1" /><path d="M2 10l2 2-2 2" /><path d="M22 10l-2 2 2 2" />
    </svg>,
    // Flip
    <svg key="flip" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" /><path d="M8 7l4-4 4 4" /><path d="M8 17l4 4 4-4" />
    </svg>,
    // Tap
    <svg key="tap" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>,
    // Kanpai
    <svg key="kanpai" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>,
    // Chopstick
    <svg key="chopstick" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2l7 20" /><path d="M21 2l-7 20" />
    </svg>,
  ]
  return <span className={className}>{icons[index]}</span>
}
