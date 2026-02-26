'use client'

import { CARD_FAN } from '@/data/hero-data'
import { useEffect, useRef, useState } from 'react'

const HOLD_MS = 2000
const RESET_MS = 2000

export default function HomeCards() {
  /* state */
  const [nonce, setNonce] = useState(0)
  const [isAnimated, setIsAnimated] = useState(false)

  /*  */
  const activeRef = useRef(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* click and then run the animation, I think */
  useEffect(() => {
    activeRef.current = true

    const deal = () => {
      if (!activeRef.current) return
      setIsAnimated(true)
      timerRef.current = setTimeout(() => {
        if (!activeRef.current) return
        setNonce((n) => n + 1)
        setIsAnimated(false)
        timerRef.current = setTimeout(deal, RESET_MS)
      }, HOLD_MS)
    }

    timerRef.current = setTimeout(deal, 100)

    return () => {
      activeRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="flex h-24 w-full items-center justify-center min-[375px]:h-28 sm:h-36 md:h-44">
      <div className="relative flex h-full w-full items-center justify-center [--card-w:260px] [--card-scale:0.55] [--card-spread:0.38] min-[375px]:[--card-w:300px] min-[375px]:[--card-scale:0.65] min-[375px]:[--card-spread:0.48] min-[430px]:[--card-w:340px] min-[430px]:[--card-scale:0.75] min-[430px]:[--card-spread:0.58] sm:[--card-w:400px] sm:[--card-scale:1] sm:[--card-spread:1]">
        {CARD_FAN.map((card, i) => (
          <img
            key={`${nonce}-${i}`}
            src={card.src}
            alt={`card ${i + 1}`}
            className="absolute transition-all duration-700 ease-out"
            style={{
              transform: isAnimated
                ? `translate(calc(${card.translateX}px * var(--card-spread)), calc(${card.translateY}px * var(--card-spread))) rotate(${card.rotation}deg) scale(var(--card-scale))`
                : `translate(calc(${card.startX}px * var(--card-spread)), 0px) rotate(${card.startRotation}deg) scale(var(--card-scale))`,
              transitionDelay: `${card.delay}ms`,
              width: 'var(--card-w)',
              height: 'auto',
              zIndex: i,
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))',
            }}
          />
        ))}
      </div>
    </div>
  )
}
