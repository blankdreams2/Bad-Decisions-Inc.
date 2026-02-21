import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { getRoomByCode, requireUserId } from './utils'

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {}
  return value as Record<string, unknown>
}

export const listByRoomCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await getRoomByCode(ctx, args.code)
    if (!room) return []

    const players = await ctx.db
      .query('players')
      .withIndex('by_roomId', (q: any) => q.eq('roomId', room._id))
      .collect()

    players.sort((a: any, b: any) => {
      const hostDelta = Number(Boolean(b.isHost)) - Number(Boolean(a.isHost))
      if (hostDelta !== 0) return hostDelta
      return (a.joinedAt ?? 0) - (b.joinedAt ?? 0)
    })

    return players
  },
})

export const upsertHostForRoom = mutation({
  args: {
    code: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const room = await getRoomByCode(ctx, args.code)
    if (!room) throw new Error('Room not found')
    if (room.hostUserId !== userId) throw new Error('Not authorized')

    const existing = await ctx.db
      .query('players')
      .withIndex('by_room_user', (q: any) => q.eq('roomId', room._id).eq('userId', userId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        isHost: true,
      })
      return { playerId: existing._id }
    }

    const playerId = await ctx.db.insert('players', {
      roomId: room._id,
      userId,
      name: args.name,
      joinedAt: Date.now(),
      isHost: true,
    })

    return { playerId }
  },
})

export const updateShakeProgress = mutation({
  args: {
    code: v.string(),
    guestId: v.optional(v.string()),
    shakeCount: v.number(),
    finishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const room = await getRoomByCode(ctx, args.code)
    if (!room) throw new Error('Room not found')

    const shakeCount = Math.max(0, Math.floor(args.shakeCount))
    const finishedAt = args.finishedAt

    let player: any = null
    if (args.guestId) {
      player = await ctx.db
        .query('players')
        .withIndex('by_room_guest', (q: any) => q.eq('roomId', room._id).eq('guestId', args.guestId))
        .unique()
    } else {
      const userId = await requireUserId(ctx)
      player = await ctx.db
        .query('players')
        .withIndex('by_room_user', (q: any) => q.eq('roomId', room._id).eq('userId', userId))
        .unique()
    }

    if (!player) throw new Error('Player not found')

    const existingData = asRecord(player.data)
    const existingShake = asRecord(existingData.shake)

    const nextShake = {
      ...existingShake,
      count: shakeCount,
      ...(typeof finishedAt === 'number' ? { finishedAt } : {}),
    }

    await ctx.db.patch(player._id, {
      data: {
        ...existingData,
        shake: nextShake,
      },
    })
  },
})

export const updateTapProgress = mutation({
  args: {
    code: v.string(),
    guestId: v.optional(v.string()),
    tapCount: v.number(),
    finishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const room = await getRoomByCode(ctx, args.code)
    if (!room) throw new Error('Room not found')

    const tapCount = Math.max(0, Math.floor(args.tapCount))
    const finishedAt = args.finishedAt

    let player: any = null
    if (args.guestId) {
      player = await ctx.db
        .query('players')
        .withIndex('by_room_guest', (q: any) => q.eq('roomId', room._id).eq('guestId', args.guestId))
        .unique()
    } else {
      const userId = await requireUserId(ctx)
      player = await ctx.db
        .query('players')
        .withIndex('by_room_user', (q: any) => q.eq('roomId', room._id).eq('userId', userId))
        .unique()
    }

    if (!player) throw new Error('Player not found')

    const existingData = asRecord(player.data)
    const existingTap = asRecord(existingData.tap)

    const nextTap = {
      ...existingTap,
      count: tapCount,
      ...(typeof finishedAt === 'number' ? { finishedAt } : {}),
    }

    await ctx.db.patch(player._id, {
      data: {
        ...existingData,
        tap: nextTap,
      },
    })
  },
})

export const updateKanpaiProgress = mutation({
  args: {
    code: v.string(),
    guestId: v.optional(v.string()),
    kanpaiScore: v.number(),
    averageMs: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const room = await getRoomByCode(ctx, args.code)
    if (!room) throw new Error('Room not found')

    const kanpaiScore = Math.max(0, Math.floor(args.kanpaiScore))
    const averageMs = typeof args.averageMs === 'number' ? Math.max(0, Math.floor(args.averageMs)) : undefined
    const finishedAt = args.finishedAt

    let player: any = null
    if (args.guestId) {
      player = await ctx.db
        .query('players')
        .withIndex('by_room_guest', (q: any) => q.eq('roomId', room._id).eq('guestId', args.guestId))
        .unique()
    } else {
      const userId = await requireUserId(ctx)
      player = await ctx.db
        .query('players')
        .withIndex('by_room_user', (q: any) => q.eq('roomId', room._id).eq('userId', userId))
        .unique()
    }

    if (!player) throw new Error('Player not found')

    const existingData = asRecord(player.data)
    const existingKanpai = asRecord(existingData.kanpai)

    const nextKanpai = {
      ...existingKanpai,
      count: kanpaiScore,
      ...(typeof averageMs === 'number' ? { averageMs } : {}),
      ...(typeof finishedAt === 'number' ? { finishedAt } : {}),
    }

    await ctx.db.patch(player._id, {
      data: {
        ...existingData,
        kanpai: nextKanpai,
      },
    })
  },
})

export const updateChopstickProgress = mutation({
  args: {
    code: v.string(),
    guestId: v.optional(v.string()),
    catchCount: v.number(),
    finishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const room = await getRoomByCode(ctx, args.code)
    if (!room) throw new Error('Room not found')

    const catchCount = Math.max(0, Math.floor(args.catchCount))
    const finishedAt = args.finishedAt

    let player: any = null
    if (args.guestId) {
      player = await ctx.db
        .query('players')
        .withIndex('by_room_guest', (q: any) => q.eq('roomId', room._id).eq('guestId', args.guestId))
        .unique()
    } else {
      const userId = await requireUserId(ctx)
      player = await ctx.db
        .query('players')
        .withIndex('by_room_user', (q: any) => q.eq('roomId', room._id).eq('userId', userId))
        .unique()
    }

    if (!player) throw new Error('Player not found')

    const existingData = asRecord(player.data)
    const existingChopstick = asRecord(existingData.chopstick)

    const nextChopstick = {
      ...existingChopstick,
      count: catchCount,
      ...(typeof finishedAt === 'number' ? { finishedAt } : {}),
    }

    await ctx.db.patch(player._id, {
      data: {
        ...existingData,
        chopstick: nextChopstick,
      },
    })
  },
})
