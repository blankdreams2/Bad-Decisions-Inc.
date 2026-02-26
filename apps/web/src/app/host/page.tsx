'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'

import BdiLogo from '@/components/common/bdiLogo'
import { Button } from '@/components/common/button'
import { ConfirmPopover } from '@/components/common/confirm-popover'
import { GAME_META, GAMES, type Game } from '@/data/game-meta'
import { presetAvatarUrl } from '@/lib/preset-avatar'
import { api } from '@packages/backend/convex/_generated/api'

export default function HostPage() {
  const { isLoaded, user } = useUser()

  if (!isLoaded) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-midnight">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </main>
    )
  }

  const avatarUrl = presetAvatarUrl(user?.id ?? user?.primaryEmailAddress?.emailAddress ?? 'host')

  return <HostDashboard userName={user?.firstName ?? 'Host'} userImage={avatarUrl} />
}

const HostDashboard = ({ userName, userImage }: { userName: string; userImage?: string }) => {
  const { signOut } = useClerk()

  /* states */
  const [origin, setOrigin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState<Record<Game, boolean>>({
    shake: false,
    flip: false,
    tap: false,
    kanpai: false,
    chopstick: false,
  })
  const [deletingCode, setDeletingCode] = useState<string | null>(null)

  /* queries */
  const counts = useQuery(api.rooms.hostRoomCountsByGame, { activeOnly: true })
  const rooms = useQuery(api.rooms.listRoomsForHost, { includeFinished: true })

  /* mutations */
  const createRoom = useMutation(api.rooms.createRoom)
  const deleteRoom = useMutation(api.rooms.deleteRoom)

  /* effects */
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  /* handlers */
  const onCreate = async (game: Game) => {
    try {
      setError(null)
      setCreating((p) => ({ ...p, [game]: true }))
      await createRoom({ game })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating((p) => ({ ...p, [game]: false }))
    }
  }

  const onDelete = async (code: string) => {
    try {
      setError(null)
      setDeletingCode(code)
      await deleteRoom({ code })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setDeletingCode(null)
    }
  }

  return (
    <main className="min-h-dvh bg-midnight">
      {/* ── top bar ── */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-midnight/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link href="/" className="group flex items-center gap-2">
            <BdiLogo multicolor size={24} />
            <span className="font-syne text-xs font-bold tracking-wide text-white sm:text-sm">Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            {userImage && <img src={userImage} alt="" className="h-7 w-7 rounded-full border border-white/10" />}
            <button
              onClick={() => void signOut()}
              className="text-[11px] text-white/40 transition-colors hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pb-8">
        {/* ── greeting ── */}
        <section className="pt-6 pb-5">
          <p className="text-sm text-white/40">Welcome back,</p>
          <h1 className="font-syne text-2xl font-extrabold tracking-tight text-white">{userName}</h1>
        </section>

        {/* ── create game ── */}
        <section>
          <h2 className="mb-3 text-xs font-semibold tracking-widest text-white/30 uppercase">New Game</h2>
          <div className="space-y-2">
            {GAMES.map((game) => {
              const meta = GAME_META[game]
              const count = counts ? ((counts as Record<string, number>)[game] ?? 0) : null
              return (
                <div
                  key={game}
                  className={`flex items-center justify-between rounded-2xl border p-4 transition-colors ${meta.border} ${meta.bg}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    <div>
                      <span className={`text-sm font-semibold ${meta.accent}`}>{meta.label}</span>
                      <p className="text-[11px] text-white/30">{count !== null ? `${count} active` : '...'}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => onCreate(game)} disabled={creating[game]}>
                    {creating[game] ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── error ── */}
        {error && <div className="mt-4 rounded-xl border border-neon/20 bg-neon/5 p-3 text-xs text-neon">{error}</div>}

        {/* ── rooms feed ── */}
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-semibold tracking-widest text-white/30 uppercase">Your Rooms</h2>

          {!rooms ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-surface p-8 text-center">
              <p className="text-sm text-white/30">No rooms yet</p>
              <p className="mt-1 text-xs text-white/15">Create a game above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => {
                const roomUrl = origin ? `${origin}/room/${room.code}` : `/room/${room.code}`
                const meta = GAME_META[room.game as Game] ?? GAME_META.shake
                const isActive = room.status === 'lobby' || room.status === 'playing'

                return (
                  <div key={room._id} className="overflow-hidden rounded-2xl border border-white/8 bg-surface">
                    {/* Room header */}
                    <div className="flex items-center justify-between p-4 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-white/15'}`}
                        />
                        <div>
                          <span className={`text-sm font-semibold ${meta.accent}`}>{meta.label}</span>
                          <span className="ml-2 font-mono text-xs text-white/30">{room.code}</span>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${isActive ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/25'}`}
                      >
                        {room.status}
                      </span>
                    </div>

                    {/* QR + actions */}
                    <div className="flex items-end justify-between border-t border-white/5 px-4 py-3">
                      <div className="shrink-0 rounded-lg bg-white p-1.5">
                        {origin ? <QRCode value={roomUrl} size={56} /> : <div className="h-14 w-14" />}
                      </div>

                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/host/rooms/${room.code}`}>Manage</Link>
                        </Button>
                        <ConfirmPopover
                          title={`Delete room ${room.code}?`}
                          description="This cannot be undone."
                          confirmLabel="Delete"
                          onConfirm={() => onDelete(room.code)}
                        >
                          <Button size="sm" variant="destructive" disabled={deletingCode === room.code}>
                            {deletingCode === room.code ? '...' : 'Delete'}
                          </Button>
                        </ConfirmPopover>
                      </div>
                    </div>

                    {/* URL */}
                    <div className="border-t border-white/5 px-4 py-2">
                      <p className="truncate text-[10px] text-white/15">{roomUrl}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Back link ── */}
        <div className="mt-8 pb-4 text-center">
          <Link href="/" className="text-xs text-white/25 transition-colors hover:text-white/50">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
