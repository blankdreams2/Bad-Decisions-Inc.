import { useEffect, useMemo, useState } from "react";

export function useSyncedRound({
  startedAtMs,
  durationMs,
  isActive,
  tickMs = 50,
}: {
  startedAtMs: number | null;
  durationMs: number;
  isActive: boolean;
  tickMs?: number;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!isActive) return;
    if (typeof startedAtMs !== "number") return;

    const id = window.setInterval(() => setNowMs(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [isActive, startedAtMs, tickMs]);

  const elapsedMs = useMemo(() => {
    if (typeof startedAtMs !== "number") return 0;
    return Math.max(0, nowMs - startedAtMs);
  }, [nowMs, startedAtMs]);

  const remainingMs = useMemo(() => {
    return Math.max(0, durationMs - elapsedMs);
  }, [durationMs, elapsedMs]);

  const progress01 = useMemo(() => {
    if (durationMs <= 0) return 0;
    return Math.max(0, Math.min(1, elapsedMs / durationMs));
  }, [durationMs, elapsedMs]);

  const isOver = useMemo(() => {
    if (typeof startedAtMs !== "number") return false;
    return elapsedMs >= durationMs;
  }, [durationMs, elapsedMs, startedAtMs]);

  return {
    nowMs,
    elapsedMs,
    remainingMs,
    progress01,
    isOver,
  };
}
