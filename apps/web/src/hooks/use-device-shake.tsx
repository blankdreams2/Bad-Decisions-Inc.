import { useState, useEffect, useCallback, useRef } from "react";

interface ShakeOptions {
  threshold: number;
  timeout: number;
}

interface UseShakeCounterResult {
  shakeCount: number;
  resetCount: () => void;
  incrementCount: () => void;
  requestPermission: () => Promise<boolean>;
  isListening: boolean;
  hasDeviceMotion: boolean;
  hasMotionEvents: boolean;
}

export function useShakeCounter(
  options: ShakeOptions = { threshold: 15, timeout: 1000 }
): UseShakeCounterResult {
  const [shakeCount, setShakeCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [hasMotionEvents, setHasMotionEvents] = useState(false);
  const lastShake = useRef(0);
  const hasMotionEventsRef = useRef(false);
  const motionListenerRef = useRef<((event: DeviceMotionEvent) => void) | null>(
    null
  );

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity ?? event.acceleration;
      if (!acc) return;

      if (!hasMotionEventsRef.current) {
        hasMotionEventsRef.current = true;
        setHasMotionEvents(true);
      }

      const { x, y, z } = acc;
      const acceleration = Math.sqrt(
        (x ?? 0) ** 2 + (y ?? 0) ** 2 + (z ?? 0) ** 2
      );
      const now = Date.now();

      if (
        acceleration > options.threshold &&
        now - lastShake.current > options.timeout
      ) {
        setShakeCount((prevCount) => prevCount + 1);
        lastShake.current = now;
      }
    },
    [options.threshold, options.timeout]
  );

  const hasDeviceMotion =
    typeof window !== "undefined" && "DeviceMotionEvent" in window;

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
      console.warn("Device motion not supported");
      return false;
    }

    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const permissionState = await (
          DeviceMotionEvent as any
        ).requestPermission();
        if (permissionState === "granted") {
          if (!motionListenerRef.current) {
            motionListenerRef.current = handleMotion;
            window.addEventListener("devicemotion", motionListenerRef.current);
          }
          setIsListening(true);
          return true;
        }
      } catch (error) {
        console.error("Error requesting device motion permission:", error);
      }
    } else {
      // For non-iOS devices or older versions, no permission is needed
      if (!motionListenerRef.current) {
        motionListenerRef.current = handleMotion;
        window.addEventListener("devicemotion", motionListenerRef.current);
      }
      setIsListening(true);
      return true;
    }
    return false;
  }, [handleMotion]);

  useEffect(() => {
    return () => {
      if (motionListenerRef.current) {
        window.removeEventListener("devicemotion", motionListenerRef.current);
        motionListenerRef.current = null;
      }
    };
  }, []);

  const resetCount = useCallback(() => {
    setShakeCount(0);
    setHasMotionEvents(false);
    hasMotionEventsRef.current = false;
  }, []);

  const incrementCount = useCallback(() => {
    const now = Date.now();
    if (now - lastShake.current <= options.timeout) return;
    setShakeCount((prev) => prev + 1);
    lastShake.current = now;
  }, [options.timeout]);

  return {
    shakeCount,
    resetCount,
    incrementCount,
    requestPermission,
    isListening,
    hasDeviceMotion,
    hasMotionEvents,
  };
}