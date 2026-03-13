"use client";

import { useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import type { RaceResult, Keyframe } from "@/types";
import { Horse } from "./horse";
import { TRACK_LENGTH, TRACK_WIDTH } from "./racetrack";

type SlotInfo = {
  slotId: number;
  lane: number;
  displayName: string;
};

type HorseState = {
  progress: number;
  lateralOffset: number;
  stumbling: boolean;
};

function interpolateKeyframes(keyframes: Keyframe[], time: number): HorseState {
  if (keyframes.length === 0) {
    return { progress: 0, lateralOffset: 0, stumbling: false };
  }

  // Clamp to last keyframe
  if (time >= keyframes[keyframes.length - 1].t) {
    const last = keyframes[keyframes.length - 1];
    return {
      progress: last.progress,
      lateralOffset: last.lateralOffset,
      stumbling: last.stumbling,
    };
  }

  // Find the two keyframes surrounding the current time
  let low = 0;
  let high = keyframes.length - 1;
  while (low < high - 1) {
    const mid = Math.floor((low + high) / 2);
    if (keyframes[mid].t <= time) low = mid;
    else high = mid;
  }

  const a = keyframes[low];
  const b = keyframes[high];
  const dt = b.t - a.t;
  const alpha = dt > 0 ? (time - a.t) / dt : 0;

  return {
    progress: a.progress + (b.progress - a.progress) * alpha,
    lateralOffset: a.lateralOffset + (b.lateralOffset - a.lateralOffset) * alpha,
    stumbling: a.stumbling || b.stumbling,
  };
}

export function RaceAnimationEngine({
  result,
  slotsInfo,
  playing,
  onTimeUpdate,
  onComplete,
}: {
  result: RaceResult;
  slotsInfo: SlotInfo[];
  playing: boolean;
  onTimeUpdate?: (time: number) => void;
  onComplete?: () => void;
}) {
  const timeRef = useRef(0);
  const completedRef = useRef(false);
  const statesRef = useRef<Map<number, HorseState>>(new Map());

  // Build a lookup from slotId to horse result
  const horseMap = useRef(
    new Map(result.horses.map((h) => [h.slotId, h]))
  ).current;

  useFrame((_, delta) => {
    if (!playing) return;

    timeRef.current += delta;
    onTimeUpdate?.(timeRef.current);

    // Update all horse states
    for (const horse of result.horses) {
      const state = interpolateKeyframes(horse.keyframes, timeRef.current);
      statesRef.current.set(horse.slotId, state);
    }

    // Check completion
    if (timeRef.current >= result.durationSeconds + 1 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  // Reset function for replay
  const reset = useCallback(() => {
    timeRef.current = 0;
    completedRef.current = false;
  }, []);

  return (
    <group>
      {slotsInfo.map((slot) => {
        const horseResult = horseMap.get(slot.slotId);
        if (!horseResult) return null;

        const state = statesRef.current.get(slot.slotId) ?? {
          progress: 0,
          lateralOffset: 0,
          stumbling: false,
        };

        // Position: lanes spread across track width, progress along track
        const laneWidth = TRACK_WIDTH / (slotsInfo.length + 1);
        const x = -TRACK_WIDTH / 2 + laneWidth * slot.lane + state.lateralOffset;
        const z = state.progress * TRACK_LENGTH;

        return (
          <group key={slot.slotId} position={[x, 0, z]}>
            <Horse
              lane={slot.lane}
              displayName={slot.displayName}
              progress={state.progress}
              lateralOffset={state.lateralOffset}
              stumbling={state.stumbling}
            />
          </group>
        );
      })}
    </group>
  );
}
