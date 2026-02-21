'use client'

import { useAction, useMutation, useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import QRCode from 'react-qr-code'

import { Button } from '@/components/common/button'
import { PUNISHMENT_CARDS, VEGAS_VENUES, type RewardMode, type VegasVenue } from '@/data/vegas-options'
import { api } from '@packages/backend/convex/_generated/api'

function formatGame(game: string | undefined) {
  if (game === 'shake') return 'Rebel Shake'
  if (game === 'flip') return 'Vegas Pan Flip'
  if (game === 'tap') return 'Poker Chip Tap'
  if (game === 'kanpai') return 'Kanpai Timing'
  if (game === 'chopstick') return 'Chopstick Catch'
  return 'unknown'
}

export default function HostRoomManagePage() {
  const params = useParams<{ code: string }>()
  const code = (params?.code ?? '').toUpperCase()

  const router = useRouter()

  const room = useQuery(api.rooms.getRoomByCode, code ? { code } : 'skip')
  const isHost = useQuery(api.rooms.isHostForRoom, code ? { code } : 'skip')

  const deleteRoom = useMutation(api.rooms.deleteRoom)
  const setPartySetup = useMutation((api as any).rooms.setPartySetup)
  const generateVegasOptions = useAction((api as any).rooms.generateVegasOptions)
  const [deleting, setDeleting] = useState(false)
  const [savingSetup, setSavingSetup] = useState(false)
  const [generatingKind, setGeneratingKind] = useState<'venues' | 'punishments' | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [setupSavedLabel, setSetupSavedLabel] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiModel, setAiModel] = useState('Qwen/Qwen2.5-32B-Instruct')
  const [aiRequest, setAiRequest] = useState('')
  const [rewardMode, setRewardMode] = useState<RewardMode>('combo')
  const [selectedVenueIds, setSelectedVenueIds] = useState<string[]>(VEGAS_VENUES.slice(0, 4).map((v) => v.id))
  const [punishmentCards, setPunishmentCards] = useState<string[]>(PUNISHMENT_CARDS.slice(0, 3))
  const [customVenues, setCustomVenues] = useState<VegasVenue[]>([])
  const [newVenueName, setNewVenueName] = useState('')
  const [newVenueMapsUrl, setNewVenueMapsUrl] = useState('')
  const [newPunishment, setNewPunishment] = useState('')

  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const roomUrl = useMemo(() => {
    if (!code) return ''
    return origin ? `${origin}/room/${code}` : `/room/${code}`
  }, [origin, code])

  const existingSetup = (room as any)?.state?.partySetup as
    | { rewardMode?: RewardMode; venueIds?: string[]; punishmentCards?: string[]; customVenues?: VegasVenue[] }
    | undefined

  useEffect(() => {
    if (!existingSetup) return
    if (existingSetup.rewardMode) setRewardMode(existingSetup.rewardMode)
    if (Array.isArray(existingSetup.venueIds) && existingSetup.venueIds.length > 0) {
      setSelectedVenueIds(existingSetup.venueIds.slice(0, 8))
    }
    if (Array.isArray(existingSetup.punishmentCards) && existingSetup.punishmentCards.length > 0) {
      setPunishmentCards(existingSetup.punishmentCards.slice(0, 8))
    }
    if (Array.isArray(existingSetup.customVenues) && existingSetup.customVenues.length > 0) {
      setCustomVenues(existingSetup.customVenues.slice(0, 20))
    }
  }, [existingSetup])

  const allVenueOptions = useMemo(() => {
    return [...VEGAS_VENUES, ...customVenues]
  }, [customVenues])

  async function onDeleteRoom() {
    if (!room) return
    if (!isHost) return
    const ok = window.confirm(`Delete room ${code}? This cannot be undone.`)
    if (!ok) return

    try {
      setDeleteError(null)
      setDeleting(true)
      await deleteRoom({ code })
      router.push('/host')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setDeleteError(message)
    } finally {
      setDeleting(false)
    }
  }

  async function onSaveSetup() {
    try {
      setSetupError(null)
      setSetupSavedLabel(null)
      setSavingSetup(true)
      await setPartySetup({
        code,
        rewardMode,
        venueIds: selectedVenueIds,
        punishmentCards,
        customVenues,
      })
      setSetupSavedLabel('Saved')
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingSetup(false)
    }
  }

  async function onGenerateVenues() {
    try {
      setAiError(null)
      setGeneratingKind('venues')
      const result = await generateVegasOptions({
        code,
        mode: 'venues',
        existingVenueNames: allVenueOptions.map((v) => v.name),
        existingPunishments: punishmentCards,
        model: aiModel.trim() || undefined,
        customRequest: aiRequest.trim() || undefined,
      })
      const generated = Array.isArray(result?.venues) ? (result.venues as VegasVenue[]) : []
      if (generated.length === 0) throw new Error('No venue suggestions returned')
      setCustomVenues((prev) => [...prev, ...generated].slice(0, 20))
      setSelectedVenueIds((prev) => [...prev, ...generated.map((v) => v.id)].slice(0, 8))
      setSetupSavedLabel('AI venues added. Save to persist.')
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err))
    } finally {
      setGeneratingKind(null)
    }
  }

  async function onGeneratePunishments() {
    try {
      setAiError(null)
      setGeneratingKind('punishments')
      const result = await generateVegasOptions({
        code,
        mode: 'punishments',
        existingVenueNames: allVenueOptions.map((v) => v.name),
        existingPunishments: punishmentCards,
        model: aiModel.trim() || undefined,
        customRequest: aiRequest.trim() || undefined,
      })
      const generated = (Array.isArray(result?.punishments) ? result.punishments : [])
        .map((p: string) => p.trim())
        .filter(Boolean)
      if (generated.length === 0) throw new Error('No punishment suggestions returned')
      setPunishmentCards((prev) => [...prev, ...generated].slice(0, 8))
      setSetupSavedLabel('AI punishments added. Save to persist.')
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err))
    } finally {
      setGeneratingKind(null)
    }
  }

  const selectedVenueCount = selectedVenueIds.length
  const selectedPunishmentCount = punishmentCards.length
  const needsVenue = rewardMode === 'venue' || rewardMode === 'combo'
  const needsPunishment = rewardMode === 'punishment' || rewardMode === 'combo'
  const canSaveSetup =
    !savingSetup && (!needsVenue || selectedVenueIds.length > 0) && (!needsPunishment || punishmentCards.length > 0)

  return (
    <main className="min-h-dvh p-4 bg-[#0f1115]">
      <div className="max-w-5xl w-full mx-auto space-y-6 text-zinc-100">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[#facc15]">Room {code}</h1>
          <p className="text-sm text-zinc-300">Set your party reward rules, then start the game.</p>
        </div>

        {!room ? (
          <div className="text-sm text-white/70">Loading room…</div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="border border-[#eab308]/55 bg-black/30 rounded-xl p-4 space-y-4">
              <div className="space-y-1">
                <div className="text-sm text-zinc-400">Game</div>
                <div className="font-medium text-[#facc15]">{formatGame(room.game)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-zinc-400">Status</div>
                <div className="font-medium">{room.status}</div>
              </div>

              <div className="border rounded-lg p-3 bg-white w-fit mx-auto">
                {origin ? <QRCode value={roomUrl} size={220} /> : <div className="h-[220px] w-[220px]" />}
              </div>

              <Button asChild className="w-full">
                <Link href={roomUrl}>Open room</Link>
              </Button>
              <div className="text-xs text-zinc-400 text-center">Players scan QR and auto-join this room.</div>
            </div>

            <div className="relative border border-[#eab308]/55 bg-black/25 rounded-xl p-4 md:p-5 space-y-4">
              {generatingKind && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-xl bg-black/70 backdrop-blur-sm">
                  <div className="relative h-10 w-10">
                    <div className="absolute inset-0 rounded-full border-2 border-[#eab308]/30" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#facc15] animate-spin" />
                  </div>
                  <div className="text-sm font-medium text-[#facc15]">
                    Generating {generatingKind === 'venues' ? 'venue picks' : 'punishments'}…
                  </div>
                  <div className="text-xs text-zinc-400">This can take up to 30 seconds</div>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-[#facc15] font-semibold">Party Setup (Free)</div>
                  <div className="text-xs text-zinc-400">Static Vegas pool + optional AI Vegas generator.</div>
                </div>
                <div className="text-xs rounded-full border border-[#eab308]/70 px-3 py-1 bg-[#eab308]/20 text-[#facc15]">
                  {selectedVenueCount} places · {selectedPunishmentCount} punishments
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                <select
                  className="w-full h-9 rounded-md border border-white/25 bg-black/30 px-2 text-xs text-zinc-100"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                >
                  <optgroup label="Qwen">
                    <option value="Qwen/Qwen2.5-32B-Instruct">Qwen 2.5 32B Instruct</option>
                    <option value="Qwen/Qwen2.5-7B-Instruct">Qwen 2.5 7B Instruct</option>
                    <option value="Qwen/Qwen2.5-3B-Instruct">Qwen 2.5 3B Instruct</option>
                    <option value="Qwen/Qwen2.5-1.5B-Instruct">Qwen 2.5 1.5B Instruct</option>
                    <option value="Qwen/Qwen3-8B">Qwen 3 8B</option>
                    <option value="Qwen/Qwen3-4B">Qwen 3 4B</option>
                    <option value="Qwen/Qwen3-1.7B">Qwen 3 1.7B</option>
                    <option value="Qwen/Qwen3-0.6B">Qwen 3 0.6B</option>
                  </optgroup>
                  <optgroup label="Llama">
                    <option value="meta-llama/Meta-Llama-3.1-8B-Instruct">Llama 3.1 8B Instruct</option>
                    <option value="meta-llama/Llama-3.1-8B-Instruct">Llama 3.1 8B Instruct (alt)</option>
                    <option value="meta-llama/Llama-3.2-1B-Instruct">Llama 3.2 1B Instruct</option>
                  </optgroup>
                  <optgroup label="Deepseek">
                    <option value="deepseek-ai/DeepSeek-R1-Distill-Qwen-32B">DeepSeek R1 32B</option>
                    <option value="deepseek-ai/DeepSeek-R1-Distill-Qwen-7B">DeepSeek R1 7B</option>
                  </optgroup>
                  <optgroup label="Mistral">
                    <option value="mistralai/Mistral-7B-Instruct-v0.2">Mistral 7B Instruct v0.2</option>
                  </optgroup>
                </select>
                <div className="text-[11px] text-zinc-400 md:text-right">
                  Featherless AI model
                </div>
              </div>
              <input
                className="w-full h-9 rounded-md border border-white/25 bg-black/30 px-2 text-xs placeholder:text-zinc-500"
                placeholder="Your tags or keywords to guide the AI (e.g. kbbq, rooftop bars, spicy punishments)"
                value={aiRequest}
                onChange={(e) => setAiRequest(e.target.value)}
              />

              {isHost ? (
                <>
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-400">Reward mode</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'venue', label: 'Venue only' },
                        { id: 'punishment', label: 'Punishment only' },
                        { id: 'combo', label: 'Both' },
                      ].map((mode) => {
                        const active = rewardMode === mode.id
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setRewardMode(mode.id as RewardMode)}
                            className={`h-10 rounded-md border text-sm transition ${
                              active
                                ? 'border-[#eab308] bg-[#eab308]/20 text-[#facc15]'
                                : 'border-white/20 bg-black/20 text-zinc-300 hover:bg-black/35'
                            }`}
                          >
                            {mode.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {needsVenue && (
                    <div className="space-y-2 rounded-lg border border-[#eab308]/55 bg-[#eab308]/10 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-zinc-300">Restaurants / Places</div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-zinc-400">{selectedVenueCount}/8 selected</div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={onGenerateVenues}
                            disabled={generatingKind !== null}
                          >
                            {generatingKind === 'venues' ? 'Generating…' : 'AI Vegas picks'}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
                        {allVenueOptions.map((venue) => {
                          const checked = selectedVenueIds.includes(venue.id)
                          return (
                            <label
                              key={venue.id}
                              className={`rounded-md border p-2.5 flex gap-2 cursor-pointer transition ${
                                checked
                                  ? 'border-[#eab308]/85 bg-[#eab308]/20'
                                  : 'border-white/20 bg-black/20 hover:bg-black/35'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedVenueIds((prev) => {
                                    if (e.target.checked) return [...prev, venue.id].slice(0, 8)
                                    return prev.filter((id) => id !== venue.id)
                                  })
                                }}
                                className="mt-0.5"
                              />
                              <div className="min-w-0">
                                <div className="text-sm text-white">{venue.name}</div>
                                <div className="text-[11px] text-white/65">
                                  {venue.area} · {venue.vibe}
                                </div>
                              </div>
                            </label>
                          )
                        })}
                      </div>

                      <div className="rounded-md border border-white/20 bg-black/20 p-2.5 space-y-2">
                        <div className="text-xs text-[#facc15]">Add custom place</div>
                        <input
                          className="w-full h-9 rounded-md border border-white/25 bg-black/40 px-2 text-sm"
                          placeholder="Place name (required)"
                          value={newVenueName}
                          onChange={(e) => setNewVenueName(e.target.value)}
                        />
                        <input
                          className="w-full h-9 rounded-md border border-white/25 bg-black/40 px-2 text-sm"
                          placeholder="Maps URL (optional)"
                          value={newVenueMapsUrl}
                          onChange={(e) => setNewVenueMapsUrl(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const name = newVenueName.trim()
                            if (!name) return
                            const id = `custom-${Date.now().toString(36)}`
                            const nextVenue: VegasVenue = {
                              id,
                              name,
                              area: 'Custom',
                              vibe: 'crew pick',
                              mapsUrl: newVenueMapsUrl.trim() || '',
                            }
                            setCustomVenues((prev) => [...prev, nextVenue].slice(0, 20))
                            setSelectedVenueIds((prev) => [...prev, id].slice(0, 8))
                            setNewVenueName('')
                            setNewVenueMapsUrl('')
                          }}
                        >
                          Add place
                        </Button>
                      </div>
                    </div>
                  )}

                  {needsPunishment && (
                    <div className="space-y-2 rounded-lg border border-[#eab308]/55 bg-[#eab308]/10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-zinc-300">Punishment cards</div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={onGeneratePunishments}
                          disabled={generatingKind !== null}
                        >
                          {generatingKind === 'punishments' ? 'Generating…' : 'AI punishments'}
                        </Button>
                      </div>
                      <div className="grid gap-2">
                        {punishmentCards.map((card) => (
                          <div
                            key={card}
                            className="text-xs rounded-md border border-white/20 bg-black/20 px-3 py-2 flex justify-between gap-2"
                          >
                            <span>{card}</span>
                            <button
                              type="button"
                              className="text-white/60 hover:text-white"
                              onClick={() => setPunishmentCards((prev) => prev.filter((c) => c !== card))}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          className="w-full h-10 rounded-md border border-white/25 bg-black/40 px-3 text-sm"
                          placeholder="Add custom punishment"
                          value={newPunishment}
                          onChange={(e) => setNewPunishment(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const next = newPunishment.trim()
                            if (!next) return
                            setPunishmentCards((prev) => [...prev, next].slice(0, 8))
                            setNewPunishment('')
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <Button onClick={onSaveSetup} disabled={!canSaveSetup} size="default">
                      {savingSetup ? 'Saving…' : 'Save'}
                    </Button>
                    {setupSavedLabel && <div className="text-xs text-emerald-200">{setupSavedLabel}</div>}
                  </div>
                  {aiError && <div className="text-xs text-rose-200">{aiError}</div>}
                  {setupError && <div className="text-xs text-rose-200">{setupError}</div>}

                  <div className="pt-2 border-t border-white/15">
                    {deleteError && <div className="text-sm text-zinc-300 mb-2 wrap-break-word">{deleteError}</div>}
                    <Button variant="destructive" onClick={onDeleteRoom} disabled={deleting} size="default">
                      {deleting ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-sm text-zinc-300">Host-only controls.</div>
              )}
            </div>
          </section>
        )}

        <Link className="text-sm underline text-[#facc15]" href="/host">
          Back
        </Link>
      </div>
    </main>
  )
}
