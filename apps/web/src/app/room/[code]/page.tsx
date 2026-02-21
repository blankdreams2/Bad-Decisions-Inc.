'use client'

import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/common/button'
import { avatarKeyForPlayer } from '@/lib/preset-avatar'
import { ChopstickCatchGame } from '@/components/room/chopstick/chopstick-catch-game'
import { FlipRace } from '@/components/room/flip/flip-race'
import { KanpaiTimingGame } from '@/components/room/kanpai/kanpai-timing-game'
import { ShakeRace } from '@/components/room/shake/shake-race'
import { PokerChipTapGame } from '@/components/room/tap/poker-chip-tap-game'
import { RoomPlayerAvatar } from '@/components/room/shared/room-player-avatar'
import { VEGAS_VENUES, type RewardMode, type VegasVenue } from '@/data/vegas-options'
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

  const gameLabel = useMemo(() => {
    if (!room) return ''
    if (room.game === 'shake') return 'Rebel Shake'
    if (room.game === 'flip') return 'Vegas Pan Flip'
    if (room.game === 'tap') return 'Poker Chip Tap'
    if (room.game === 'kanpai') return 'Kanpai Timing'
    if (room.game === 'chopstick') return 'Chopstick Catch'
    return 'unknown'
  }, [room])

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
    if (room.game !== 'shake' && room.game !== 'flip' && room.game !== 'tap' && room.game !== 'kanpai' && room.game !== 'chopstick') return
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

  return (
    <main className="min-h-dvh p-4 bg-[#0f1115]">
      <div className="max-w-md w-full mx-auto space-y-4 text-white">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[#facc15]">Room {code}</h1>
          <div className="inline-flex rounded-full border border-[#eab308]/70 bg-[#eab308]/15 px-3 py-1 text-xs text-[#facc15]">
            Bad Decisions Inc · {room ? gameLabel : '…'}
          </div>
        </div>

        {!room ? (
          <div className="text-sm text-white/70">Loading room…</div>
        ) : (
          <section className="border border-white/20 bg-black/25 rounded-md p-4 space-y-4 backdrop-blur-sm">
            <div className="space-y-2">
              <div className="text-sm text-white/80">Players</div>
              {!players ? (
                <div className="text-sm text-white/70">Loading players…</div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {(players.length === 0 && user && isHost
                    ? [
                        {
                          _id: 'host-local' as any,
                          name: hostName,
                          isHost: true,
                        },
                      ]
                    : players
                  ).map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center gap-2 rounded-full border border-white/30 px-2 py-1 bg-white/10"
                    >
                      <RoomPlayerAvatar name={p.name} avatarKey={avatarKeyForPlayer(p as any)} className="h-8 w-8" />
                      <div className="text-sm font-medium whitespace-nowrap">
                        {p.name}
                        {p.isHost ? ' (host)' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-white/80">Status</div>
              <div className="text-sm font-medium">{room.status}</div>
            </div>

            {room.game === 'shake' && (
              <ShakeRace
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
            <KanpaiTimingGame
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
            <ChopstickCatchGame
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

            {shouldShowOutcomePanel && partySetup && (
            <div className="space-y-3 border border-[#eab308]/60 bg-black/35 rounded-xl p-4">
                <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-[#facc15]">Prize / Punishment</div>
                  {isOutcomeLocked ? (
                    <div className="rounded-full border border-emerald-300/50 bg-emerald-200/15 px-2 py-0.5 text-[11px] text-emerald-200">
                      Locked
                    </div>
                  ) : (
                  <div className="rounded-full border border-[#eab308]/70 bg-[#eab308]/20 px-2 py-0.5 text-[11px] text-[#facc15]">
                      Winner picks
                    </div>
                  )}
                </div>
                {standings[0] ? (
                  <div className="text-xs text-white/80">
                  Winner: <span className="font-semibold text-[#facc15]">{standings[0].player.name}</span>
                    {winnerIds.length > 1 ? ` (+${winnerIds.length - 1} tie)` : ''}
                  </div>
                ) : (
                  <div className="text-xs text-white/70">No scores yet.</div>
                )}

                {(partySetup.rewardMode === 'venue' || partySetup.rewardMode === 'combo') && setupVenues.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-white/70">Venue choices</div>
                    <div className="grid grid-cols-1 gap-2">
                      {setupVenues.map((venue) => (
                        <button
                          key={venue!.id}
                          type="button"
                          className="text-left rounded-md border border-white/25 bg-black/20 px-2 py-2 hover:bg-black/35 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!canChooseOutcome || isChoosingOutcome}
                          onClick={() => onChooseOutcome({ selectedVenueId: venue!.id })}
                        >
                          <div className="text-sm font-medium">{venue!.name}</div>
                          <div className="text-xs text-white/70">
                            {venue!.area} · {venue!.vibe}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(partySetup.rewardMode === 'punishment' || partySetup.rewardMode === 'combo') &&
                  (partySetup.punishmentCards ?? []).length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-white/70">Punishment cards</div>
                      <div className="grid grid-cols-1 gap-2">
                        {(partySetup.punishmentCards ?? []).map((card) => (
                          <button
                            key={card}
                            type="button"
                            className="text-left rounded-md border border-white/25 bg-black/20 px-2 py-2 hover:bg-black/35 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!canChooseOutcome || isChoosingOutcome}
                            onClick={() => onChooseOutcome({ selectedPunishment: card })}
                          >
                            {card}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {partyOutcome?.selectedVenueId && (() => {
                  const chosenVenue = setupVenues.find((v) => v!.id === partyOutcome.selectedVenueId)
                  return (
                    <div className="text-xs rounded-md border border-emerald-300/40 bg-emerald-200/10 px-2 py-1">
                      Chosen venue:{' '}
                      <a
                        className="underline text-emerald-200"
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
                  <div className="text-xs rounded-md border border-rose-300/40 bg-rose-200/10 px-2 py-1">
                    Chosen punishment: {partyOutcome.selectedPunishment}
                  </div>
                )}

                {!canChooseOutcome && !isOutcomeLocked && (
                  <div className="text-xs text-white/70">
                    Only winner{winnerIds.length > 1 ? 's' : ''} can choose:{' '}
                  <span className="text-[#facc15]">{winnerNames || 'No winner yet'}</span>
                  </div>
                )}
                {isOutcomeLocked && (
                  <div className="text-xs text-emerald-200">Choice is locked and cannot be changed.</div>
                )}
                {partyOutcomeError && <div className="text-xs text-rose-200">{partyOutcomeError}</div>}
              </div>
            )}

            {/* Host controls (host is also a player) */}
            {user && isHost && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">Host</div>
                  {room.status === 'lobby' && (
                    <Button onClick={onStartPlaying} disabled={isStarting}>
                      {isStarting ? 'Starting…' : 'Start playing'}
                    </Button>
                  )}
                  {room.status !== 'lobby' && (
                    <Button variant="outline" onClick={onRestartGame} disabled={isRestarting}>
                      {isRestarting ? 'Restarting…' : 'Restart'}
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Waiting to enter</div>
                  {!pending ? (
                    <div className="text-sm text-white/70">Loading requests…</div>
                  ) : pending.length === 0 ? (
                    <div className="text-sm text-white/70">No pending requests.</div>
                  ) : (
                    <div className="space-y-2">
                      {pending.map((req) => (
                        <div
                          key={req._id}
                          className="flex items-center justify-between gap-2 border border-white/30 rounded-md p-2 bg-white/5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <RoomPlayerAvatar name={req.name} avatarKey={String(req._id)} className="h-8 w-8" />
                            <div className="text-sm font-medium truncate">{req.name}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  setIsActingOnRequest(req._id)
                                  await approve({ requestId: req._id })
                                } finally {
                                  setIsActingOnRequest(null)
                                }
                              }}
                              disabled={isActingOnRequest === req._id}
                            >
                              {isActingOnRequest === req._id ? '…' : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  setIsActingOnRequest(req._id)
                                  await deny({ requestId: req._id })
                                } finally {
                                  setIsActingOnRequest(null)
                                }
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

            {/* Guest waiting room (no login) */}
            {(!user || !isHost) && (
              <div className="space-y-3">
                <div className="text-sm font-medium">
                  {myJoinRequest?.status === 'approved' ? 'You are in the game' : 'Waiting room'}
                </div>

                {myJoinRequest?.status === 'approved' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <RoomPlayerAvatar name={myJoinRequest.name} avatarKey={myPlayerAvatarKey} className="h-8 w-8" />
                      <div className="text-sm font-medium">{myJoinRequest.name}</div>
                    </div>
                    <div className="text-sm text-white/70">
                      {room?.status === 'playing' ? 'Game started. Get ready!' : 'Approved. Waiting for the host countdown.'}
                    </div>
                  </div>
                ) : myJoinRequest?.status === 'pending' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <RoomPlayerAvatar name={myJoinRequest.name} avatarKey={myPlayerAvatarKey} className="h-8 w-8" />
                      <div className="text-sm font-medium">{myJoinRequest.name}</div>
                    </div>
                    <div className="text-sm text-white/70">Requested. Waiting for host approval…</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm text-white/80" htmlFor="name">
                      Your name
                    </label>
                    <input
                      id="name"
                      className="w-full border border-white/30 bg-white/10 rounded-md px-3 h-10 placeholder:text-white/50"
                      placeholder="Type your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onRequestToJoin()
                      }}
                    />
                    <Button onClick={onRequestToJoin} disabled={isRequesting || !name.trim() || !guestId}>
                      {isRequesting ? 'Requesting…' : 'Enter room'}
                    </Button>

                    {myJoinRequest?.status === 'denied' && (
                      <div className="text-sm text-white/70">Not approved. You can request again.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {user && isHost && (
          <Link className="text-sm underline text-[#facc15]" href={`/host/rooms/${code}`}>
            Back
          </Link>
        )}
      </div>
    </main>
  )
}
