'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from 'convex/react'

import { Button } from '@/components/common/button'
import { ShakePhoneScene } from '@/components/room/shake/shake-phone-scene'
import { RoomPlayerAvatar } from '@/components/room/shared/room-player-avatar'
import { useShakeCounter } from '@/hooks/use-device-shake'
import { useShakeLeaderboard, type ShakeLeaderboardPlayer } from '@/hooks/use-shake-leaderboard'
import { useSyncedRound } from '@/hooks/use-synced-round'
import { api } from '@packages/backend/convex/_generated/api'

export function ShakeRace({
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
}) {
  const updateShakeProgress = useMutation(api.players.updateShakeProgress)

  const {
    shakeCount,
    resetCount: resetShakeCount,
    requestPermission: requestMotionPermission,
    isListening: isMotionListening,
    hasDeviceMotion,
    hasMotionEvents,
    incrementCount,
  } = useShakeCounter({ threshold: 12, timeout: 200 })

  const [showMotionTrouble, setShowMotionTrouble] = useState(false)
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false)
  const didAutoEnableMotionRef = useRef(false)
  const lastPushRef = useRef<{ at: number; count: number }>({ at: 0, count: -1 })
  const didFinalPushRef = useRef(false)

  const canEnableMotion = useMemo(() => {
    if (!code) return false
    if (isHostUser) return true
    return isApprovedGuest
  }, [code, isHostUser, isApprovedGuest])

  const canPlay = useMemo(() => {
    if (!canEnableMotion) return false
    return roomStatus === 'playing'
  }, [canEnableMotion, roomStatus])

  const round = useSyncedRound({
    startedAtMs: roomStartedAt,
    durationMs,
    isActive: canPlay && typeof roomStartedAt === 'number',
  })

  const hasRoundTiming = typeof roomStartedAt === 'number'
  const countdownDurationMs = Math.max(1_000, roomCountdownMs || 5_000)
  const countdownEndAtMs =
    typeof roomCountdownStartedAt === 'number' ? roomCountdownStartedAt + countdownDurationMs : roomStartedAt
  const countdownRemainingMs = useMemo(() => {
    if (roomStatus !== 'playing') return 0
    if (typeof countdownEndAtMs !== 'number') return 0
    return Math.max(0, countdownEndAtMs - round.nowMs)
  }, [roomStatus, countdownEndAtMs, round.nowMs])
  const countdownDisplaySeconds = useMemo(() => {
    const maxSeconds = Math.ceil(countdownDurationMs / 1000)
    return Math.min(maxSeconds, Math.max(1, Math.ceil(countdownRemainingMs / 1000)))
  }, [countdownDurationMs, countdownRemainingMs])
  const isCountdown = canPlay && countdownRemainingMs > 0
  const isRoundRunning = canPlay && hasRoundTiming && !isCountdown && !round.isOver
  const isRoundOver =
    (roomStatus === 'finished' && hasRoundTiming) || (canPlay && hasRoundTiming && !isCountdown && round.isOver)

  useEffect(() => {
    resetShakeCount()
    setShowMotionTrouble(false)
    lastPushRef.current = { at: 0, count: -1 }
    didAutoEnableMotionRef.current = false
    didFinalPushRef.current = false
  }, [code, roomStatus, roomStartedAt, resetShakeCount])

  useEffect(() => {
    if (!canEnableMotion) return
    if (isMotionListening) return
    if (didAutoEnableMotionRef.current) return

    didAutoEnableMotionRef.current = true
    void requestMotionPermission()
  }, [canEnableMotion, isMotionListening, requestMotionPermission])

  useEffect(() => {
    if (!canEnableMotion) {
      setShowMotionTrouble(false)
      return
    }
    if (!isMotionListening) {
      setShowMotionTrouble(false)
      return
    }
    if (!hasDeviceMotion) {
      setShowMotionTrouble(true)
      return
    }

    const id = window.setTimeout(() => {
      if (!hasMotionEvents) setShowMotionTrouble(true)
    }, 1500)

    return () => window.clearTimeout(id)
  }, [canEnableMotion, isMotionListening, hasDeviceMotion, hasMotionEvents])

  useEffect(() => {
    if (!canPlay) return
    if (typeof roomStartedAt !== 'number') return

    const now = Date.now()
    const last = lastPushRef.current

    const nextCount = shakeCount
    const countChanged = nextCount !== last.count
    const timeOk = now - last.at > 300

    const shouldPushLive = isRoundRunning && countChanged && timeOk
    const shouldPushFinal = isRoundOver && !didFinalPushRef.current && (countChanged || last.count < 0)

    if (!shouldPushLive && !shouldPushFinal) return

    lastPushRef.current = { at: now, count: nextCount }

    void updateShakeProgress({
      code,
      ...(isHostUser ? {} : { guestId: guestId ?? undefined }),
      shakeCount: nextCount,
    })
    if (shouldPushFinal) didFinalPushRef.current = true
  }, [canPlay, roomStartedAt, shakeCount, isRoundRunning, isRoundOver, updateShakeProgress, code, isHostUser, guestId])

  const { leaderboard, maxCount, winnerBannerText } = useShakeLeaderboard({
    players,
    isRoundOver,
  })
  const leaderboardRows = useMemo(() => {
    if (!leaderboard) return null
    return showAllLeaderboard ? leaderboard : leaderboard.slice(0, 3)
  }, [leaderboard, showAllLeaderboard])
  const roundLabel = `${Math.round(durationMs / 1000)}s round`

  return (
    <div className="pt-3 border-t">
      <div className="relative overflow-hidden rounded-xl border border-[#eab308]/55 bg-[#171a20] p-4 space-y-4 text-white">
        <div className="relative z-10 flex w-full items-center justify-center">
          <ShakePhoneScene isShaking={isRoundRunning} compact />
        </div>

        <div className="relative z-10 rounded-md border border-white/20 bg-black/30 px-3 py-2 text-xs text-[#facc15]">
          Mini party game by <span className="font-semibold">Bad Decisions Inc</span>
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-[#facc15]">Shake</div>
            <div className="text-xs text-white/80">
              {roomStatus === 'playing' ? 'LIVE' : roomStatus === 'lobby' ? 'LOBBY' : roomStatus}
            </div>
          </div>

          <div className="relative h-2 rounded-md bg-white/10 overflow-hidden border border-white/30">
            <div
              className="absolute inset-y-0 left-0 bg-[#eab308]"
              style={{ width: `${Math.round((roomStatus === 'finished' ? 1 : round.progress01) * 1000) / 10}%` }}
            />
          </div>

          <div className="text-xs text-white/80 tabular-nums">
            {isCountdown
              ? 'Get ready...'
              : hasRoundTiming && roomStatus === 'playing'
                ? 'Round in progress'
                : roundLabel}
          </div>
        </div>

        {!canEnableMotion ? (
          <div className="text-sm text-white/80">Get approved to play.</div>
        ) : (
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-white/80">
                {isRoundRunning ? 'Round running' : isRoundOver ? 'Round over' : 'Ready'}
              </div>

              {!isMotionListening ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    await requestMotionPermission()
                  }}
                >
                  Enable motion
                </Button>
              ) : (
                <div className="text-xs text-emerald-200">Motion enabled</div>
              )}
            </div>

            {isCountdown && (
              <div className="rounded-md border border-[#eab308]/70 bg-black/40 p-4 text-center">
                <div className="text-xs uppercase tracking-wide text-[#facc15]">Everyone ready?</div>
                <div className="text-4xl font-black tabular-nums text-[#fde047]">{countdownDisplaySeconds}</div>
              </div>
            )}

            {roomStatus !== 'playing' && !isHostUser && (
              <div className="text-sm text-white/80">Waiting for host to start...</div>
            )}

            {roomStatus !== 'playing' && isHostUser && <div className="text-sm text-white/80">Start the Game</div>}

            {showMotionTrouble && (
              <div
                className="text-xs text-white/80 flex items-center justify-between gap-3"
                title="Your browser is not sending motion sensor events. On Brave, allow sensors for this site (disable Shields / allow motion sensors), or open in Chrome/Safari."
              >
                <div className="min-w-0 truncate">Motion not detected — check sensor permissions.</div>
                <Button size="sm" variant="outline" onClick={incrementCount} disabled={!isRoundRunning}>
                  Tap
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-[#facc15]">Race Track Leaderboard</div>
                <div className="text-xs text-white/80 tabular-nums">
                  {isCountdown
                    ? `Starts in ${countdownDisplaySeconds}s`
                    : roomStatus === 'playing'
                      ? `${Math.max(0, Math.ceil(round.remainingMs / 1000))}s left`
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
                            <div className="text-xs w-5 text-center font-semibold text-[#facc15]">{rank}</div>
                            <div className="w-40 text-sm font-semibold truncate text-white">
                              {p.name}
                              {p.isHost ? ' (host)' : ''}
                            </div>
                          </div>
                          {isRoundOver && <div className="text-xs tabular-nums text-[#facc15]">{p.count} shakes</div>}
                        </div>

                        <div className="relative h-10 rounded-md bg-white/10 overflow-hidden border border-white/30">
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
              <div className="border border-[#eab308]/70 rounded-md bg-black/30 p-3 text-center animate-pulse">
                <div className="text-sm font-medium">{winnerBannerText}</div>
              </div>
            )}

            {isRoundRunning && (
              <div className="border border-fuchsia-300/50 rounded-md bg-black/30 p-3 text-center font-medium animate-pulse">
                SHAKE YOUR PHONE!!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
