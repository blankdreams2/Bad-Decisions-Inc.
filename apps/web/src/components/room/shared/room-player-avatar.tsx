"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/avatar";
import { presetAvatarUrl } from "@/lib/preset-avatar";

function initials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
}

export function RoomPlayerAvatar({
  name,
  avatarKey,
  avatarUrl,
  accent,
  className = "h-9 w-9",
}: {
  name: string;
  avatarKey?: string;
  avatarUrl?: string;
  accent?: string;
  className?: string;
}) {
  const src = avatarUrl ?? (avatarKey ? presetAvatarUrl(avatarKey) : undefined);

  return (
    <Avatar className={`${className} border-2 shadow-sm`} style={{ borderColor: accent ?? "#e2e8f0" }}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback
        className="text-xs text-white font-semibold"
        style={{
          background: accent
            ? `linear-gradient(135deg, ${accent}cc 0%, ${accent}66 100%)`
            : "linear-gradient(135deg, #d50032 0%, #8e001f 100%)",
        }}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
