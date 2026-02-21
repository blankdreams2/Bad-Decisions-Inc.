const PRESET_AVATAR_SEEDS = [
  "vegas-rabbit",
  "vegas-fox",
  "vegas-panda",
  "vegas-koala",
  "vegas-dino",
  "vegas-lion",
  "vegas-bird",
  "vegas-octo",
  "vegas-shark",
  "vegas-tiger",
] as const;

function hashText(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function presetAvatarUrl(key: string) {
  const avatarIndex = hashText(key) % PRESET_AVATAR_SEEDS.length;
  const avatarSeed = PRESET_AVATAR_SEEDS[avatarIndex]!;
  return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(avatarSeed)}`;
}

export function avatarKeyForPlayer(player: {
  _id?: string;
  guestId?: string;
  userId?: string;
  name?: string;
}) {
  return player.guestId ?? player.userId ?? player._id ?? player.name ?? "player";
}
