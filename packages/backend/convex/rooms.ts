import { v } from 'convex/values'

import { api } from './_generated/api'
import { action, mutation, query } from './_generated/server'
import { gameValidator } from './schema'
import { getRoomByCode as getRoomByCodeFromDb, getUserId, requireUserId } from './utils'

type Game = 'shake' | 'flip' | 'tap' | 'kanpai' | 'chopstick'
type RoomStatus = 'lobby' | 'playing' | 'finished'
const SHAKE_PREP_COUNTDOWN_MS = 5000

const roomStatusValidator = v.union(v.literal('lobby'), v.literal('playing'), v.literal('finished'))
const rewardModeValidator = v.union(v.literal('venue'), v.literal('punishment'), v.literal('combo'))
const featherlessModelValidator = v.optional(v.string())

function parseJsonObject(text: string) {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1))
    }
    throw new Error('Model did not return valid JSON')
  }
}

function getPlayerScore(player: any, game: Game | undefined) {
  const gameKey =
    game === 'tap'
      ? 'tap'
      : game === 'kanpai'
        ? 'kanpai'
        : game === 'chopstick'
          ? 'chopstick'
          : 'shake'
  const scoreNode = player?.data && typeof player.data === 'object' ? (player.data as any)[gameKey] : null
  return typeof scoreNode?.count === 'number' ? scoreNode.count : 0
}

function generateRoomCode(length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) result += alphabet[Math.floor(Math.random() * alphabet.length)]
  return result
}

/**
 * MUTATIONS
 *
 *
 *
 */
export const createRoom = mutation({
  args: {
    game: gameValidator,
  },
  handler: async (ctx, args) => {
    const hostUserId = await requireUserId(ctx)

    let code = ''
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateRoomCode()
      const existing = await ctx.db
        .query('rooms')
        .withIndex('by_code', (q) => q.eq('code', candidate))
        .unique()
      if (!existing) {
        code = candidate
        break
      }
    }

    if (!code) throw new Error('Failed to generate unique room code')

    const now = Date.now()
    const roomId = await ctx.db.insert('rooms', {
      code,
      hostUserId,
      game: args.game,
      status: 'lobby' satisfies RoomStatus,
      createdAt: now,
    })

    return { roomId, code }
  },
})

export const getRoomByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await getRoomByCodeFromDb(ctx, args.code)
    return room ?? null
  },
})

export const isHostForRoom = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx)
    if (!userId) return false

    const room = await getRoomByCodeFromDb(ctx, args.code)

    if (!room) return false
    return room.hostUserId === userId
  },
})

export const getRoomByCodeForHost = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const hostUserId = await requireUserId(ctx)
    const room = await getRoomByCodeFromDb(ctx, args.code)

    if (!room) return null
    if (room.hostUserId !== hostUserId) throw new Error('Not authorized')
    return room
  },
})

export const setRoomStatus = mutation({
  args: {
    code: v.string(),
    status: roomStatusValidator,
  },
  handler: async (ctx, args) => {
    const hostUserId = await requireUserId(ctx)
    const room = await getRoomByCodeFromDb(ctx, args.code)
    const now = Date.now()

    if (!room) throw new Error('Room not found')
    if (room.hostUserId !== hostUserId) throw new Error('Not authorized')

    const nextState = room.state && typeof room.state === 'object' ? (room.state as any) : {}
    await ctx.db.patch(room._id, {
      status: args.status,
      ...(args.status === 'playing'
        ? {
            state: {
              ...nextState,
              countdownMs: SHAKE_PREP_COUNTDOWN_MS,
              countdownStartedAt: now,
              startedAt: now + SHAKE_PREP_COUNTDOWN_MS,
              partyOutcome: null,
            },
          }
        : args.status === 'lobby'
          ? {
              state: {
                ...nextState,
                countdownMs: SHAKE_PREP_COUNTDOWN_MS,
                countdownStartedAt: null,
                startedAt: null,
                partyOutcome: null,
              },
            }
          : {}),
    })

    if (
      args.status === 'lobby' &&
      (room.game === 'shake' || room.game === 'flip' || room.game === 'tap' || room.game === 'kanpai' || room.game === 'chopstick')
    ) {
      const players = await ctx.db
        .query('players')
        .withIndex('by_roomId', (q) => q.eq('roomId', room._id))
        .collect()

      for (const player of players) {
        const existingData = player.data && typeof player.data === 'object' ? (player.data as any) : {}
        const scoreKey =
          room.game === 'tap'
            ? 'tap'
            : room.game === 'kanpai'
              ? 'kanpai'
              : room.game === 'chopstick'
                ? 'chopstick'
                : 'shake'
        const nextData = {
          ...existingData,
          [scoreKey]: {
            count: 0,
          },
        }
        await ctx.db.patch(player._id, {
          data: nextData,
        })
      }
    }
  },
})

