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

const DROP_PERIOD_MS = 1_250;
const CATCH_MIN_Y = -0.05;
const CATCH_MAX_Y = 0.18;

function NormalizedAsset({
  url,
  targetSize,
  ...props
}: JSX.IntrinsicElements["group"] & {
  url: string;
  targetSize: number;
}) {
  const gltf = useGLTF(url);
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
    const scale = targetSize / maxDim;
    rootRef.current.scale.setScalar(scale);
    modelRef.current.position.set(-center.x, -center.y, -center.z);
  }, [scene, targetSize]);

  return (
    <group ref={rootRef} {...props} dispose={null}>
      <group ref={modelRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

function ChopstickScene({
  sushiX,
  sushiY,
  isActive,
  catchZoneActive,
  catchPulseNonce,
}: {
  sushiX: number;
  sushiY: number;
  isActive: boolean;
  catchZoneActive: boolean;
  catchPulseNonce: number;
}) {
  const displaySushiY = isActive ? sushiY : 0.55;

  function AnimatedChopsticks() {
    const stickRef = useRef<THREE.Group | null>(null);
    const pulseRef = useRef(0);

    useEffect(() => {
      if (!catchPulseNonce) return;
      pulseRef.current = 1;
    }, [catchPulseNonce]);

    useFrame(({ clock }, delta) => {
      if (!stickRef.current) return;
      pulseRef.current = Math.max(0, pulseRef.current - delta * 5.5);
      const t = clock.getElapsedTime();
      const idle = isActive ? Math.sin(t * 3.6) * 0.04 : 0;
      const focusLift = catchZoneActive && isActive ? 0.06 : 0;
      const pulseLunge = pulseRef.current * 0.08;
      stickRef.current.position.set(0.45 - pulseLunge * 0.5, 0.02 + idle + focusLift, 0.25);
      stickRef.current.rotation.set(0.15 + idle * 0.6, 0.45 + idle * 0.4, -0.28 - pulseLunge * 0.5);
    });

    return (
      <group ref={stickRef}>
        <NormalizedAsset url="/chopsticks.glb" targetSize={1.45} />
      </group>
    );
  }

  return (
    <div className="mx-auto h-52 w-full max-w-xs">
      <Canvas dpr={[1, 1.5]} gl={{ alpha: true }} camera={{ fov: 40, position: [0, 0.2, 4.2] }}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[3, 4, 3]} intensity={1} color="#fff2b3" />
        <pointLight position={[-2, 2, 2]} intensity={0.7} color="#facc15" />
        <NormalizedAsset url="/bowl.glb" targetSize={1.95} position={[0, -0.55, 0]} />
        <AnimatedChopsticks />
        <NormalizedAsset
          url="/sushi.glb"
          targetSize={0.66}
          position={[sushiX, displaySushiY, 0]}
          rotation={[0, isActive ? displaySushiY * 0.8 : 0.15, 0]}
        />
      </Canvas>
    </div>
  );
}

export function ChopstickCatchGame({
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
  const updateChopstickProgress = useMutation((api as any).players.updateChopstickProgress);
  const [catches, setCatches] = useState(0);
  const [catchPulseNonce, setCatchPulseNonce] = useState(0);
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);
  const caughtCyclesRef = useRef<Set<number>>(new Set());
  const lastPushRef = useRef<{ at: number; count: number }>({ at: 0, count: -1 });
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

  useEffect(() => {
    setCatches(0);
    setCatchPulseNonce(0);
    caughtCyclesRef.current = new Set();
    lastPushRef.current = { at: 0, count: -1 };
    didFinalPushRef.current = false;
  }, [code, roomStatus, roomStartedAt]);

  const elapsedRoundMs = useMemo(() => {
    if (!isRoundRunning || typeof roomStartedAt !== "number") return 0;
    return Math.max(0, round.nowMs - roomStartedAt);
  }, [isRoundRunning, roomStartedAt, round.nowMs]);
  const dropCycle = Math.max(0, Math.floor(elapsedRoundMs / DROP_PERIOD_MS));
  const cycleT = (elapsedRoundMs % DROP_PERIOD_MS) / DROP_PERIOD_MS;
  const sushiY = 0.9 - cycleT * 1.6;
  const sushiX = Math.sin(dropCycle * 2.17) * 0.55;
  const catchZoneNow = sushiY >= CATCH_MIN_Y && sushiY <= CATCH_MAX_Y;

  function onCatchTap() {
    if (!isRoundRunning) return;
    if (caughtCyclesRef.current.has(dropCycle)) return;
    if (sushiY < CATCH_MIN_Y || sushiY > CATCH_MAX_Y) return;
    caughtCyclesRef.current.add(dropCycle);
    setCatches((prev) => prev + 1);
    setCatchPulseNonce((prev) => prev + 1);
  }

  useEffect(() => {
    if (!canPlay) return;
    if (typeof roomStartedAt !== "number") return;
    const now = Date.now();
    const last = lastPushRef.current;
    const nextCount = catches;
    const countChanged = nextCount !== last.count;
    const timeOk = now - last.at > 250;
    const shouldPushLive = isRoundRunning && countChanged && timeOk;
    const shouldPushFinal = isRoundOver && !didFinalPushRef.current && (countChanged || last.count < 0);
    if (!shouldPushLive && !shouldPushFinal) return;

    lastPushRef.current = { at: now, count: nextCount };
    void updateChopstickProgress({
      code,
      ...(isHostUser ? {} : { guestId: guestId ?? undefined }),
      catchCount: nextCount,
    });
    if (shouldPushFinal) didFinalPushRef.current = true;
  }, [canPlay, roomStartedAt, catches, isRoundRunning, isRoundOver, updateChopstickProgress, code, isHostUser, guestId]);

  const { leaderboard, maxCount, winnerBannerText } = useShakeLeaderboard({
    players,
    isRoundOver,
    scoreKey: "chopstick",
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
          BAD DECISIONS INC · CHOPSTICK CATCH
        </div>
        <div className="relative rounded-md border border-white/20 bg-black/30 p-3">
          <div className="mb-2 h-2 rounded-full border border-white/30 bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-colors ${catchZoneNow && isRoundRunning ? "bg-[#facc15]" : "bg-white/20"}`}
              style={{ width: `${Math.round(((sushiY + 0.7) / 1.7) * 100)}%` }}
            />
          </div>
          <ChopstickScene
            sushiX={sushiX}
            sushiY={sushiY}
            isActive={isRoundRunning || isCountdown}
            catchZoneActive={catchZoneNow}
            catchPulseNonce={catchPulseNonce}
          />
          <button
            type="button"
            onPointerDown={onCatchTap}
            className="absolute inset-0 rounded-md cursor-pointer"
            style={{ touchAction: "manipulation" }}
            aria-label="Catch sushi"
          />
          {isCountdown ? (
            <div className="mt-2 text-center">
              <div className="text-xs uppercase tracking-wide text-[#facc15]">Get ready</div>
              <div className="text-3xl font-black tabular-nums text-[#fde047]">{countdownDisplay}</div>
            </div>
          ) : (
            <div className="mt-2 space-y-1 text-xs text-[#facc15]">
              <div>Tap when sushi reaches bowl/chopstick level.</div>
              <div className="text-white/80">{catchZoneNow && isRoundRunning ? "TAP NOW!" : "Wait for the sushi to drop..."}</div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-[#facc15]">Sushi catches</div>
            <div className="text-xs text-white/80">{isCountdown ? `STARTS IN ${countdownDisplay}` : isRoundRunning ? "LIVE" : isRoundOver ? "FINISHED" : "READY"}</div>
          </div>
          <div className="relative h-2 rounded-md bg-white/10 overflow-hidden border border-white/30">
            <div className="absolute inset-y-0 left-0 bg-[#eab308]" style={{ width: `${Math.round((roomStatus === "finished" ? 1 : round.progress01) * 1000) / 10}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-white/20 bg-black/25 px-3 py-2">
              Time
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-[#facc15]">{secondsLeft}s</div>
            </div>
            <div className="rounded border border-white/20 bg-black/25 px-3 py-2">
              Score
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-[#facc15]">{catches}</div>
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
                      {isRoundOver && <div className="text-xs tabular-nums text-[#facc15]">{p.count} catches</div>}
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

useGLTF.preload("/bowl.glb");
useGLTF.preload("/chopsticks.glb");
useGLTF.preload("/sushi.glb");
