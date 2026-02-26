'use client'

import { useMutation } from 'convex/react'
import { useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import type { JSX } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import { Button } from '@/components/common/button'
import { RoomPlayerAvatar } from '@/components/room/shared/room-player-avatar'
import { useShakeLeaderboard, type ShakeLeaderboardPlayer } from '@/hooks/use-shake-leaderboard'
import { useSyncedRound } from '@/hooks/use-synced-round'
import { api } from '@packages/backend/convex/_generated/api'

function NormalizedAsset({
  url,
  targetSize,
  ...props
}: JSX.IntrinsicElements['group'] & {
  url: string
  targetSize: number
}) {
  const gltf = useGLTF(url)
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  const rootRef = useRef<THREE.Group | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    if (!rootRef.current || !modelRef.current) return

    const box = new THREE.Box3().setFromObject(modelRef.current)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const scale = targetSize / maxDim
    rootRef.current.scale.setScalar(scale)
    modelRef.current.position.set(-center.x, -center.y, -center.z)
  }, [scene, targetSize])

  return (
    <group ref={rootRef} {...props} dispose={null}>
      <group ref={modelRef}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

function PokerChipModel(props: JSX.IntrinsicElements['group']) {
  return <NormalizedAsset url="/pokerchip.glb" targetSize={1.15} {...props} />
}

function CoinModel(props: JSX.IntrinsicElements['group']) {
  return <NormalizedAsset url="/coin.glb" targetSize={0.58} {...props} />
}

function PokerChipRig({ isActive, tapCount }: { isActive: boolean; tapCount: number }) {
  const chipRef = useRef<THREE.Group | null>(null)
  const coinLeftRef = useRef<THREE.Group | null>(null)
  const coinRightRef = useRef<THREE.Group | null>(null)
  const spinBoostRef = useRef(0)
  const bumpRef = useRef(0)
  const coinBoostRef = useRef(0)
  const lastTapCountRef = useRef(tapCount)

  useEffect(() => {
    if (tapCount <= lastTapCountRef.current) return
    lastTapCountRef.current = tapCount
    spinBoostRef.current = Math.min(spinBoostRef.current + 0.2, 1.6)
    bumpRef.current = 1
    coinBoostRef.current = 1
  }, [tapCount])

  useFrame(({ clock }, delta) => {
    if (!chipRef.current || !coinLeftRef.current || !coinRightRef.current) return

    const t = clock.getElapsedTime()
    spinBoostRef.current = Math.max(0, spinBoostRef.current - delta * 1.6)
    bumpRef.current = Math.max(0, bumpRef.current - delta * 3.2)
    coinBoostRef.current = Math.max(0, coinBoostRef.current - delta * 2.5)

    const idleWobble = isActive ? 0.1 : 0.04
    const baseSpin = isActive ? 2.1 : 1.2
    const spinSpeed = baseSpin + spinBoostRef.current * 11
    const bumpScale = 1 + bumpRef.current * 0.18
    const coinOrbitRadius = 1 + coinBoostRef.current * 0.06
    const coinLift = 0.2 + coinBoostRef.current * 0.12

    chipRef.current.rotation.x = Math.PI * 0.5 + Math.sin(t * 2.6) * idleWobble
    chipRef.current.rotation.y += delta * spinSpeed
    chipRef.current.rotation.z = Math.sin(t * 2.1) * 0.05
    chipRef.current.position.y = Math.sin(t * 3.2) * 0.06
    chipRef.current.scale.setScalar(bumpScale)

    coinLeftRef.current.position.x = Math.cos(t * 1.2 + Math.PI * 0.1) * coinOrbitRadius
    coinLeftRef.current.position.y = -0.2 + Math.sin(t * 3.2) * 0.05 + coinLift * 0.1
    coinLeftRef.current.position.z = Math.sin(t * 1.2 + Math.PI * 0.1) * 0.25
    coinLeftRef.current.rotation.z += delta * 2
    coinLeftRef.current.rotation.y += delta * 1.4

    coinRightRef.current.position.x = Math.cos(t * 1.2 + Math.PI * 1.1) * coinOrbitRadius
    coinRightRef.current.position.y = -0.2 + Math.sin(t * 3.2 + Math.PI) * 0.05 + coinLift * 0.1
    coinRightRef.current.position.z = Math.sin(t * 1.2 + Math.PI * 1.1) * 0.25
    coinRightRef.current.rotation.z -= delta * 1.9
    coinRightRef.current.rotation.y -= delta * 1.25
  })

  return (
    <group>
      <group ref={chipRef} position={[0, -0.02, 0]}>
        <PokerChipModel />
      </group>
      <group ref={coinLeftRef} position={[-0.95, -0.2, 0.15]} rotation={[Math.PI * 0.5, 0, 0]}>
        <CoinModel />
      </group>
      <group ref={coinRightRef} position={[0.95, -0.2, -0.15]} rotation={[Math.PI * 0.5, 0, 0]}>
        <CoinModel />
      </group>
    </group>
  )
}

function PokerChipTapScene({ isActive, tapCount }: { isActive: boolean; tapCount: number }) {
  return (
    <div className="mx-auto h-60 w-full max-w-xs">
      <Canvas dpr={[1, 1.5]} gl={{ alpha: true }} camera={{ fov: 36, position: [0, 0.2, 4.15] }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[2, 4, 3]} intensity={1.1} color="#ffe3be" />
        <pointLight position={[-2, 1, 2]} intensity={0.7} color="#ff3b30" />
        <PokerChipRig isActive={isActive} tapCount={tapCount} />
      </Canvas>
    </div>
  )
}

export function PokerChipTapGame({
  code,
  roomStatus,
  roomStartedAt,
  roomCountdownStartedAt,
  roomCountdownMs,
  players,
  isHostUser,
  isApprovedGuest,
  guestId,
  durationMs = 10_000,
  title = 'Poker Chip Tap',
}: {
  code: string
  roomStatus: 'lobby' | 'playing' | 'finished' | string
  roomStartedAt: number | null
  roomCountdownStartedAt: number | null
  roomCountdownMs: number
  players: ShakeLeaderboardPlayer[] | null | undefined
  isHostUser: boolean
  isApprovedGuest: boolean
  guestId: string | null
  durationMs?: number
  title?: string
}) {
  const updateTapProgress = useMutation((api as any).players.updateTapProgress)

  const [taps, setTaps] = useState(0)
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false)
  const lastPushRef = useRef<{ at: number; count: number }>({ at: 0, count: -1 })
  const didFinalPushRef = useRef(false)

  const canEnableTap = useMemo(() => {
    if (!code) return false
    if (isHostUser) return true
    return isApprovedGuest
  }, [code, isHostUser, isApprovedGuest])

  const canPlay = useMemo(() => {
    if (!canEnableTap) return false
    return roomStatus === 'playing'
  }, [canEnableTap, roomStatus])

  const round = useSyncedRound({
    startedAtMs: roomStartedAt,
    durationMs,
    isActive: canPlay && typeof roomStartedAt === 'number',
  })

  const hasRoundTiming = typeof roomStartedAt === 'number'
  const countdownDurationMs = Math.max(1000, roomCountdownMs || 5000)
  const countdownEndAtMs =
    typeof roomCountdownStartedAt === 'number' ? roomCountdownStartedAt + countdownDurationMs : roomStartedAt
  const countdownRemainingMs = useMemo(() => {
    if (roomStatus !== 'playing') return 0
    if (typeof countdownEndAtMs !== 'number') return 0
    return Math.max(0, countdownEndAtMs - round.nowMs)
  }, [roomStatus, countdownEndAtMs, round.nowMs])
  const countdownDisplay = useMemo(() => {
    const maxSeconds = Math.ceil(countdownDurationMs / 1000)
    return Math.min(maxSeconds, Math.max(1, Math.ceil(countdownRemainingMs / 1000)))
  }, [countdownDurationMs, countdownRemainingMs])

  const isCountdown = canPlay && countdownRemainingMs > 0
  const isRoundRunning = canPlay && hasRoundTiming && !isCountdown && !round.isOver
  const isRoundOver =
    (roomStatus === 'finished' && hasRoundTiming) || (canPlay && hasRoundTiming && !isCountdown && round.isOver)

  useEffect(() => {
    setTaps(0)
    lastPushRef.current = { at: 0, count: -1 }
    didFinalPushRef.current = false
  }, [code, roomStatus, roomStartedAt])

  function handleTap() {
    if (!isRoundRunning) return
    setTaps((prev) => prev + 1)
  }

  useEffect(() => {
    if (!canPlay) return
    if (typeof roomStartedAt !== 'number') return

    const now = Date.now()
    const last = lastPushRef.current
    const nextCount = taps
    const countChanged = nextCount !== last.count
    const timeOk = now - last.at > 150

    const shouldPushLive = isRoundRunning && countChanged && timeOk
    const shouldPushFinal = isRoundOver && !didFinalPushRef.current && (countChanged || last.count < 0)
    if (!shouldPushLive && !shouldPushFinal) return

    lastPushRef.current = { at: now, count: nextCount }
    void updateTapProgress({
      code,
      ...(isHostUser ? {} : { guestId: guestId ?? undefined }),
      tapCount: nextCount,
    })
    if (shouldPushFinal) didFinalPushRef.current = true
  }, [canPlay, roomStartedAt, taps, isRoundRunning, isRoundOver, updateTapProgress, code, isHostUser, guestId])

  const { leaderboard, maxCount, winnerBannerText } = useShakeLeaderboard({
    players,
    isRoundOver,
    scoreKey: 'tap',
  })
  const leaderboardRows = useMemo(() => {
    if (!leaderboard) return null
    return showAllLeaderboard ? leaderboard : leaderboard.slice(0, 3)
  }, [leaderboard, showAllLeaderboard])

  const secondsLeft = Math.max(0, Math.ceil(round.remainingMs / 1000))
  const gameLabel = isCountdown
    ? `STARTS IN ${countdownDisplay}`
    : isRoundRunning
      ? 'LIVE'
      : isRoundOver
        ? 'FINISHED'
        : 'READY'
  const roundProgress01 = roomStatus === 'finished' ? 1 : round.progress01
  const roundLabel = `${Math.round(durationMs / 1000)}s round`

  return (
    <div className="pt-3 border-t">
      <div className="relative overflow-hidden rounded-xl border border-white/8 bg-surface p-4 space-y-4 text-white">
        <div className="rounded-full inline-flex items-center border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-white/60">
          BAD DECISIONS INC · {title.toUpperCase()}
        </div>

        <div className="relative rounded-md border border-white/8 bg-white/5 p-3">
          <PokerChipTapScene isActive={isRoundRunning || isCountdown} tapCount={taps} />

          <button
            type="button"
            onPointerDown={handleTap}
            className="absolute inset-0 rounded-md cursor-pointer"
            style={{ touchAction: 'manipulation' }}
            aria-label="Tap poker chip"
          />

          {isCountdown ? (
            <div className="mt-2 text-center">
              <div className="text-xs uppercase tracking-wide text-white/50">Get ready</div>
              <div className="text-3xl font-black tabular-nums text-white">{countdownDisplay}</div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-white">
              Tap or click the chip as fast as possible before the timer ends.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-white">Chip taps</div>
            <div className="text-xs text-white/80">{gameLabel}</div>
          </div>

          <div className="relative h-2 rounded-md bg-white/10 overflow-hidden border border-white/10">
            <div
              className="absolute inset-y-0 left-0 bg-white"
              style={{
                width: `${Math.round(roundProgress01 * 1000) / 10}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2">
              Time
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-white">{secondsLeft}s</div>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2">
              Score
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-white">{taps}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {isRoundOver ? (
            <div className="text-sm text-white">Time! You landed {taps} taps.</div>
          ) : isCountdown ? (
            <div className="text-sm text-white">{countdownDisplay}s countdown. Then spam tap.</div>
          ) : isRoundRunning ? (
            <div className="text-sm text-white">Keep tapping!</div>
          ) : (
            <div className="text-sm text-white/80">
              {roomStatus === 'lobby' ? 'Waiting for host to start...' : 'Round ready.'}
            </div>
          )}

          <div className="text-xs text-white/70 tabular-nums">{roundLabel}</div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 pb-5">
            <div className="text-sm font-medium text-white">Race Track Leaderboard</div>
            <div className="text-xs text-white/80 tabular-nums">
              {isCountdown
                ? `Starts in ${countdownDisplay}s`
                : roomStatus === 'playing'
                  ? `${secondsLeft}s left`
                  : roundLabel}
            </div>
          </div>
          {!leaderboard ? (
            <div className="text-sm text-white/70">Loading…</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-sm text-white/70">No players yet.</div>
          ) : (
            <div className="space-y-2">
              {leaderboardRows?.map((p, index) => {
                const rank = showAllLeaderboard ? leaderboard.findIndex((row) => row.id === p.id) + 1 : index + 1
                const progress01 = maxCount > 0 ? Math.max(0, Math.min(1, p.count / maxCount)) : 0
                const fillPct = Math.round(progress01 * 1000) / 10
                const avatarLeftPct = Math.max(7, Math.min(92, fillPct))
                const { startColor, endColor } = p

                return (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-xs w-5 text-center font-semibold text-white">{rank}</div>
                        <div className="w-40 text-sm font-semibold truncate text-white">
                          {p.name}
                          {p.isHost ? ' (host)' : ''}
                        </div>
                      </div>
                      {isRoundOver && <div className="text-xs tabular-nums text-white">{p.count} taps</div>}
                    </div>

                    <div className="relative h-10 rounded-md bg-white/10 overflow-hidden border border-white/10">
                      <div
                        className="absolute inset-y-0 left-0 rounded-r-md"
                        style={{
                          background: `linear-gradient(90deg, ${startColor} 0%, ${endColor} 100%)`,
                          width: `${fillPct}%`,
                        }}
                      />

                      <div
                        className="absolute top-1/2"
                        style={{ left: `${avatarLeftPct}%`, transform: 'translate(-50%, -50%)' }}
                        title={p.name}
                      >
                        <RoomPlayerAvatar
                          name={p.name}
                          avatarUrl={p.avatarUrl}
                          accent={startColor}
                          className="h-8 w-8"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
              {leaderboard.length > 3 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAllLeaderboard((prev) => !prev)}
                >
                  {showAllLeaderboard ? 'Show top 3' : `Show all (${leaderboard.length})`}
                </Button>
              )}
            </div>
          )}
        </div>

        {isRoundOver && winnerBannerText && (
          <div className="border border-white/10 rounded-xl bg-white/5 p-3 text-center animate-pulse">
            <div className="text-sm font-medium">{winnerBannerText}</div>
          </div>
        )}

        {isRoundRunning && (
          <div className="border border-white/15 rounded-xl bg-white/5 text-white font-bold p-3 text-center animate-pulse">
            TAP TAP TAP!!
          </div>
        )}
        {!canEnableTap && <div className="text-sm text-white/80">Get approved to play.</div>}
      </div>
    </div>
  )
}

useGLTF.preload('/pokerchip.glb')
useGLTF.preload('/coin.glb')