export const setPartySetup = mutation({
  args: {
    code: v.string(),
    rewardMode: rewardModeValidator,
    venueIds: v.array(v.string()),
    punishmentCards: v.array(v.string()),
    customVenues: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          area: v.string(),
          vibe: v.string(),
          mapsUrl: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const hostUserId = await requireUserId(ctx)
    const room = await getRoomByCodeFromDb(ctx, args.code)
    if (!room) throw new Error('Room not found')
    if (room.hostUserId !== hostUserId) throw new Error('Not authorized')

    const nextState = room.state && typeof room.state === 'object' ? (room.state as any) : {}
    await ctx.db.patch(room._id, {
      state: {
        ...nextState,
        partySetup: {
          rewardMode: args.rewardMode,
          venueIds: args.venueIds.slice(0, 8),
          punishmentCards: args.punishmentCards
            .map((p) => p.trim())
            .filter(Boolean)
            .slice(0, 8),
          customVenues: (args.customVenues ?? [])
            .map((venue) => ({
              id: venue.id.trim(),
              name: venue.name.trim(),
              area: venue.area.trim() || 'Custom',
              vibe: venue.vibe.trim() || 'crew pick',
              mapsUrl: venue.mapsUrl.trim(),
            }))
            .filter((venue) => venue.id && venue.name)
            .slice(0, 20),
        },
      },
    })
  },
})

export const setPartyOutcome = mutation({
  args: {
    code: v.string(),
    guestId: v.optional(v.string()),
    selectedVenueId: v.optional(v.string()),
    selectedPunishment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const room = await getRoomByCodeFromDb(ctx, args.code)
    if (!room) throw new Error('Room not found')
    if (room.status !== 'finished') throw new Error('Game must be finished first')

    const players = await ctx.db
      .query('players')
      .withIndex('by_roomId', (q) => q.eq('roomId', room._id))
      .collect()
    if (players.length === 0) throw new Error('No players found')

    let actor: any = null
    const userId = await getUserId(ctx)
    if (userId) {
      actor = players.find((p) => p.userId === userId) ?? null
    } else if (args.guestId) {
      actor = players.find((p) => p.guestId === args.guestId) ?? null
    }
    if (!actor) throw new Error('Only a room player can choose outcome')

    const game = (room.game as Game | undefined) ?? undefined
    const top = players.reduce((max, p) => Math.max(max, getPlayerScore(p, game)), 0)
    const winners = players.filter((p) => getPlayerScore(p, game) === top && top > 0)
    const isWinner = winners.some((w) => w._id === actor._id)
    if (!isWinner) throw new Error('Only winner can set outcome')

    const nextState = room.state && typeof room.state === 'object' ? (room.state as any) : {}
    const existingOutcome = nextState.partyOutcome && typeof nextState.partyOutcome === 'object' ? nextState.partyOutcome : {}
    if (existingOutcome.selectedVenueId || existingOutcome.selectedPunishment) {
      throw new Error('Outcome already locked by winner')
    }
    await ctx.db.patch(room._id, {
      state: {
        ...nextState,
        partyOutcome: {
          selectedVenueId: args.selectedVenueId ?? null,
          selectedPunishment: args.selectedPunishment ?? null,
          selectedByPlayerId: actor._id,
          selectedAt: Date.now(),
        },
      },
    })
  },
})

