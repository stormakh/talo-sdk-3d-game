"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import type { RaceWithSlots } from "@/types";
import { Environment } from "./environment";
import { Racetrack } from "./racetrack";
import { RaceAnimationEngine } from "./race-animation-engine";
import { CameraController } from "./camera-controller";

type RaceSceneProps = {
  race: RaceWithSlots;
  onComplete?: () => void;
};

export function RaceScene({ race, onComplete }: RaceSceneProps) {
  const [phase, setPhase] = useState<"countdown" | "racing" | "finished">("countdown");
  const [countdown, setCountdown] = useState(3);
  const [raceTime, setRaceTime] = useState(0);
  const [leadProgress, setLeadProgress] = useState(0);

  const result = race.result;
  if (!result) return null;

  const slotsInfo = race.slots
    .filter((s) => s.paymentStatus === "confirmed")
    .map((s) => ({
      slotId: s.id,
      lane: s.lane,
      displayName: s.xHandle ? `@${s.xHandle}` : s.displayName,
    }));

  // Countdown timer
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("racing");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  const handleTimeUpdate = useCallback((time: number) => {
    setRaceTime(time);
    // Track lead horse progress for camera
    if (result) {
      let maxProgress = 0;
      for (const horse of result.horses) {
        const lastIdx = Math.min(
          Math.floor(time / 0.1),
          horse.keyframes.length - 1
        );
        if (lastIdx >= 0) {
          maxProgress = Math.max(maxProgress, horse.keyframes[lastIdx].progress);
        }
      }
      setLeadProgress(maxProgress);
    }
  }, [result]);

  const handleComplete = useCallback(() => {
    setPhase("finished");
    // Delay before showing results
    setTimeout(() => onComplete?.(), 2000);
  }, [onComplete]);

  const handleReplay = useCallback(() => {
    setPhase("countdown");
    setCountdown(3);
    setRaceTime(0);
    setLeadProgress(0);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ height: "400px" }}>
      <Canvas
        shadows
        camera={{ position: [12, 8, -5], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Environment />
        <Racetrack />
        <CameraController raceTime={raceTime} leadProgress={leadProgress} racing={phase === "racing"} />

        {phase === "racing" && (
          <RaceAnimationEngine
            result={result}
            slotsInfo={slotsInfo}
            playing={true}
            onTimeUpdate={handleTimeUpdate}
            onComplete={handleComplete}
          />
        )}
      </Canvas>

      {/* Countdown overlay */}
      {phase === "countdown" && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(13,26,13,0.6)" }}>
          <span
            className="text-7xl font-bold"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--text-gold)",
            }}
          >
            {countdown > 0 ? countdown : "GO!"}
          </span>
        </div>
      )}

      {/* Finished overlay */}
      {phase === "finished" && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(13,26,13,0.6)" }}>
          <button
            onClick={handleReplay}
            className="cursor-pointer rounded border px-6 py-2.5 text-sm font-semibold tracking-wider uppercase transition-colors"
            style={{
              borderColor: "var(--border-gold)",
              color: "var(--text-gold)",
              background: "rgba(13,26,13,0.8)",
            }}
          >
            Ver de Nuevo
          </button>
        </div>
      )}
    </div>
  );
}
