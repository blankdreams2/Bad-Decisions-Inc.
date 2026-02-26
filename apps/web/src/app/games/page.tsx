'use client'

import { ACCENT_STYLES, GAMES } from '@/data/hero-data'
import BdiLogo from '@/components/common/bdiLogo'
import { Pointer } from '@/components/ui/pointer'
import Link from 'next/link'

const accentBg: Record<string, string> = {
  neon: 'bg-neon/8',
  electric: 'bg-electric/8',
  gold: 'bg-gold/8',
  royal: 'bg-royal/8',
}

const accentNumber: Record<string, string> = {
  neon: 'text-neon/15',
  electric: 'text-electric/15',
  gold: 'text-gold/15',
  royal: 'text-royal/15',
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

      <section className="container mx-auto flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-4 pb-4 sm:px-6 sm:pt-6">
        <div className="shrink-0">
          <h1 className="text-glow-white font-syne text-2xl font-extrabold italic tracking-tight text-white sm:text-3xl md:text-4xl">
            Minigames
          </h1>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-ash/60 sm:text-sm">
            Five quick-fire challenges. The loser? Well... they make a bad decision.
          </p>
        </div>

        <div className="mt-4 grid flex-1 grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:mt-5 sm:gap-4 lg:grid-cols-5">
          {GAMES.map((game, i) => {
            const style = ACCENT_STYLES[game.accent]
            return (
              <div
                key={game.title}
                className={`group/card relative flex flex-col overflow-hidden rounded-2xl border bg-surface transition-all duration-300 ${style.border} ${style.glow}`}
              >
                <Pointer>
                  <span className="text-2xl">{game.emoji}</span>
                </Pointer>

                <div className={`flex flex-1 items-center justify-center py-6 sm:py-8 ${accentBg[game.accent]}`}>
                  <span className="text-5xl transition-transform duration-300 group-hover/card:scale-125 sm:text-6xl lg:text-7xl">
                    {game.emoji}
                  </span>
                </div>

                <div className="relative shrink-0 p-3 sm:p-4">
                  <span className={`font-syne absolute top-2 right-3 text-2xl font-black sm:text-3xl ${accentNumber[game.accent]}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
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
