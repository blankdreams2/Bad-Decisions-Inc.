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
    <div className="flex h-dvh flex-col overflow-hidden bg-midnight">
      <nav className="container mx-auto flex shrink-0 items-center justify-between px-3 pt-3 sm:px-6 sm:pt-5">
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
        <Link
          href="/"
          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
        >
          Back Home
        </Link>
      </nav>

      <header className="container mx-auto shrink-0 px-3 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-3">
        <h1 className="text-glow-white font-syne text-2xl font-extrabold italic tracking-tight text-white sm:text-3xl md:text-4xl">
          Minigames
        </h1>
        <p className="mt-1 max-w-lg text-xs leading-relaxed text-ash/60 sm:text-sm">
          Five quick-fire challenges. The loser? Well... they make a bad decision.
        </p>
      </header>

      <section className="container mx-auto min-h-0 flex-1 px-3 py-2 sm:px-6 sm:py-3">
        <div className="grid h-full auto-rows-fr grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
          {GAMES.map((game, i) => {
            const style = ACCENT_STYLES[game.accent]
            return (
              <div
                key={game.title}
                className={`group relative overflow-hidden rounded-xl border bg-surface transition-all duration-300 ${style.border} ${style.glow}`}
              >
                <div className={`absolute inset-x-0 top-0 h-0.5 bg-linear-to-r ${accentBg[game.accent]}`} />
                <div className="relative flex h-full flex-col p-3 sm:p-4">
                  <span className={`font-syne absolute top-2 right-3 text-3xl font-black sm:text-4xl ${accentNumber[game.accent]}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className={`mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border sm:mb-3 sm:h-10 sm:w-10 ${style.icon}`}>
                    <GameIcon index={i} className={style.title} />
                  </div>
                  <h2 className={`font-syne text-sm font-bold tracking-tight sm:text-base ${style.title}`}>
                    {game.title}
                  </h2>
                  <p className="mt-1 text-[10px] leading-snug text-ash/60 sm:mt-1.5 sm:text-xs sm:leading-relaxed">
                    {game.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="container mx-auto flex shrink-0 flex-col items-center gap-1 border-t border-white/5 px-3 py-2 sm:flex-row sm:justify-between sm:px-6 sm:py-3">
        <span className="text-[10px] text-smoke/30 sm:text-xs">&copy; 2026 Bad Decisions Inc</span>
        <div className="flex gap-3 text-[10px] text-smoke/30 sm:gap-4 sm:text-xs">
          <Link href="/terms" className="transition-colors hover:text-ash">Terms</Link>
          <Link href="/privacy" className="transition-colors hover:text-ash">Privacy</Link>
          <Link href="/contact" className="transition-colors hover:text-ash">Contact</Link>
        </div>
      </div>
    </div>
  )
}

function GameIcon({ index, className }: { index: number; className: string }) {
  const icons = [
    <svg key="shake" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2" /><path d="M6 16v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" /><rect x="6" y="8" width="12" height="8" rx="1" /><path d="M2 10l2 2-2 2" /><path d="M22 10l-2 2 2 2" /></svg>,
    <svg key="flip" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18" /><path d="M8 7l4-4 4 4" /><path d="M8 17l4 4 4-4" /></svg>,
    <svg key="tap" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
    <svg key="kanpai" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>,
    <svg key="chopstick" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2l7 20" /><path d="M21 2l-7 20" /></svg>,
  ]
  return <span className={className}>{icons[index]}</span>
}
