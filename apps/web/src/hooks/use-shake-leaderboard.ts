"use client";

import { useMemo } from "react";
import { avatarKeyForPlayer, presetAvatarUrl } from "@/lib/preset-avatar";

const PLAYER_COLOR_PAIRS = [
  ["#f97316", "#fb923c"],
  ["#06b6d4", "#22d3ee"],
  ["#8b5cf6", "#a78bfa"],
  ["#ec4899", "#f472b6"],
  ["#22c55e", "#4ade80"],
  ["#eab308", "#facc15"],
] as const;

export type ShakeLeaderboardPlayer = {
  _id: string;
  name: string;
  isHost?: boolean;
  data?: any;
};

export type ShakeLeaderboardRow = {
  id: string;
  name: string;
  isHost: boolean;
  count: number;
  startColor: string;
  endColor: string;
  avatarUrl: string;
};

function hashText(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function playerColors(name: string, index: number) {
  const hashed = hashText(`${name}:${index}`);
  return PLAYER_COLOR_PAIRS[hashed % PLAYER_COLOR_PAIRS.length]!;
}

export function useShakeLeaderboard({
  players,
  isRoundOver,
  scoreKey = "shake",
}: {
  players: ShakeLeaderboardPlayer[] | null | undefined;
  isRoundOver: boolean;
  scoreKey?: "shake" | "tap" | "kanpai" | "chopstick";
}) {
  const leaderboard = useMemo<ShakeLeaderboardRow[] | null>(() => {
    if (!players) return null;

    const rows = players.map((player, index) => {
      const scoreNode = (player as any)?.data?.[scoreKey];
      const count = typeof scoreNode?.count === "number" ? scoreNode.count : 0;
      const [startColor, endColor] = playerColors(player.name, index);
      return {
        id: player._id,
        name: player.name,
        isHost: Boolean((player as any).isHost),
        count,
        startColor,
        endColor,
        avatarUrl: presetAvatarUrl(avatarKeyForPlayer(player as any)),
      };
    });

    rows.sort((a, b) => b.count - a.count);
    return rows;
  }, [players, scoreKey]);

  const maxCount = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) return 0;
    return leaderboard.reduce((max, player) => Math.max(max, player.count), 0);
  }, [leaderboard]);

  const winnerBannerText = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) return null;
    if (!isRoundOver) return null;

    const top = Math.max(0, leaderboard[0]?.count ?? 0);
    if (top <= 0) return "No winner";

    const winners = leaderboard.filter((player) => player.count === top);
    if (winners.length === 1) return `Congrats ${winners[0]!.name}!!`;
    return `Tie: ${winners.map((winner) => winner.name).join(", ")}`;
  }, [isRoundOver, leaderboard]);

  return {
    leaderboard,
    maxCount,
    winnerBannerText,
  };
}
