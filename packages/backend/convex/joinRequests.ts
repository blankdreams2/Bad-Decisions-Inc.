import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { getRoomByCode, requireUserId } from './utils'

/**
 * MUTATIONS
 *
 * requestToJoin
 * approve
 * deny
 *
 */
export const requestToJoin = mutation({
  args: {
    code: v.string(),
    guestId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await getRoomByCode(ctx, args.code)
    if (!room) throw new Error('Room not found')

    const existing = await ctx.db
      .query('joinRequests')
      .withIndex('by_room_guest', (q) => q.eq('roomId', room._id).eq('guestId', args.guestId))
      .unique()

    const now = Date.now()

    if (existing) {
      const nextStatus = existing.status === 'approved' ? 'approved' : 'pending'
      await ctx.db.patch(existing._id, {
        name: args.name,
        status: nextStatus,
        createdAt: now,
      })
      return { requestId: existing._id, status: nextStatus }
    }

    const requestId = await ctx.db.insert('joinRequests', {
      roomId: room._id,
      guestId: args.guestId,
      name: args.name,
      status: 'pending',
      createdAt: now,
    })

    return { requestId, status: 'pending' as const }
  },
})

export const approve = mutation({
  args: {
    requestId: v.id('joinRequests'),
  },
  handler: async (ctx, args) => {
    const hostUserId = await requireUserId(ctx)
    const req = await ctx.db.get(args.requestId)
    if (!req) throw new Error('Request not found')

    const room = await ctx.db.get(req.roomId)
    if (!room) throw new Error('Room not found')
    if (room.hostUserId !== hostUserId) throw new Error('Not authorized')

    await ctx.db.patch(req._id, {
      status: 'approved',
    })

    const existingPlayer = await ctx.db
      .query('players')
      .withIndex('by_room_guest', (q: any) => q.eq('roomId', room._id).eq('guestId', req.guestId))
      .first()

    if (!existingPlayer) {
      await ctx.db.insert('players', {
        roomId: room._id,
        guestId: req.guestId,
        name: req.name,
        joinedAt: Date.now(),
        isHost: false,
      })
    }
  },
})

export const deny = mutation({
  args: {
    requestId: v.id('joinRequests'),
  },
  handler: async (ctx, args) => {
    const hostUserId = await requireUserId(ctx)
    const req = await ctx.db.get(args.requestId)
    if (!req) throw new Error('Request not found')

    const room = await ctx.db.get(req.roomId)
    if (!room) throw new Error('Room not found')
    if (room.hostUserId !== hostUserId) throw new Error('Not authorized')

    await ctx.db.patch(req._id, {
      status: 'denied',
    })
  },
})

/**
 * QUERIES
 *
 * getMyJoinRequest
 * listPendingForHost
 */


/**
 * Get the join request for a guest in a room
 */
export const getMyJoinRequest = query({
  args: {
    code: v.string(),
    guestId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await getRoomByCode(ctx, args.code)
    if (!room) return null

    const req = await ctx.db
      .query('joinRequests')
      .withIndex('by_room_guest', (q) => q.eq('roomId', room._id).eq('guestId', args.guestId))
      .unique()

    return req ?? null
  },
})

/**
 * List all pending join requests for a host
 */
export const listPendingForHost = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const hostUserId = await requireUserId(ctx)

    const room = await getRoomByCode(ctx, args.code)
    if (!room) return []
    if (room.hostUserId !== hostUserId) throw new Error('Not authorized')

    const pending = await ctx.db
      .query('joinRequests')
      .withIndex('by_roomId_status', (q) => q.eq('roomId', room._id).eq('status', 'pending'))
      .collect()

    pending.sort((a: any, b: any) => b.createdAt - a.createdAt)
    return pending
  },
})
