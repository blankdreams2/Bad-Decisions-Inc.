export type GameAccent = 'neon' | 'electric' | 'gold' | 'royal'

export interface Game {
  title: string
  desc: string
  accent: GameAccent
  emoji: string
  model: string
  image?: string
}

export const GAMES: Game[] = [
  {
    title: 'Rebel Shake',
    desc: 'Rebel Shake: 5-second synced countdown, then full speed phone shaking for 15 seconds.',
    accent: 'neon',
    emoji: '📱',
    model: '/phone.glb',
  },
  {
    title: 'Vegas Pan Flip',
    desc: 'Vegas Pan Flip: flick your phone to launch the egg and stack flips on the live race track.',
    accent: 'electric',
    emoji: '🍳',
    model: '/pan3.glb',
  },
  {
    title: 'Poker Chip Tap',
    desc: 'Poker Chip Tap: wait for countdown, then spam taps for the highest score before time runs out.',
    accent: 'gold',
    emoji: '🎰',
    model: '/coin.glb',
  },
  {
    title: 'Kanpai Timing',
    desc: 'Tap on each beat and lock in the lowest average timing error to win.',
    accent: 'royal',
    emoji: '🍻',
    model: '/beer.glb',
  },
  {
    title: 'Chopstick Catch',
    desc: 'Catch falling sushi at the right height and stack points before the timer ends.',
    accent: 'electric',
    emoji: '🥢',
    model: '/sushi.glb',
  },
]

export const ACCENT_STYLES: Record<GameAccent, {
  border: string
  title: string
  icon: string
  glow: string
}> = {
  neon: {
    border: 'border-neon/15 hover:border-neon/40',
    title: 'text-neon',
    icon: 'border-neon/25 bg-neon/10',
    glow: 'hover:shadow-[0_0_30px_rgba(255,45,107,0.08)]',
  },
  electric: {
    border: 'border-electric/15 hover:border-electric/40',
    title: 'text-electric',
    icon: 'border-electric/25 bg-electric/10',
    glow: 'hover:shadow-[0_0_30px_rgba(0,229,255,0.08)]',
  },
  gold: {
    border: 'border-gold/15 hover:border-gold/40',
    title: 'text-gold-light',
    icon: 'border-gold/25 bg-gold/10',
    glow: 'hover:shadow-[0_0_30px_rgba(245,184,0,0.08)]',
  },
  royal: {
    border: 'border-royal/15 hover:border-royal/40',
    title: 'text-royal',
    icon: 'border-royal/25 bg-royal/10',
    glow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.08)]',
  },
}

export const FLOATING_CARDS = [
  { gameIdx: 0, x: '3%',  y: '6%',  rotate: -15, scale: 0.88 },
  { gameIdx: 1, x: '70%', y: '2%',  rotate: 10,  scale: 0.82 },
  { gameIdx: 2, x: '82%', y: '35%', rotate: -8,  scale: 0.92 },
  { gameIdx: 3, x: '6%',  y: '50%', rotate: 14,  scale: 0.85 },
  { gameIdx: 4, x: '65%', y: '60%', rotate: -12, scale: 0.9  },
  { gameIdx: 0, x: '35%', y: '75%', rotate: 6,   scale: 0.8  },
  { gameIdx: 2, x: '20%', y: '25%', rotate: -5,  scale: 0.86 },
  { gameIdx: 3, x: '50%', y: '85%', rotate: 18,  scale: 0.78 },
]

export const CARD_FAN = [
  { src: '/images/Group 48095810.svg', rotation: -35, translateX: -70, translateY: -5, delay: 0, startRotation: -10, startX: -20 },
  { src: '/images/Group 48095811.svg', rotation: -15, translateX: -40, translateY: -20, delay: 100, startRotation: -5, startX: -10 },
  { src: '/images/Group 48095812.svg', rotation: 1, translateX: 0, translateY: -20, delay: 200, startRotation: 0, startX: 0 },
  { src: '/images/Group 48095813.svg', rotation: 10, translateX: 50, translateY: -10, delay: 300, startRotation: 5, startX: 10 },
  { src: '/images/Group 48095814.svg', rotation: 35, translateX: 72, translateY: 12, delay: 400, startRotation: 10, startX: 20 },
]
