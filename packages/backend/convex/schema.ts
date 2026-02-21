import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const gameValidator = v.union(
  v.literal("shake"),
  v.literal("flip"),
  v.literal("tap"),
  v.literal("kanpai"),
  v.literal("chopstick"),
);

export default defineSchema({
  rooms: defineTable({
    code: v.string(),
    hostUserId: v.string(),
    game: v.optional(gameValidator),
    status: v.union(v.literal("lobby"), v.literal("playing"), v.literal("finished")),
    createdAt: v.number(),
    state: v.optional(v.any()),
  })
    .index("by_code", ["code"])
    .index("by_hostUserId", ["hostUserId"])
    .index("by_hostUserId_game", ["hostUserId", "game"]),

  // joinRequests in schema

  joinRequests: defineTable({
    roomId: v.id("rooms"),
    guestId: v.string(),
    name: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("denied")),
    createdAt: v.number(),
  })
    .index("by_roomId_status", ["roomId", "status"])
    .index("by_room_guest", ["roomId", "guestId"]),

  players: defineTable({
    roomId: v.id("rooms"),
    userId: v.optional(v.string()),
    guestId: v.optional(v.string()),
    name: v.string(),
    joinedAt: v.number(),
    isHost: v.boolean(),
    data: v.optional(v.any()),
  })
    .index("by_roomId", ["roomId"])
    .index("by_room_user", ["roomId", "userId"])
    .index("by_room_guest", ["roomId", "guestId"]),
});