export const generateVegasOptions = action({
  args: {
    code: v.string(),
    mode: v.union(v.literal('venues'), v.literal('punishments'), v.literal('both')),
    existingVenueNames: v.optional(v.array(v.string())),
    existingPunishments: v.optional(v.array(v.string())),
    model: featherlessModelValidator,
    customRequest: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.runQuery((api as any).rooms.getRoomByCodeForHost, { code: args.code })
    if (!room) throw new Error('Room not found')

    const apiKey = process.env.FEATHERLESS_API_KEY ?? process.env.FEATHEARLESS_API_KEY
    if (!apiKey) {
      throw new Error('Missing FEATHERLESS_API_KEY (or FEATHEARLESS_API_KEY) on Convex server env')
    }

    const model = args.model?.trim() || 'Qwen/Qwen2.5-32B-Instruct'
    const existingVenueNames = (args.existingVenueNames ?? []).map((s) => s.trim()).filter(Boolean)
    const existingPunishments = (args.existingPunishments ?? []).map((s) => s.trim()).filter(Boolean)
    const wantsVenues = args.mode === 'venues' || args.mode === 'both'
    const wantsPunishments = args.mode === 'punishments' || args.mode === 'both'

    const systemPrompt =
      'You generate structured game setup content. Output strict JSON only, no markdown. Keep content concise and PG-13.'
    const userPrompt = [
      'Generate options for a Las Vegas themed party game.',
      wantsVenues ? 'Return 8 unique, real-feeling Las Vegas place options (restaurant/bar/activity/night spot).' : '',
      wantsPunishments ? 'Return 8 unique punishment card prompts suitable for friends (safe/funny).' : '',
      'Rules:',
      '- Everything must be Las Vegas themed or clearly plausible in Las Vegas.',
      '- Avoid duplicates with existing data.',
      '- Keep names readable on mobile.',
      '- For venues include: name, area, vibe, mapsUrl (maps URL can be blank).',
      `Existing venue names: ${existingVenueNames.join(' | ') || '(none)'}`,
      `Existing punishment cards: ${existingPunishments.join(' | ') || '(none)'}`,
      args.customRequest?.trim() ? `Additional request from host: ${args.customRequest.trim()}` : '',
      'JSON schema:',
      '{ "venues": [{"name":"", "area":"", "vibe":"", "mapsUrl":""}], "punishments": [""] }',
    ]
      .filter(Boolean)
      .join('\n')

    const response = await fetch('https://api.featherless.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Featherless request failed (${response.status}): ${text.slice(0, 240)}`)
    }
    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Featherless response missing assistant content')
    }

    const parsed = parseJsonObject(content) as {
      venues?: Array<{ name?: string; area?: string; vibe?: string; mapsUrl?: string }>
      punishments?: string[]
    }

    const venues = (parsed.venues ?? [])
      .map((v) => ({
        id: `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        name: (v.name ?? '').trim(),
        area: (v.area ?? '').trim() || 'Las Vegas',
        vibe: (v.vibe ?? '').trim() || 'party pick',
        mapsUrl: (v.mapsUrl ?? '').trim(),
      }))
      .filter((v) => v.name)
      .slice(0, 8)

    const punishments = (parsed.punishments ?? [])
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 8)

    return { venues, punishments, modelUsed: model }
  },
})

export const deleteRoom = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const hostUserId = await requireUserId(ctx)
    const room = await getRoomByCodeFromDb(ctx, args.code)
    if (!room) throw new Error('Room not found')
    if (room.hostUserId !== hostUserId) throw new Error('Not authorized')

    const players = await ctx.db
      .query('players')
      .withIndex('by_roomId', (q) => q.eq('roomId', room._id))
      .collect()
    for (const player of players) {
      await ctx.db.delete(player._id)
    }

    const joinStatuses = ['pending', 'approved', 'denied'] as const
    for (const status of joinStatuses) {
      const joinRequests = await ctx.db
        .query('joinRequests')
        .withIndex('by_roomId_status', (q) => q.eq('roomId', room._id).eq('status', status))
        .collect()
      for (const req of joinRequests) {
        await ctx.db.delete(req._id)
      }
    }

    await ctx.db.delete(room._id)
    return { roomId: room._id }
  },
})

/**
 * QUERIES
 *
 *
 */
export const listRoomsForHost = query({
  args: {
    includeFinished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const hostUserId = await requireUserId(ctx)
    const rooms = await ctx.db
      .query('rooms')
      .withIndex('by_hostUserId', (q) => q.eq('hostUserId', hostUserId))
      .order('desc')
      .collect()

    const includeFinished = args.includeFinished ?? true
    return includeFinished ? rooms : rooms.filter((r) => r.status !== 'finished')
  },
})

export const hostRoomCountsByGame = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const hostUserId = await requireUserId(ctx)
    const rooms = await ctx.db
      .query('rooms')
      .withIndex('by_hostUserId', (q) => q.eq('hostUserId', hostUserId))
      .collect()

    const activeOnly = args.activeOnly ?? true

    const counts: Record<Game | 'unknown', number> = {
      shake: 0,
      flip: 0,
      tap: 0,
      kanpai: 0,
      chopstick: 0,
      unknown: 0,
    }

    for (const room of rooms) {
      if (activeOnly && room.status === 'finished') continue
      const game = (room.game ?? 'unknown') as Game | 'unknown'
      counts[game] = (counts[game] ?? 0) + 1
    }

    return counts
  },
})
