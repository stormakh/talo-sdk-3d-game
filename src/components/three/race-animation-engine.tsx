"use client";

import { useRef, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
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

function FinishRope({ broken, breakX }: { broken: boolean; breakX: number }) {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const postLeft = -TRACK_WIDTH / 2 - 0.2;
  const postRight = TRACK_WIDTH / 2 + 0.2;

  useFrame((_, delta) => {
    if (!broken) return;
    timeRef.current += delta;
    const t = timeRef.current;

    // Rope halves swing outward and fall
    if (leftRef.current) {
      leftRef.current.rotation.y = Math.min(t * 2, Math.PI / 2);
      leftRef.current.position.y = Math.max(-0.5, -t * 0.3);
    }
    if (rightRef.current) {
      rightRef.current.rotation.y = Math.max(-t * 2, -Math.PI / 2);
      rightRef.current.position.y = Math.max(-0.5, -t * 0.3);
    }
  });

  if (broken) {
    // Two rope halves swinging from break point
    const leftLen = breakX - postLeft;
    const rightLen = postRight - breakX;
    return (
      <group position={[0, 0, TRACK_LENGTH]}>
        {/* Posts */}
        <mesh position={[postLeft, 0.6, 0]}>
          <boxGeometry args={[0.15, 1.2, 0.15]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[postRight, 0.6, 0]}>
          <boxGeometry args={[0.15, 1.2, 0.15]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Left half — pivots from left post */}
        <group ref={leftRef} position={[postLeft, 1.1, 0]}>
          <mesh position={[leftLen / 2, 0, 0]}>
            <boxGeometry args={[leftLen, 0.06, 0.06]} />
            <meshStandardMaterial color="#ff2222" />
          </mesh>
        </group>
        {/* Right half — pivots from right post */}
        <group ref={rightRef} position={[postRight, 1.1, 0]}>
          <mesh position={[-rightLen / 2, 0, 0]}>
            <boxGeometry args={[rightLen, 0.06, 0.06]} />
            <meshStandardMaterial color="#ff2222" />
          </mesh>
        </group>
      </group>
    );
  }

  // Intact rope
  return (
    <group position={[0, 0, TRACK_LENGTH]}>
      {/* Posts */}
      <mesh position={[postLeft, 0.6, 0]}>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[postRight, 0.6, 0]}>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {/* Rope */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[TRACK_WIDTH + 0.4, 0.06, 0.06]} />
        <meshStandardMaterial color="#ff2222" />
      </mesh>
    </group>
  );
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
  const ropeBrokenRef = useRef(false);
  const ropeBreakXRef = useRef(0);

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

    // Check if lead horse crossed finish — break the rope
    if (!ropeBrokenRef.current) {
      for (const [slotId, state] of statesRef.current) {
        if (state.progress >= 1.0) {
          ropeBrokenRef.current = true;
          const slot = slotsInfo.find((s) => s.slotId === slotId);
          if (slot) {
            const laneWidth = TRACK_WIDTH / (slotsInfo.length + 1);
            ropeBreakXRef.current = -TRACK_WIDTH / 2 + laneWidth * slot.lane;
          }
          break;
        }
      }
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
      <FinishRope broken={ropeBrokenRef.current} breakX={ropeBreakXRef.current} />
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
