'use client'

import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import BdiLogo from '@/components/common/bdiLogo'
import { Button } from '@/components/common/button'
import { ChopstickCatch } from '@/components/room/chopstick/chopstick-catch-game'
import { FlipRace } from '@/components/room/flip/flip-race'
import { KanpaiTiming } from '@/components/room/kanpai/kanpai-timing-game'
import { RebelShake } from '@/components/room/shake/rebel-shake'
import { RoomPlayerAvatar } from '@/components/room/shared/room-player-avatar'
import { PokerChipTapGame } from '@/components/room/tap/poker-chip-tap-game'
import { GAME_META, type Game } from '@/data/game-meta'
import { VEGAS_VENUES, type RewardMode, type VegasVenue } from '@/data/vegas-options'
import { avatarKeyForPlayer } from '@/lib/preset-avatar'
import { api } from '@packages/backend/convex/_generated/api'

function makeGuestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `guest_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export default function RoomPage() {
  const params = useParams<{ code: string }>()
  const code = (params?.code ?? '').toUpperCase()
  const { user } = useUser()

  const room = useQuery(api.rooms.getRoomByCode, { code })
  const isHost = useQuery(api.rooms.isHostForRoom, { code })

  const [guestId, setGuestId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [isRequesting, setIsRequesting] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [isActingOnRequest, setIsActingOnRequest] = useState<string | null>(null)

  useEffect(() => {
    const key = `guestId:${code || 'room'}`
    const existing = localStorage.getItem(key)
    if (existing) {
      setGuestId(existing)
      return
    }
    const created = makeGuestId()
    localStorage.setItem(key, created)
    setGuestId(created)
  }, [code])

  useEffect(() => {
    const stored = localStorage.getItem(`guestName:${code || 'room'}`)
    if (stored) setName(stored)
  }, [code])

  const myJoinRequest = useQuery(api.joinRequests.getMyJoinRequest, guestId ? { code, guestId } : 'skip')

  const players = useQuery(api.players.listByRoomCode, code ? { code } : 'skip')

  const pending = useQuery(api.joinRequests.listPendingForHost, isHost ? { code } : 'skip')

  const requestToJoin = useMutation(api.joinRequests.requestToJoin)
  const approve = useMutation(api.joinRequests.approve)
  const deny = useMutation(api.joinRequests.deny)
  const setRoomStatus = useMutation(api.rooms.setRoomStatus)
  const setPartyOutcome = useMutation((api as any).rooms.setPartyOutcome)
  const upsertHostForRoom = useMutation(api.players.upsertHostForRoom)

  const [didUpsertHost, setDidUpsertHost] = useState(false)
  const [isChoosingOutcome, setIsChoosingOutcome] = useState(false)
  const [partyOutcomeError, setPartyOutcomeError] = useState<string | null>(null)
  const [stagedVenueId, setStagedVenueId] = useState<string | null>(null)
  const [stagedPunishment, setStagedPunishment] = useState<string | null>(null)

  const hostName = useMemo(() => {
    if (!user) return 'Host'
    return user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Host'
  }, [user])

  const isHostUser = Boolean(user && isHost)
  const isApprovedGuest = myJoinRequest?.status === 'approved' && Boolean(guestId)
  const myPlayerAvatarKey = useMemo(() => {
    if (!players || !guestId) return guestId ?? myJoinRequest?.name ?? 'guest'
    const mine = (players as any[]).find((p) => p.guestId === guestId)
    return mine ? avatarKeyForPlayer(mine) : guestId
  }, [players, guestId, myJoinRequest?.name])

  useEffect(() => {
    if (!user) return
    if (!isHost) return
    if (!code) return
    if (didUpsertHost) return

    setDidUpsertHost(true)
    void upsertHostForRoom({ code, name: hostName })
  }, [user, isHost, code, didUpsertHost, upsertHostForRoom, hostName])

  const gameMeta = room ? (GAME_META[room.game as Game] ?? GAME_META.shake) : GAME_META.shake
  const gameLabel = room ? gameMeta.label : ''

  const roomStartedAt = useMemo(() => {
    const startedAt = (room as any)?.state?.startedAt
    return typeof startedAt === 'number' ? startedAt : null
  }, [room])
  const roomCountdownMs = useMemo(() => {
    const countdownMs = (room as any)?.state?.countdownMs
    return typeof countdownMs === 'number' ? countdownMs : 5_000
  }, [room])
  const roomCountdownStartedAt = useMemo(() => {
    const countdownStartedAt = (room as any)?.state?.countdownStartedAt
    return typeof countdownStartedAt === 'number' ? countdownStartedAt : null
  }, [room])
  const partySetup = useMemo(() => {
    return (room as any)?.state?.partySetup as
      | { rewardMode?: RewardMode; venueIds?: string[]; punishmentCards?: string[]; customVenues?: VegasVenue[] }
      | undefined
  }, [room])
  const partyOutcome = useMemo(() => {
    return (room as any)?.state?.partyOutcome as
      | { selectedVenueId?: string | null; selectedPunishment?: string | null; selectedByPlayerId?: string | null }
      | undefined
  }, [room])
  const scoreKey =
    room?.game === 'tap'
      ? 'tap'
      : room?.game === 'kanpai'
        ? 'kanpai'
        : room?.game === 'chopstick'
          ? 'chopstick'
          : 'shake'
  const standings = useMemo(() => {
    if (!players) return []
    return [...players]
      .map((p) => {
        const scoreNode = (p as any)?.data?.[scoreKey]
        const score = typeof scoreNode?.count === 'number' ? scoreNode.count : 0
        return { player: p, score }
      })
      .sort((a, b) => b.score - a.score)
  }, [players, scoreKey])
  const topScore = standings.length > 0 ? standings[0]!.score : 0
  const winnerIds = useMemo(
    () =>
      standings.filter((entry) => entry.score === topScore && topScore > 0).map((entry) => String(entry.player._id)),
    [standings, topScore]
  )
  const myPlayer = useMemo(() => {
    if (!players) return null
    if (user) return players.find((p) => p.userId === user.id) ?? null
    if (guestId) return players.find((p) => p.guestId === guestId) ?? null
    return null
  }, [players, user, guestId])
  const isOutcomeLocked = Boolean(partyOutcome?.selectedVenueId || partyOutcome?.selectedPunishment)
  const shouldShowOutcomePanel = useMemo(() => {
    if (!room) return false
    if (room.game === 'flip') return false
    if (room.status !== 'finished') return false
    if (!partySetup) return false
    return winnerIds.length > 0
  }, [room, partySetup, winnerIds.length])
  const canChooseOutcome = useMemo(() => {
    if (!room || room.status !== 'finished') return false
    if (room.game === 'flip') return false
    if (!partySetup) return false
    if (winnerIds.length === 0) return false
    if (!myPlayer) return false
    if (isOutcomeLocked) return false
    return winnerIds.includes(String(myPlayer._id))
  }, [room, partySetup, myPlayer, winnerIds, isOutcomeLocked])
  const winnerNames = useMemo(() => {
    if (!winnerIds.length) return ''
    const winners = standings
      .filter((entry) => winnerIds.includes(String(entry.player._id)))
      .map((entry) => entry.player.name)
    return winners.join(', ')
  }, [standings, winnerIds])
  const setupVenues = useMemo(() => {
    const ids = partySetup?.venueIds ?? []
    const customVenues = partySetup?.customVenues ?? []
    const allVenueOptions = [...VEGAS_VENUES, ...customVenues]
    return ids.map((id) => allVenueOptions.find((v) => v.id === id)).filter(Boolean)
  }, [partySetup])

  const shakeDurationMs = 15_000

  useEffect(() => {
    if (!room) return
    if (
      room.game !== 'shake' &&
      room.game !== 'flip' &&
      room.game !== 'tap' &&
      room.game !== 'kanpai' &&
      room.game !== 'chopstick'
    )
      return
    if (!user) return
    if (!isHost) return
    if (room.status !== 'playing') return
    if (typeof roomStartedAt !== 'number') return

    const endAt = roomStartedAt + shakeDurationMs
    const delay = endAt - Date.now()

    if (delay <= 0) {
      void setRoomStatus({ code, status: 'finished' })
      return
    }

    const id = window.setTimeout(() => {
      void setRoomStatus({ code, status: 'finished' })
    }, delay)

    return () => window.clearTimeout(id)
  }, [room, user, isHost, roomStartedAt, shakeDurationMs, setRoomStatus, code])

  async function onRequestToJoin() {
    if (!guestId) return
    const trimmed = name.trim()
    if (!trimmed) return

    try {
      setIsRequesting(true)
      localStorage.setItem(`guestName:${code || 'room'}`, trimmed)
      await requestToJoin({ code, guestId, name: trimmed })
    } finally {
      setIsRequesting(false)
    }
  }

  async function onStartPlaying() {
    try {
      setIsStarting(true)
      await setRoomStatus({ code, status: 'playing' })
    } finally {
      setIsStarting(false)
    }
  }

  async function onRestartGame() {
    try {
      setIsRestarting(true)
      await setRoomStatus({ code, status: 'lobby' })
    } finally {
      setIsRestarting(false)
    }
  }

  async function onChooseOutcome({
    selectedVenueId,
    selectedPunishment,
  }: {
    selectedVenueId?: string
    selectedPunishment?: string
  }) {
    try {
      setPartyOutcomeError(null)
      setIsChoosingOutcome(true)
      await setPartyOutcome({
        code,
        guestId: user ? undefined : (guestId ?? undefined),
        selectedVenueId,
        selectedPunishment,
      })
    } catch (err) {
      setPartyOutcomeError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsChoosingOutcome(false)
    }
  }

  const isActive = room ? room.status === 'lobby' || room.status === 'playing' : false

  return (
    <main className="min-h-dvh bg-midnight">
      {/* ── top bar ── */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-midnight/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <BdiLogo multicolor size={22} />
            <span className="font-syne text-xs font-bold tracking-wide text-white">Room {code}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${isActive ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/25'}`}>
              {room?.status ?? '...'}
            </span>
            <span className={`inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/40`}>
              {room ? gameLabel : '...'}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 pb-8">
        {!room ? (
          <div className="flex min-h-[50dvh] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        ) : (
          <section className="mt-4 space-y-4 text-white">
            {/* players */}
            <div className="space-y-2">
              <div className="text-[11px] font-medium text-white/30 uppercase tracking-widest">Players</div>
              {!players ? (
                <div className="text-xs text-white/30">Loading players...</div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {(players.length === 0 && user && isHost
                    ? [{ _id: 'host-local' as any, name: hostName, isHost: true }]
                    : players
                  ).map((p) => (
                    <div key={p._id} className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-2.5 py-1">
                      <RoomPlayerAvatar name={p.name} avatarKey={avatarKeyForPlayer(p as any)} className="h-6 w-6" />
                      <span className="text-xs font-medium text-white/70">
                        {p.name}{p.isHost ? ' (host)' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {room.game === 'shake' && (
              <RebelShake
                code={code}
                roomStatus={room.status}
                roomStartedAt={roomStartedAt}
                roomCountdownStartedAt={roomCountdownStartedAt}
                roomCountdownMs={roomCountdownMs}
                players={players}
                isHostUser={isHostUser}
                isApprovedGuest={isApprovedGuest}
                guestId={guestId}
                durationMs={shakeDurationMs}
              />
            )}

            {room.game === 'kanpai' && (
              <KanpaiTiming
                code={code}
                roomStatus={room.status}
                roomStartedAt={roomStartedAt}
                roomCountdownStartedAt={roomCountdownStartedAt}
                roomCountdownMs={roomCountdownMs}
                players={players}
                isHostUser={isHostUser}
                isApprovedGuest={isApprovedGuest}
                guestId={guestId}
                durationMs={shakeDurationMs}
              />
            )}

            {room.game === 'chopstick' && (
              <ChopstickCatch
                code={code}
                roomStatus={room.status}
                roomStartedAt={roomStartedAt}
                roomCountdownStartedAt={roomCountdownStartedAt}
                roomCountdownMs={roomCountdownMs}
                players={players}
                isHostUser={isHostUser}
                isApprovedGuest={isApprovedGuest}
                guestId={guestId}
                durationMs={shakeDurationMs}
              />
            )}

            {room.game === 'flip' && (
              <FlipRace
                code={code}
                roomStatus={room.status}
                roomStartedAt={roomStartedAt}
                roomCountdownStartedAt={roomCountdownStartedAt}
                roomCountdownMs={roomCountdownMs}
                players={players}
                isHostUser={isHostUser}
                isApprovedGuest={isApprovedGuest}
                guestId={guestId}
                durationMs={shakeDurationMs}
              />
            )}

            {room.game === 'tap' && (
              <PokerChipTapGame
                code={code}
                roomStatus={room.status}
                roomStartedAt={roomStartedAt}
                roomCountdownStartedAt={roomCountdownStartedAt}
                roomCountdownMs={roomCountdownMs}
                players={players}
                isHostUser={isHostUser}
                isApprovedGuest={isApprovedGuest}
                guestId={guestId}
                durationMs={shakeDurationMs}
              />
            )}

            {shouldShowOutcomePanel &&
              partySetup &&
              (() => {
                const isCombo = partySetup.rewardMode === 'combo'
                const showVenues = (partySetup.rewardMode === 'venue' || isCombo) && setupVenues.length > 0
                const showPunishments =
                  (partySetup.rewardMode === 'punishment' || isCombo) && (partySetup.punishmentCards ?? []).length > 0
                const comboReady = isCombo ? Boolean(stagedVenueId && stagedPunishment) : true

                return (
                  <div className="space-y-3 rounded-xl border border-white/10 bg-surface p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-white">Prize / Punishment</div>
                      {isOutcomeLocked ? (
                        <div className="rounded-full border border-emerald-300/50 bg-emerald-200/15 px-2 py-0.5 text-[11px] text-emerald-200">
                          Locked
                        </div>
                      ) : (
                        <div className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                          Winner picks
                        </div>
                      )}
                    </div>

                    {standings[0] ? (
                      <div className="text-xs text-white/60">
                        Winner: <span className="font-semibold text-white">{standings[0].player.name}</span>
                        {winnerIds.length > 1 ? ` (+${winnerIds.length - 1} tie)` : ''}
                      </div>
                    ) : (
                      <div className="text-xs text-white/40">No scores yet.</div>
                    )}

                    {showVenues && !isOutcomeLocked && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] text-white/40">Pick a venue</div>
                        <div className="grid grid-cols-1 gap-2">
                          {setupVenues.map((venue) => {
                            const isStaged = stagedVenueId === venue!.id
                            return (
                              <button
                                key={venue!.id}
                                type="button"
                                className={`text-left rounded-xl border px-3 py-2.5 transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                                  isStaged
                                    ? 'border-white/20 bg-white/10'
                                    : 'border-white/8 bg-white/2 hover:bg-white/5'
                                }`}
                                disabled={!canChooseOutcome || isChoosingOutcome}
                                onClick={() => {
                                  if (isCombo) {
                                    setStagedVenueId(isStaged ? null : venue!.id)
                                  } else {
                                    void onChooseOutcome({ selectedVenueId: venue!.id })
                                  }
                                }}
                              >
                                <div className="text-xs font-medium text-white/80">{venue!.name}</div>
                                <div className="text-[10px] text-white/30">
                                  {venue!.area} · {venue!.vibe}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {showPunishments && !isOutcomeLocked && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] text-white/40">Pick a punishment</div>
                        <div className="grid grid-cols-1 gap-2">
                          {(partySetup.punishmentCards ?? []).map((card) => {
                            const isStaged = stagedPunishment === card
                            return (
                              <button
                                key={card}
                                type="button"
                                className={`text-left rounded-xl border px-3 py-2.5 text-xs transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                                  isStaged
                                    ? 'border-white/20 bg-white/10'
                                    : 'border-white/8 bg-white/2 hover:bg-white/5'
                                }`}
                                disabled={!canChooseOutcome || isChoosingOutcome}
                                onClick={() => {
                                  if (isCombo) {
                                    setStagedPunishment(isStaged ? null : card)
                                  } else {
                                    void onChooseOutcome({ selectedPunishment: card })
                                  }
                                }}
                              >
                                <span className="text-white/60">{card}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {isCombo && canChooseOutcome && !isOutcomeLocked && (
                      <button
                        type="button"
                        disabled={!comboReady || isChoosingOutcome}
                        onClick={() => {
                          if (!stagedVenueId || !stagedPunishment) return
                          void onChooseOutcome({ selectedVenueId: stagedVenueId, selectedPunishment: stagedPunishment })
                        }}
                        className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-midnight transition-all hover:bg-white/90 disabled:opacity-30"
                      >
                        {isChoosingOutcome ? 'Locking...' : 'Lock choices'}
                      </button>
                    )}

                    {partyOutcome?.selectedVenueId &&
                      (() => {
                        const chosenVenue = setupVenues.find((v) => v!.id === partyOutcome.selectedVenueId)
                        return (
                          <div className="rounded-xl border border-emerald-300/20 bg-emerald-200/5 px-3 py-2 text-xs">
                            Chosen venue:{' '}
                            <a
                              className="font-medium text-emerald-300 underline"
                              href={chosenVenue?.mapsUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {chosenVenue?.name ?? partyOutcome.selectedVenueId}
                            </a>
                          </div>
                        )
                      })()}
                    {partyOutcome?.selectedPunishment && (
                      <div className="rounded-xl border border-rose-300/20 bg-rose-200/5 px-3 py-2 text-xs text-rose-300">
                        Chosen punishment: {partyOutcome.selectedPunishment}
                      </div>
                    )}

                    {!canChooseOutcome && !isOutcomeLocked && (
                      <div className="text-xs text-white/40">
                        Only winner{winnerIds.length > 1 ? 's' : ''} can choose:{' '}
                        <span className="text-white/60">{winnerNames || 'No winner yet'}</span>
                      </div>
                    )}
                    {isOutcomeLocked && (
                      <div className="text-xs text-emerald-300">Choice is locked and cannot be changed.</div>
                    )}
                    {partyOutcomeError && <div className="text-xs text-neon">{partyOutcomeError}</div>}
                  </div>
                )
              })()}

            {/* Host controls */}
            {user && isHost && (
              <div className="space-y-4 rounded-2xl border border-white/8 bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium text-white/30 uppercase tracking-widest">Host Controls</span>
                  {room.status === 'lobby' && (
                    <Button onClick={onStartPlaying} disabled={isStarting}>
                      {isStarting ? 'Starting...' : 'Start Game'}
                    </Button>
                  )}
                  {room.status !== 'lobby' && (
                    <Button variant="outline" onClick={onRestartGame} disabled={isRestarting}>
                      {isRestarting ? 'Restarting...' : 'Restart'}
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] text-white/30">Waiting to enter</span>
                  {!pending ? (
                    <p className="text-xs text-white/20">Loading requests...</p>
                  ) : pending.length === 0 ? (
                    <p className="text-xs text-white/20">No pending requests.</p>
                  ) : (
                    <div className="space-y-2">
                      {pending.map((req) => (
                        <div key={req._id} className="flex items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/3 p-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <RoomPlayerAvatar name={req.name} avatarKey={String(req._id)} className="h-7 w-7" />
                            <span className="text-xs font-medium truncate text-white/70">{req.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              onClick={async () => {
                                try { setIsActingOnRequest(req._id); await approve({ requestId: req._id }) }
                                finally { setIsActingOnRequest(null) }
                              }}
                              disabled={isActingOnRequest === req._id}
                            >
                              {isActingOnRequest === req._id ? '...' : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try { setIsActingOnRequest(req._id); await deny({ requestId: req._id }) }
                                finally { setIsActingOnRequest(null) }
                              }}
                              disabled={isActingOnRequest === req._id}
                            >
                              Deny
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Guest waiting room */}
            {(!user || !isHost) && (
              <div className="rounded-2xl border border-white/8 bg-surface p-4 space-y-3">
                <span className="text-[11px] font-medium text-white/30 uppercase tracking-widest">
                  {myJoinRequest?.status === 'approved' ? 'You are in' : 'Join Room'}
                </span>

                {myJoinRequest?.status === 'approved' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <RoomPlayerAvatar name={myJoinRequest.name} avatarKey={myPlayerAvatarKey} className="h-7 w-7" />
                      <span className="text-xs font-medium text-white/70">{myJoinRequest.name}</span>
                    </div>
                    <p className="text-xs text-white/30">
                      {room?.status === 'playing' ? 'Game started. Get ready!' : 'Approved. Waiting for host countdown.'}
                    </p>
                  </div>
                ) : myJoinRequest?.status === 'pending' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <RoomPlayerAvatar name={myJoinRequest.name} avatarKey={myPlayerAvatarKey} className="h-7 w-7" />
                      <span className="text-xs font-medium text-white/70">{myJoinRequest.name}</span>
                    </div>
                    <p className="text-xs text-white/30">Requested. Waiting for host approval...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      id="name"
                      className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/20"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') onRequestToJoin() }}
                    />
                    <Button onClick={onRequestToJoin} disabled={isRequesting || !name.trim() || !guestId} className="w-full">
                      {isRequesting ? 'Requesting...' : 'Enter Room'}
                    </Button>
                    {myJoinRequest?.status === 'denied' && (
                      <p className="text-xs text-white/30">Not approved. You can request again.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {user && isHost && (
          <div className="mt-6 text-center">
            <Link className="text-xs text-white/25 transition-colors hover:text-white/50" href={`/host/rooms/${code}`}>
              Back to room settings
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
