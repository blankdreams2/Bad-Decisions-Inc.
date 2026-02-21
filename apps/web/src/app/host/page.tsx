'use client'

import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'

import { Button } from '@/components/common/button'
import { api } from '@packages/backend/convex/_generated/api'

type Game = 'shake' | 'flip' | 'tap' | 'kanpai' | 'chopstick'

function formatGame(game: Game | 'unknown' | undefined) {
  if (game === 'shake') return 'Rebel Shake'
  if (game === 'flip') return 'Vegas Pan Flip'
  if (game === 'tap') return 'Poker Chip Tap'
  if (game === 'kanpai') return 'Kanpai Timing'
  if (game === 'chopstick') return 'Chopstick Catch'
  return 'Unknown'
}

export default function HostPage() {
  // this could become a hook or a contex what not
  const { isLoaded, user } = useUser()

  if (!isLoaded) {
    return (
      <main className="min-h-dvh p-4 max-w-3xl w-full mx-auto space-y-6">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </main>
    )
  }

  return <HostPageSignedIn userEmail={user?.primaryEmailAddress?.emailAddress} />
}

function HostPageSignedIn({ userEmail }: { userEmail: string | undefined }) {
  const router = useRouter()
  const [origin, setOrigin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState<Record<Game, boolean>>({
    shake: false,
    flip: false,
    tap: false,
    kanpai: false,
    chopstick: false,
  })

  const counts = useQuery(api.rooms.hostRoomCountsByGame, { activeOnly: true })
  const rooms = useQuery(api.rooms.listRoomsForHost, { includeFinished: true })
  const createRoom = useMutation(api.rooms.createRoom)
  const deleteRoom = useMutation(api.rooms.deleteRoom)
  const [deletingCode, setDeletingCode] = useState<string | null>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  //
  async function onCreate(game: Game) {
    try {
      setError(null)
      setCreating((prev) => ({ ...prev, [game]: true }))
      await createRoom({ game })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setCreating((prev) => ({ ...prev, [game]: false }))
    }
  }

  async function onDeleteRoom(code: string) {
    const confirmed = window.confirm(`Delete room ${code}? This cannot be undone.`)
    if (!confirmed) return
    try {
      setError(null)
      setDeletingCode(code)
      await deleteRoom({ code })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setDeletingCode(null)
    }
  }

  return (
    <main className="min-h-dvh p-4 bg-[#0f1115]">
      <div className="max-w-3xl w-full mx-auto space-y-8 text-zinc-100">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-[#facc15]">Host Control 🎮</h1>
          <p className="text-sm text-zinc-300">Create and manage your party game rooms.</p>
          {userEmail && <p className="text-xs text-[#facc15]">Signed in as {userEmail}</p>}
        </div>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-medium text-[#facc15]">Games</h2>
            {/* <div className="text-xs text-zinc-400">UNLV red theme rooms</div> */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-white/20 bg-black/25 rounded-md p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-[#facc15]">📳 Rebel Shake</div>
                  <div className="text-sm text-zinc-300">Active rooms: {counts ? counts.shake : '…'}</div>
                </div>
                <Button onClick={() => onCreate('shake')} disabled={creating.shake}>
                  {creating.shake ? 'Creating…' : 'Create room'}
                </Button>
              </div>
              {/* <div className="text-xs text-muted-foreground">
              Room URL format (for QR later): {origin ? `${origin}/room/XXXXXX` : "/room/XXXXXX"}
            </div> */}
            </div>

            <div className="border border-white/20 bg-black/25 rounded-md p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-[#facc15]">🍳 Vegas Pan Flip</div>
                  <div className="text-sm text-zinc-300">Active rooms: {counts ? counts.flip : '…'}</div>
                </div>
                <Button onClick={() => onCreate('flip')} disabled={creating.flip}>
                  {creating.flip ? 'Creating…' : 'Create room'}
                </Button>
              </div>
              {/* <div className="text-xs text-muted-foreground">
              Room URL format (for QR later): {origin ? `${origin}/room/XXXXXX` : "/room/XXXXXX"}
            </div> */}
            </div>

            <div className="border border-white/20 bg-black/25 rounded-md p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-[#facc15]">🪙 Poker Chip Tap</div>
                  <div className="text-sm text-zinc-300">Active rooms: {counts ? counts.tap : '…'}</div>
                </div>
                <Button onClick={() => onCreate('tap')} disabled={creating.tap}>
                  {creating.tap ? 'Creating…' : 'Create room'}
                </Button>
              </div>
            </div>

            <div className="border border-white/20 bg-black/25 rounded-md p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-[#facc15]">🍺 Kanpai Timing</div>
                  <div className="text-sm text-zinc-300">Active rooms: {counts ? (counts as any).kanpai : '…'}</div>
                </div>
                <Button onClick={() => onCreate('kanpai')} disabled={creating.kanpai}>
                  {creating.kanpai ? 'Creating…' : 'Create room'}
                </Button>
              </div>
            </div>

            <div className="border border-white/20 bg-black/25 rounded-md p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-[#facc15]">🥢 Chopstick Catch</div>
                  <div className="text-sm text-zinc-300">Active rooms: {counts ? (counts as any).chopstick : '…'}</div>
                </div>
                <Button onClick={() => onCreate('chopstick')} disabled={creating.chopstick}>
                  {creating.chopstick ? 'Creating…' : 'Create room'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="border border-white/20 bg-black/30 rounded-md p-3 text-sm">
            <div className="font-medium">Error</div>
            <div className="text-white/70 wrap-break-word">{error}</div>
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-medium text-[#facc15]">Your rooms</h2>

          {!rooms ? (
            <div className="text-sm text-zinc-300">Loading rooms…</div>
          ) : rooms.length === 0 ? (
            <div className="text-sm text-zinc-300">No rooms yet. Create one above.</div>
          ) : (
            <div className="border border-white/20 rounded-md divide-y divide-white/10 bg-black/25">
              {rooms.map((room) => {
                const roomUrl = origin ? `${origin}/room/${room.code}` : `/room/${room.code}`
                return (
                  <div key={room._id} className="p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-medium">
                          {formatGame(room.game)} · {room.code}
                        </div>
                        <div className="text-sm text-zinc-300">Status: {room.status}</div>
                      </div>

                      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                        {/* QR code */}
                        <div className="border rounded-md p-2 ml-6 bg-white shrink-0" title="Scan to open room URL">
                          {origin ? <QRCode value={roomUrl} size={84} /> : <div className="h-[84px] w-[84px]" />}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button asChild variant="outline" size="default">
                            <Link href={`/host/rooms/${room.code}`}>Manage</Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="default"
                            className="text-yellow-200 border-yellow-300/80 hover:bg-yellow-300/15"
                            onClick={() => onDeleteRoom(room.code)}
                            disabled={deletingCode === room.code}
                          >
                            {deletingCode === room.code ? 'Deleting…' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-400 break-all">{roomUrl}</div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <Link className="text-sm underline text-[#facc15]" href="/">
          Back
        </Link>
      </div>
    </main>
  )
}
