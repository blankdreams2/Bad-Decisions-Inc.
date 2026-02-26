'use client'

import { useAction, useMutation, useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import QRCode from 'react-qr-code'

import BdiLogo from '@/components/common/bdiLogo'
import { Button } from '@/components/common/button'
import { ConfirmPopover } from '@/components/common/confirm-popover'
import { AiModelSelector } from '@/components/host/ai-model-selector'
import { GAME_META, type Game } from '@/data/game-meta'
import { PUNISHMENT_CARDS, VEGAS_VENUES, type RewardMode, type VegasVenue } from '@/data/vegas-options'
import { api } from '@packages/backend/convex/_generated/api'

function formatGame(game: string | undefined): string {
  return game ? (GAME_META[game as Game]?.label ?? 'Unknown') : 'Unknown'
}

export default function HostRoomManagePage() {
  const router = useRouter()
  const params = useParams<{ code: string }>()
  const code = (params?.code ?? '').toUpperCase()

  /* queries */
  const room = useQuery(api.rooms.getRoomByCode, code ? { code } : 'skip')
  const isHost = useQuery(api.rooms.isHostForRoom, code ? { code } : 'skip')

  /* mutations */
  const deleteRoom = useMutation(api.rooms.deleteRoom)
  const setPartySetup = useMutation((api as any).rooms.setPartySetup)
  const generateVegasOptions = useAction((api as any).rooms.generateVegasOptions)

  /* states */
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

  const allVenueOptions = useMemo(() => [...VEGAS_VENUES, ...customVenues], [customVenues])

  const onDeleteRoom = async () => {
    if (!room || !isHost) return
    try {
      setDeleteError(null)
      setDeleting(true)
      await deleteRoom({ code })
      router.push('/host')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err))
    } finally {
      setDeleting(false)
    }
  }

  const onSaveSetup = async () => {
    try {
      setSetupError(null)
      setSetupSavedLabel(null)
      setSavingSetup(true)
      await setPartySetup({ code, rewardMode, venueIds: selectedVenueIds, punishmentCards, customVenues })
      setSetupSavedLabel('Saved')
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingSetup(false)
    }
  }

  const onGenerateVenues = async () => {
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

  const onGeneratePunishments = async () => {
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

  const gameMeta = room ? (GAME_META[room.game as Game] ?? GAME_META.shake) : GAME_META.shake
  const isActive = room ? room.status === 'lobby' || room.status === 'playing' : false

  return (
    <main className="min-h-dvh bg-midnight">
      {/* ── top bar ── */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-midnight/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/host" className="group flex items-center gap-2">
            <BdiLogo multicolor size={24} />
            <span className="font-syne text-xs font-bold tracking-wide text-white sm:text-sm">Room {code}</span>
          </Link>
          <Link href="/host" className="text-xs text-white/40 transition-colors hover:text-white">
            Back
          </Link>
        </div>
      </header>

      {!room ? (
        <div className="flex min-h-[50dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      ) : (
        <div className="mx-auto max-w-2xl px-4 pb-8">
          {/* ── room info card ── */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-white/8 bg-surface">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-white/15'}`}
                />
                <div>
                  <span className={`text-sm font-semibold ${gameMeta.accent}`}>{formatGame(room.game)}</span>
                  <span className="ml-2 font-mono text-xs text-white/30">{code}</span>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${isActive ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/25'}`}
              >
                {room.status}
              </span>
            </div>

            <div className="flex flex-col items-center gap-4 border-t border-white/5 px-4 py-5 sm:flex-row sm:justify-between">
              <div className="shrink-0 rounded-xl bg-white p-2">
                {origin ? <QRCode value={roomUrl} size={270} /> : <div className="h-[250px] w-[250px]" />}
              </div>
              <div className="flex flex-1 flex-col items-center gap-2 sm:items-end">
                <Button asChild className="w-full sm:w-auto">
                  <Link href={roomUrl}>Open Room</Link>
                </Button>
                <p className="text-center text-[10px] text-white/20 sm:text-right">Players scan QR to auto-join</p>
              </div>
            </div>
          </section>

          {/* ── host controls ── */}
          {isHost ? (
            <>
              {/* ── ai model + prompt ── */}
              <section className="mt-6">
                <h2 className="mb-3 text-xs font-semibold tracking-widest text-white/30 uppercase">AI Generator</h2>
                <div className="space-y-3 rounded-2xl border border-white/8 bg-surface p-4">
                  {generatingKind && (
                    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3">
                      <div className="relative h-5 w-5">
                        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-white" />
                      </div>
                      <p className="text-xs text-white/60">
                        Generating {generatingKind === 'venues' ? 'venue picks' : 'punishments'}...
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-[11px] text-white/30">Featherless AI model</label>
                    <AiModelSelector value={aiModel} onChange={setAiModel} />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] text-white/30">Keywords / tags</label>
                    <input
                      className="h-9 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-xs text-white outline-none transition-colors placeholder:text-white/20 focus:border-white/25"
                      placeholder="e.g. kbbq, rooftop bars, spicy punishments"
                      value={aiRequest}
                      onChange={(e) => setAiRequest(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={onGenerateVenues}
                      disabled={generatingKind !== null}
                      className="flex-1"
                    >
                      {generatingKind === 'venues' ? 'Generating...' : 'AI Venues'}
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={onGeneratePunishments}
                      disabled={generatingKind !== null}
                      className="flex-1"
                    >
                      {generatingKind === 'punishments' ? 'Generating...' : 'AI Punishments'}
                    </Button>
                  </div>

                  {aiError && (
                    <div className="rounded-lg border border-neon/20 bg-neon/5 p-2.5 text-[11px] text-neon">
                      {aiError}
                    </div>
                  )}
                </div>
              </section>

              {/* ── party setup ── */}
              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-semibold tracking-widest text-white/30 uppercase">Party Setup</h2>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/30">
                    {selectedVenueCount} places · {selectedPunishmentCount} punishments
                  </span>
                </div>

                <div className="space-y-4 rounded-2xl border border-white/8 bg-surface p-4">
                  {/* reward mode */}
                  <div>
                    <label className="mb-2 block text-[11px] text-white/30">Reward mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'venue', label: 'Venue' },
                          { id: 'punishment', label: 'Punishment' },
                          { id: 'combo', label: 'Both' },
                        ] as const
                      ).map((mode) => {
                        const active = rewardMode === mode.id
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setRewardMode(mode.id)}
                            className={`h-9 rounded-lg border text-xs font-medium transition-all ${
                              active
                                ? 'border-white/20 bg-white/10 text-white'
                                : 'border-white/8 bg-white/2 text-white/30 hover:bg-white/5 hover:text-white/50'
                            }`}
                          >
                            {mode.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* venues */}
                  {needsVenue && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/30">Restaurants / Places</span>
                        <span className="text-[10px] text-white/20">{selectedVenueCount}/8</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {allVenueOptions.map((venue) => {
                          const checked = selectedVenueIds.includes(venue.id)
                          return (
                            <label
                              key={venue.id}
                              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all ${
                                checked ? 'border-white/15 bg-white/8' : 'border-white/5 bg-white/2 hover:bg-white/5'
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
                                className="mt-0.5 accent-white"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-white/80">{venue.name}</p>
                                <p className="text-[10px] text-white/25">
                                  {venue.area} · {venue.vibe}
                                </p>
                              </div>
                            </label>
                          )
                        })}
                      </div>

                      {/* add custom venue */}
                      <div className="space-y-2 rounded-xl border border-dashed border-white/10 p-3">
                        <p className="text-[11px] font-medium text-white/40">Add custom place</p>
                        <input
                          className="h-8 w-full rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white outline-none placeholder:text-white/15 focus:border-white/20"
                          placeholder="Place name (required)"
                          value={newVenueName}
                          onChange={(e) => setNewVenueName(e.target.value)}
                        />
                        <input
                          className="h-8 w-full rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white outline-none placeholder:text-white/15 focus:border-white/20"
                          placeholder="Maps URL (optional)"
                          value={newVenueMapsUrl}
                          onChange={(e) => setNewVenueMapsUrl(e.target.value)}
                        />
                        <Button
                          size="sm"
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

                  {/* punishments */}
                  {needsPunishment && (
                    <div className="space-y-3">
                      <span className="text-[11px] text-white/30">Punishment cards</span>
                      <div className="space-y-2">
                        {punishmentCards.map((card) => (
                          <div
                            key={card}
                            className="flex items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/2 px-3 py-2.5"
                          >
                            <span className="text-xs text-white/60">{card}</span>
                            <button
                              type="button"
                              className="shrink-0 text-[10px] text-white/20 transition-colors hover:text-neon"
                              onClick={() => setPunishmentCards((prev) => prev.filter((c) => c !== card))}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white outline-none placeholder:text-white/15 focus:border-white/20"
                          placeholder="Add custom punishment"
                          value={newPunishment}
                          onChange={(e) => setNewPunishment(e.target.value)}
                        />
                        <Button
                          size="sm"
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

                  {/* save */}
                  <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4">
                    <Button onClick={onSaveSetup} disabled={!canSaveSetup}>
                      {savingSetup ? 'Saving...' : 'Save Setup'}
                    </Button>
                    {setupSavedLabel && <span className="text-xs text-emerald-400">{setupSavedLabel}</span>}
                  </div>
                  {setupError && (
                    <div className="rounded-lg border border-neon/20 bg-neon/5 p-2.5 text-[11px] text-neon">
                      {setupError}
                    </div>
                  )}
                </div>
              </section>

              {/* ── danger zone ── */}
              <section className="mt-6">
                <h2 className="mb-3 text-xs font-semibold tracking-widest text-white/30 uppercase">Danger Zone</h2>
                <div className="rounded-2xl border border-neon/10 bg-neon/2 p-4">
                  {deleteError && <p className="mb-3 wrap-break-word text-xs text-neon">{deleteError}</p>}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/50">Delete this room</p>
                      <p className="text-[10px] text-white/20">This cannot be undone</p>
                    </div>
                    <ConfirmPopover
                      title={`Delete room ${code}?`}
                      description="All data will be permanently removed."
                      confirmLabel="Delete"
                      onConfirm={onDeleteRoom}
                    >
                      <Button variant="destructive" size="sm" disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </ConfirmPopover>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <section className="mt-6 rounded-2xl border border-white/8 bg-surface p-6 text-center">
              <p className="text-sm text-white/30">Host-only controls</p>
            </section>
          )}

          {/* ── bottom back link ── */}
          <div className="mt-8 pb-4 text-center">
            <Link href="/host" className="text-xs text-white/25 transition-colors hover:text-white/50">
              Back to dashboard
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
