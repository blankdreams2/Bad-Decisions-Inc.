
export type Game = 'shake' | 'flip' | 'tap' | 'kanpai' | 'chopstick'

export const GAME_META: Record<Game, { label: string; accent: string; border: string; bg: string; dot: string }> = {
  shake:     { label: 'Rebel Shake',     accent: 'text-neon',     border: 'border-neon/20',     bg: 'bg-neon/8',     dot: 'bg-neon' },
  flip:      { label: 'Vegas Pan Flip',  accent: 'text-electric', border: 'border-electric/20', bg: 'bg-electric/8', dot: 'bg-electric' },
  tap:       { label: 'Poker Chip Tap',  accent: 'text-gold-light', border: 'border-gold/20',   bg: 'bg-gold/8',    dot: 'bg-gold' },
  kanpai:    { label: 'Kanpai Timing',   accent: 'text-royal',    border: 'border-royal/20',    bg: 'bg-royal/8',    dot: 'bg-royal' },
  chopstick: { label: 'Chopstick Catch', accent: 'text-electric', border: 'border-electric/20', bg: 'bg-electric/8', dot: 'bg-electric' },
}

export const GAMES: Game[] = ['shake', 'flip', 'tap', 'kanpai', 'chopstick']
