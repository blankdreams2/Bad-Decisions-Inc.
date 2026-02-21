"use client";

import { useMutation } from "convex/react";
import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import type { JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { Button } from "@/components/common/button";
import { RoomPlayerAvatar } from "@/components/room/shared/room-player-avatar";
import { useShakeLeaderboard, type ShakeLeaderboardPlayer } from "@/hooks/use-shake-leaderboard";
import { useSyncedRound } from "@/hooks/use-synced-round";
import { api } from "@packages/backend/convex/_generated/api";

const BEAT_INTERVAL_MS = 2_500;
const BEAT_OFFSET_MS = 1_000;
const HIT_WINDOW_MS = 700;

function BeerModel(props: JSX.IntrinsicElements["group"]) {
  const gltf = useGLTF("/beer.glb");
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const rootRef = useRef<THREE.Group | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!rootRef.current || !modelRef.current) return;
    const box = new THREE.Box3().setFromObject(modelRef.current);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 1.05 / maxDim;
    rootRef.current.scale.setScalar(scale);
    modelRef.current.position.set(-center.x, -center.y, -center.z);
  }, [scene]);

  return (
    <group ref={rootRef} {...props} dispose={null}>
      <group ref={modelRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

function KanpaiRig({ isActive, beatPulse, clapNonce }: { isActive: boolean; beatPulse: boolean; clapNonce: number }) {
  const leftRef = useRef<THREE.Group | null>(null);
  const rightRef = useRef<THREE.Group | null>(null);
  const pulseRef = useRef(0);
  const clapRef = useRef(0);

  useEffect(() => {
    if (!beatPulse) return;
    pulseRef.current = 1;
  }, [beatPulse]);
  useEffect(() => {
    if (!clapNonce) return;
    clapRef.current = 1;
  }, [clapNonce]);

  useFrame(({ clock }, delta) => {
    if (!leftRef.current || !rightRef.current) return;
    const t = clock.getElapsedTime();
    pulseRef.current = Math.max(0, pulseRef.current - delta * 2.8);
    clapRef.current = Math.max(0, clapRef.current - delta * 7.2);
    const bob = isActive ? Math.sin(t * 3.5) * 0.03 : 0;
    const pulse = pulseRef.current * 0.15;
    const clap = clapRef.current * 0.38;

    leftRef.current.position.set(-0.5 + clap, bob + pulse * 0.06, 0);
    rightRef.current.position.set(0.5 - clap, -bob + pulse * 0.06, 0);

    leftRef.current.rotation.z = -0.2 + Math.sin(t * 2.2) * 0.05 + pulse * 0.2 - clap * 0.1;
    rightRef.current.rotation.z = 0.2 + Math.sin(t * 2.5 + Math.PI) * 0.05 - pulse * 0.2 + clap * 0.1;
  });

  return (
    <group>
      <group ref={leftRef}>
        <BeerModel rotation={[0.08, 0.3, 0]} />
      </group>
      <group ref={rightRef}>
        <BeerModel rotation={[0.08, -0.3, 0]} />
      </group>
    </group>
  );
}

function KanpaiScene({ isActive, beatPulse, clapNonce }: { isActive: boolean; beatPulse: boolean; clapNonce: number }) {
  return (
    <div className="mx-auto h-52 w-full max-w-xs">
      <Canvas dpr={[1, 1.5]} gl={{ alpha: true }} camera={{ fov: 36, position: [0, 0.1, 4] }}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[2, 4, 3]} intensity={1} color="#ffffff" />
        <pointLight position={[-2, 1, 2]} intensity={0.7} color="#ffffff" />
        <KanpaiRig isActive={isActive} beatPulse={beatPulse} clapNonce={clapNonce} />
      </Canvas>
    </div>
  );
}

export function KanpaiTimingGame({
  code,
  roomStatus,
  roomStartedAt,
  roomCountdownStartedAt,
  roomCountdownMs,
  players,
  isHostUser,
  isApprovedGuest,
  guestId,
  durationMs = 15_000,
}: {
  code: string;
  roomStatus: "lobby" | "playing" | "finished" | string;
  roomStartedAt: number | null;
  roomCountdownStartedAt: number | null;
  roomCountdownMs: number;
  players: ShakeLeaderboardPlayer[] | null | undefined;
  isHostUser: boolean;
  isApprovedGuest: boolean;
  guestId: string | null;
  durationMs?: number;
}) {
  const updateKanpaiProgress = useMutation((api as any).players.updateKanpaiProgress);
  const [score, setScore] = useState(0);
  const [avgMs, setAvgMs] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [clapNonce, setClapNonce] = useState(0);
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);
  const usedBeatIndexesRef = useRef<Set<number>>(new Set());
  const timingsRef = useRef<number[]>([]);
  const lastPushRef = useRef<{ at: number; score: number }>({ at: 0, score: -1 });
  const didFinalPushRef = useRef(false);

  const canPlayRole = useMemo(() => {
    if (!code) return false;
    if (isHostUser) return true;
    return isApprovedGuest;
  }, [code, isHostUser, isApprovedGuest]);

  const canPlay = useMemo(() => canPlayRole && roomStatus === "playing", [canPlayRole, roomStatus]);

  const round = useSyncedRound({
    startedAtMs: roomStartedAt,
    durationMs,
    isActive: canPlay && typeof roomStartedAt === "number",
  });

  const hasRoundTiming = typeof roomStartedAt === "number";
  const countdownDurationMs = Math.max(1_000, roomCountdownMs || 5_000);
  const countdownEndAtMs =
    typeof roomCountdownStartedAt === "number" ? roomCountdownStartedAt + countdownDurationMs : roomStartedAt;
  const countdownRemainingMs = useMemo(() => {
    if (roomStatus !== "playing") return 0;
    if (typeof countdownEndAtMs !== "number") return 0;
    return Math.max(0, countdownEndAtMs - round.nowMs);
  }, [roomStatus, countdownEndAtMs, round.nowMs]);
  const countdownDisplay = useMemo(() => {
    const maxSeconds = Math.ceil(countdownDurationMs / 1000);
    return Math.min(maxSeconds, Math.max(1, Math.ceil(countdownRemainingMs / 1000)));
  }, [countdownDurationMs, countdownRemainingMs]);

  const isCountdown = canPlay && countdownRemainingMs > 0;
  const isRoundRunning = canPlay && hasRoundTiming && !isCountdown && !round.isOver;
  const isRoundOver = (roomStatus === "finished" && hasRoundTiming) || (canPlay && hasRoundTiming && !isCountdown && round.isOver);
  const beatPulse = useMemo(() => {
    if (!isRoundRunning || typeof roomStartedAt !== "number") return false;
    const elapsed = Math.max(0, round.nowMs - roomStartedAt) - BEAT_OFFSET_MS;
    if (elapsed < 0) return false;
    const mod = elapsed % BEAT_INTERVAL_MS;
    return mod < 160 || mod > BEAT_INTERVAL_MS - 160;
  }, [isRoundRunning, roomStartedAt, round.nowMs]);

  useEffect(() => {
    setScore(0);
    setAvgMs(null);
    setHits(0);
    setClapNonce(0);
    usedBeatIndexesRef.current = new Set();
    timingsRef.current = [];
    lastPushRef.current = { at: 0, score: -1 };
    didFinalPushRef.current = false;
  }, [code, roomStatus, roomStartedAt]);

  const beatIndexes = useMemo(() => {
    const beatCount = Math.max(1, Math.floor((durationMs - BEAT_OFFSET_MS) / BEAT_INTERVAL_MS));
    return Array.from({ length: beatCount }, (_, i) => i);
  }, [durationMs]);

  function onTapKanpai() {
    if (!isRoundRunning || typeof roomStartedAt !== "number") return;
    const elapsed = Math.max(0, round.nowMs - roomStartedAt);
    const nearestBeatIndex = Math.max(
      0,
      Math.min(beatIndexes.length - 1, Math.round((elapsed - BEAT_OFFSET_MS) / BEAT_INTERVAL_MS)),
    );
    if (usedBeatIndexesRef.current.has(nearestBeatIndex)) return;
    const beatAt = BEAT_OFFSET_MS + nearestBeatIndex * BEAT_INTERVAL_MS;
    const delta = Math.abs(elapsed - beatAt);
    if (delta > HIT_WINDOW_MS) return;

    usedBeatIndexesRef.current.add(nearestBeatIndex);
    timingsRef.current = [...timingsRef.current, delta];
    const nextAvg = Math.round(timingsRef.current.reduce((s, v) => s + v, 0) / Math.max(1, timingsRef.current.length));
    const nextScore = Math.max(0, 1000 - nextAvg);
    setAvgMs(nextAvg);
    setScore(nextScore);
    setHits(timingsRef.current.length);
    setClapNonce((prev) => prev + 1);
  }

  useEffect(() => {
    if (!canPlay) return;
    if (typeof roomStartedAt !== "number") return;

    const now = Date.now();
    const last = lastPushRef.current;
    const nextScore = score;
    const scoreChanged = nextScore !== last.score;
    const timeOk = now - last.at > 300;
    const shouldPushLive = isRoundRunning && scoreChanged && timeOk;
    const shouldPushFinal = isRoundOver && !didFinalPushRef.current && (scoreChanged || last.score < 0);
    if (!shouldPushLive && !shouldPushFinal) return;

    lastPushRef.current = { at: now, score: nextScore };
    void updateKanpaiProgress({
      code,
      ...(isHostUser ? {} : { guestId: guestId ?? undefined }),
      kanpaiScore: nextScore,
      averageMs: avgMs ?? undefined,
    });
    if (shouldPushFinal) didFinalPushRef.current = true;
  }, [canPlay, roomStartedAt, score, avgMs, isRoundRunning, isRoundOver, updateKanpaiProgress, code, isHostUser, guestId]);

  const { leaderboard, maxCount, winnerBannerText } = useShakeLeaderboard({
    players,
    isRoundOver,
    scoreKey: "kanpai",
  });
  const leaderboardRows = useMemo(() => {
    if (!leaderboard) return null;
    return showAllLeaderboard ? leaderboard : leaderboard.slice(0, 3);
  }, [leaderboard, showAllLeaderboard]);

  const secondsLeft = Math.max(0, Math.ceil(round.remainingMs / 1000));
  const roundLabel = `${Math.round(durationMs / 1000)}s round`;

  return (
    <div className="pt-3 border-t">
      <div className="relative overflow-hidden rounded-xl border border-[#eab308]/55 bg-[#171a20] p-4 space-y-4 text-white">
        <div className="rounded-full inline-flex items-center border border-[#eab308]/70 bg-black/30 px-3 py-1 text-xs font-semibold tracking-wide text-[#facc15]">
          BAD DECISIONS INC · KANPAI TIMING
        </div>

        <div className="relative rounded-md border border-white/20 bg-black/30 p-3">
          <div className={`pointer-events-none absolute inset-2 rounded-md border-2 transition-all ${beatPulse ? "border-[#facc15] opacity-100 shadow-[0_0_18px_rgba(250,204,21,0.55)]" : "border-[#facc15]/20 opacity-60"}`} />
          <KanpaiScene isActive={isRoundRunning || isCountdown} beatPulse={beatPulse} clapNonce={clapNonce} />
          <button
            type="button"
            onPointerDown={onTapKanpai}
            className="absolute inset-0 rounded-md cursor-pointer"
            style={{ touchAction: "manipulation" }}
            aria-label="Tap on Kanpai beat"
          />
          {isCountdown ? (
            <div className="mt-2 text-center">
              <div className="text-xs uppercase tracking-wide text-[#facc15]">Get ready</div>
              <div className="text-3xl font-black tabular-nums text-[#fde047]">{countdownDisplay}</div>
            </div>
          ) : (
            <div className="mt-2 space-y-1 text-xs text-[#facc15]">
              <div>Tap when the ring flashes yellow. One tap per beat.</div>
              <div className="text-white/80">Closer timing = higher score.</div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-[#facc15]">Timing score</div>
            <div className="text-xs text-white/80">{isCountdown ? `STARTS IN ${countdownDisplay}` : isRoundRunning ? "LIVE" : isRoundOver ? "FINISHED" : "READY"}</div>
          </div>
          <div className="relative h-2 rounded-md bg-white/10 overflow-hidden border border-white/30">
            <div className="absolute inset-y-0 left-0 bg-[#eab308]" style={{ width: `${Math.round((roomStatus === "finished" ? 1 : round.progress01) * 1000) / 10}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded border border-white/20 bg-black/25 px-3 py-2">
              Time
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-[#facc15]">{secondsLeft}s</div>
            </div>
            <div className="rounded border border-white/20 bg-black/25 px-3 py-2">
              Hits
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-[#facc15]">{hits}</div>
            </div>
            <div className="rounded border border-white/20 bg-black/25 px-3 py-2">
              Avg ms
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-[#facc15]">{avgMs ?? "-"}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium text-[#facc15]">Race Track Leaderboard</div>
            <div className="text-xs text-white/80 tabular-nums">
              {isCountdown ? `Starts in ${countdownDisplay}s` : roomStatus === "playing" ? `${secondsLeft}s left` : roundLabel}
            </div>
          </div>
          {!leaderboard ? (
            <div className="text-sm text-white/70">Loading…</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-sm text-white/70">No players yet.</div>
          ) : (
            <div className="space-y-2">
              {leaderboardRows?.map((p, index) => {
                const rank = showAllLeaderboard ? leaderboard.findIndex((row) => row.id === p.id) + 1 : index + 1;
                const progress01 = maxCount > 0 ? Math.max(0, Math.min(1, p.count / maxCount)) : 0;
                const fillPct = Math.round(progress01 * 1000) / 10;
                const avatarLeftPct = Math.max(7, Math.min(92, fillPct));
                const { startColor, endColor } = p;
                return (
                  <div key={p.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-xs w-5 text-center font-semibold text-[#facc15]">{rank}</div>
                        <div className="w-40 text-sm font-semibold truncate text-white">
                          {p.name}
                          {p.isHost ? " (host)" : ""}
                        </div>
                      </div>
                      {isRoundOver && <div className="text-xs tabular-nums text-[#facc15]">{p.count} pts</div>}
                    </div>
                    <div className="relative h-10 rounded-md bg-white/10 overflow-hidden border border-white/30">
                      <div className="absolute inset-y-0 left-0 rounded-r-md" style={{ background: `linear-gradient(90deg, ${startColor} 0%, ${endColor} 100%)`, width: `${fillPct}%` }} />
                      <div className="absolute top-1/2" style={{ left: `${avatarLeftPct}%`, transform: "translate(-50%, -50%)" }} title={p.name}>
                        <RoomPlayerAvatar name={p.name} avatarUrl={p.avatarUrl} accent={startColor} className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                );
              })}
              {leaderboard.length > 3 && (
                <Button size="sm" variant="outline" className="w-full" onClick={() => setShowAllLeaderboard((prev) => !prev)}>
                  {showAllLeaderboard ? "Show top 3" : `Show all (${leaderboard.length})`}
                </Button>
              )}
            </div>
          )}
        </div>

        {isRoundOver && winnerBannerText && (
          <div className="border border-[#eab308]/70 rounded-md bg-black/30 p-3 text-center animate-pulse">
            <div className="text-sm font-medium">{winnerBannerText}</div>
          </div>
        )}
      </div>
    </div>
  );
}

useGLTF.preload("/beer.glb");
