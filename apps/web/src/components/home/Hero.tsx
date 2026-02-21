'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const Hero = () => {
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()
  const [isAnimated, setIsAnimated] = useState(false)
  const [animationNonce, setAnimationNonce] = useState(0)
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const replayCardsAnimation = () => {
    if (replayTimerRef.current) {
      clearTimeout(replayTimerRef.current)
      replayTimerRef.current = null
    }

    // Reset to the start position, then re-enable to trigger transitions again.
    setIsAnimated(false)
    setAnimationNonce((n) => n + 1)
    replayTimerRef.current = setTimeout(() => {
      setIsAnimated(true)
    }, 50)
  }

  useEffect(() => {
    // Trigger animation after component mounts
    replayTimerRef.current = setTimeout(() => {
      setIsAnimated(true)
    }, 100)
    return () => {
      if (replayTimerRef.current) clearTimeout(replayTimerRef.current)
    }
  }, [])

  const cards = [
    {
      src: '/images/Group 48095810.svg',
      rotation: -35,
      translateX: -70,
      translateY: -5,
      delay: 0,
      startRotation: -10,
      startX: -20,
    },
    {
      src: '/images/Group 48095811.svg',
      rotation: -15,
      translateX: -40,
      translateY: -20,
      delay: 100,
      startRotation: -5,
      startX: -10,
    },
    {
      src: '/images/Group 48095812.svg',
      rotation: 1,
      translateX: 0,
      translateY: -20,
      delay: 200,
      startRotation: 0,
      startX: 0,
    },
    {
      src: '/images/Group 48095813.svg',
      rotation: 10,
      translateX: 50,
      translateY: -10,
      delay: 300,
      startRotation: 5,
      startX: 10,
    },
    {
      src: '/images/Group 48095814.svg',
      rotation: 35,
      translateX: 72,
      translateY: 12,
      delay: 400,
      startRotation: 10,
      startX: 20,
    },
  ]

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#161616] mt-10 sm:mt-16 md:mt-20 px-3 sm:px-6 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-2 pt-2">
        {user ? (
          <>
            <button
              className="h-9 rounded-md border border-[#eab308]/90 bg-[#eab308]/20 px-3 text-sm text-[#facc15] hover:bg-[#eab308]/30"
              onClick={() => router.push('/host')}
            >
              Host Dashboard
            </button>
            <button
              className="h-9 rounded-md border border-white/30 px-3 text-sm text-white hover:bg-white/10"
              onClick={() => {
                void signOut()
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            className="h-9 rounded-md border border-[#eab308]/90 bg-[#eab308]/20 px-3 text-sm text-[#facc15] hover:bg-[#eab308]/30"
            onClick={() => router.push('/sign-in')}
          >
            Login
          </button>
        )}
      </div>
      {/* headers */}
      <h1 className="text-2xl min-[375px]:text-3xl sm:text-4xl md:text-5xl font-bold text-center mt-7 sm:mt-10 mb-2 sm:mb-3 text-white">
        BAD DECISIONS INC
      </h1>
      <h2 className="text-[#facc15] text-center text-sm sm:text-base">Team #18</h2>

      {/* cards */}
      <div className="flex justify-center items-center bg-cover bg-center h-36 min-[375px]:h-40 sm:h-52 md:h-60 mt-7 sm:mt-10">
        <div
          className="relative w-full h-full flex items-center justify-center [--card-spread:0.42] [--card-scale:0.62] min-[375px]:[--card-spread:0.5] min-[375px]:[--card-scale:0.72] min-[430px]:[--card-spread:0.62] min-[430px]:[--card-scale:0.82] sm:[--card-spread:1] sm:[--card-scale:1] cursor-pointer"
          onClick={replayCardsAnimation}
        >
          {cards.map((card, index) => (
            <img
              key={`${animationNonce}-${index}`}
              src={card.src}
              alt={`card ${index + 1}`}
              className="absolute transition-all duration-700 ease-out"
              style={{
                transform: isAnimated
                  ? `translate(calc(${card.translateX}px * var(--card-spread)), calc(${card.translateY}px * var(--card-spread))) rotate(${card.rotation}deg) scale(var(--card-scale))`
                  : `translate(calc(${card.startX}px * var(--card-spread)), 0px) rotate(${card.startRotation}deg) scale(var(--card-scale))`,
                transitionDelay: `${card.delay}ms`,
                width: '400px',
                height: 'auto',
                zIndex: index,
                filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))',
              }}
            />
          ))}
        </div>
      </div>

      {/* catchphrase */}
      <p className="text-[#A0A0A0] text-center text-sm min-[375px]:text-base sm:text-lg px-2 sm:px-10 md:px-20 items-center">
        indecisive? put it all on gold
      </p>

      {/* one player sign-in */}
      <div className="flex justify-center items-center mt-8 sm:mt-10">
        <button
          className="font-semibold
        text-lg min-[375px]:text-xl sm:text-2xl md:text-3xl px-5 min-[375px]:px-6 sm:px-8 md:px-10 py-2.5 min-[375px]:py-3 sm:py-4 md:py-5 shadow-[0_0_20px_rgba(234,179,8,0.45)] transition duration-500 ease-in-out border-2 border-solid border-[#eab308] bg-[#eab308] text-black hover:bg-[#facc15] inline-block transform skew-x-6"
          onClick={() => router.push(user ? '/host' : '/sign-in')}
        >
          {user ? 'Open Host' : 'Sign In'}
        </button>
      </div>

      {/* problem statement */}
      <div className="flex flex-col justify-center items-center mt-14 sm:mt-20 border border-[#eab308]/55 bg-black/45 py-5 sm:py-6 w-full max-w-5xl mx-auto rounded-md">
        {/* places */}
        <div className="flex flex-col items-center text-white">
          <img src="/images/foods.svg" alt="places" className="w-40 sm:w-56 md:w-72 mb-4 sm:mb-5" />
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl text-white text-center mb-6 sm:mb-10">
          Problem Statement
        </h1>

        <p className="text-[#e5e5e5] text-center text-sm sm:text-base md:text-lg leading-8 font-medium px-4 sm:px-8 md:px-10 mb-6 sm:mb-10 max-w-4xl">
          Bad Decisions Inc is a Vegas-style party mini-game platform. The host creates a room, everyone joins instantly
          with a QR code, and each round decides real plans: winner chooses the place, or losers take a punishment card.
          Designed for fast mobile rounds, live scoreboards, and chaotic friend-group energy.
        </p>
      </div>

      {/* minigames */}
      <div className="flex flex-col items-center mt-12 sm:mt-15 text-white">
        <h1
          className="text-2xl sm:text-3xl md:text-4xl text-white text-center mb-6 sm:mb-10"
        >
          Minigames
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 p-1 sm:p-4 md:p-8 w-full max-w-6xl">
          <div className="flex justify-center items-center mb-6 sm:mb-10 px-4 sm:px-6 md:px-10 py-4 sm:py-5 shadow-lg border border-solid border-[#eab308] duration-500 ease-in-out bg-black/50 flex-col gap-5 hover:bg-gray-900">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#eab308] bg-[#eab308]/15 text-4xl sm:mr-6 md:mr-10">📳</div>
              <div className="flex flex-col gap-3 justify-center">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#facc15]">Shake Game</h1>
                <h2 className="text-sm sm:text-base md:text-lg font-light">Rebel Shake: 5-second synced countdown, then full speed phone shaking for 15 seconds.</h2>
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center mb-6 sm:mb-10 px-4 sm:px-6 md:px-10 py-4 sm:py-5 shadow-lg border border-solid border-[#eab308] duration-500 ease-in-out bg-black/50 flex-col gap-5 hover:bg-gray-900">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#eab308] bg-[#eab308]/15 text-4xl sm:mr-6 md:mr-10">🍳</div>
              <div className="flex flex-col gap-3 justify-center">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#facc15]">Flip Game</h1>
                <h2 className="text-sm sm:text-base md:text-lg font-light">Vegas Pan Flip: flick your phone to launch the egg and stack flips on the live race track.</h2>
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center mb-6 sm:mb-10 px-4 sm:px-6 md:px-10 py-4 sm:py-5 shadow-lg border border-solid border-[#eab308] duration-500 ease-in-out bg-black/50 flex-col gap-5 hover:bg-gray-900">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#eab308] bg-[#eab308]/15 text-4xl sm:mr-6 md:mr-10">🪙</div>
              <div className="flex flex-col gap-3 justify-center">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#facc15]">Tap Tap</h1>
                <h2 className="text-sm sm:text-base md:text-lg font-light">Poker Chip Tap: wait for countdown, then spam taps for the highest score before time runs out.</h2>
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center mb-6 sm:mb-10 px-4 sm:px-6 md:px-10 py-4 sm:py-5 shadow-lg border border-solid border-[#eab308] duration-500 ease-in-out bg-black/50 flex-col gap-5 hover:bg-gray-900">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#eab308] bg-[#eab308]/15 text-4xl sm:mr-6 md:mr-10">🍺</div>
              <div className="flex flex-col gap-3 justify-center">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#facc15]">Kanpai Timing</h1>
                <h2 className="text-sm sm:text-base md:text-lg font-light">Tap on each beat and lock in the lowest average timing error to win.</h2>
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center mb-6 sm:mb-10 px-4 sm:px-6 md:px-10 py-4 sm:py-5 shadow-lg border border-solid border-[#eab308] duration-500 ease-in-out bg-black/50 flex-col gap-5 hover:bg-gray-900">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3 sm:gap-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#eab308] bg-[#eab308]/15 text-4xl sm:mr-6 md:mr-10">🥢</div>
              <div className="flex flex-col gap-3 justify-center">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#facc15]">Chopstick Catch</h1>
                <h2 className="text-sm sm:text-base md:text-lg font-light">Catch falling sushi at the right height and stack points before the timer ends.</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
