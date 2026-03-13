import type { Keyframe, HorseResult, RaceResult } from "@/types";

const TOTAL_KEYFRAMES = 150;
const RACE_DURATION = 15.0;
const DT = RACE_DURATION / TOTAL_KEYFRAMES; // 0.1s
const WINNER_FINISH_TIME = 14.0;
const SEGMENTS = 5;
const SEGMENT_DURATION = RACE_DURATION / SEGMENTS; // 3s each

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fisher-Yates shuffle (in-place, returns same array). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Random float in [min, max]. */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Clamp value between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ---------------------------------------------------------------------------
// Core simulation
// ---------------------------------------------------------------------------

export function simulateRace(
  slots: { id: number; lane: number }[]
): RaceResult {
  const N = slots.length;
  if (N === 0) {
    return { durationSeconds: 0, horses: [] };
  }

  // 1. Determine random finish order via Fisher-Yates shuffle.
  const finishOrder = shuffle([...slots]);

  // 2. Decide finish times — winner at 14s, others spaced 0.1-0.5s apart.
  const finishTimes: number[] = [WINNER_FINISH_TIME];
  for (let i = 1; i < N; i++) {
    finishTimes.push(finishTimes[i - 1] + rand(0.1, 0.5));
  }

  // Map slotId -> position (1-indexed) and finish time.
  const slotPosition = new Map<number, number>();
  const slotFinishTime = new Map<number, number>();
  for (let i = 0; i < N; i++) {
    slotPosition.set(finishOrder[i].id, i + 1);
    slotFinishTime.set(finishOrder[i].id, finishTimes[i]);
  }

  // 3. Generate raw keyframes per horse.
  type RawHorse = {
    slotId: number;
    finishPosition: number;
    rawKeyframes: Keyframe[];
    targetFinishTime: number;
  };

  const horses: RawHorse[] = slots.map((slot) => {
    const position = slotPosition.get(slot.id)!;
    const targetFinishTime = slotFinishTime.get(slot.id)!;

    // Base speed — tighter spread so races look competitive.
    const baseSpeed =
      N > 1 ? 1.0 - (position - 1) * (0.15 / (N - 1)) : 1.0;

    // 5 segment speed multipliers in [0.7, 1.3].
    const segmentMultipliers: number[] = [];
    for (let s = 0; s < SEGMENTS; s++) {
      segmentMultipliers.push(rand(0.7, 1.3));
    }

    // Stumble event — 20% chance.
    const hasStumble = Math.random() < 0.2;
    const stumbleStart = hasStumble ? rand(2.0, 12.0) : -1;
    const stumbleDuration = hasStumble ? rand(0.3, 0.5) : 0;
    const stumbleEnd = stumbleStart + stumbleDuration;

    // Generate raw progress and lateral offset.
    const rawKeyframes: Keyframe[] = [];
    let progress = 0;
    let lateralOffset = 0;

    for (let i = 0; i < TOTAL_KEYFRAMES; i++) {
      const t = i * DT;

      // Determine which segment we are in.
      const segIndex = Math.min(
        Math.floor(t / SEGMENT_DURATION),
        SEGMENTS - 1
      );
      let speed = baseSpeed * segmentMultipliers[segIndex];

      // Check for stumble.
      const stumbling = hasStumble && t >= stumbleStart && t < stumbleEnd;
      if (stumbling) {
        speed *= 0.3;
      }

      // Final stretch boost for top-3 finishers (t > 12s).
      if (t > 12.0 && position <= 3) {
        speed *= 1.0 + (4 - position) * 0.05; // 1st +15%, 2nd +10%, 3rd +5%
      }

      progress += speed * DT;

      // Lateral wobble — smooth random walk, clamped to [-0.15, 0.15].
      const lateralDelta = rand(-0.02, 0.02);
      lateralOffset = clamp(lateralOffset + lateralDelta, -0.15, 0.15);

      rawKeyframes.push({
        t: parseFloat(t.toFixed(1)),
        progress,
        lateralOffset: parseFloat(lateralOffset.toFixed(4)),
        stumbling,
      });
    }

    return { slotId: slot.id, finishPosition: position, rawKeyframes, targetFinishTime };
  });

  // 4. Normalize progress so each horse reaches 1.0 at its target finish time.
  const result: HorseResult[] = horses.map(
    ({ slotId, finishPosition, rawKeyframes, targetFinishTime }) => {
      // Find the raw progress at the target finish time index.
      const finishIndex = Math.min(
        Math.round(targetFinishTime / DT),
        TOTAL_KEYFRAMES - 1
      );
      const rawProgressAtFinish = rawKeyframes[finishIndex].progress;

      // Scale factor so that progress == 1.0 at finishIndex.
      const scale =
        rawProgressAtFinish > 0 ? 1.0 / rawProgressAtFinish : 1.0;

      const keyframes: Keyframe[] = rawKeyframes.map((kf, i) => ({
        t: kf.t,
        progress: Math.min(kf.progress * scale, 1.0),
        lateralOffset: kf.lateralOffset,
        stumbling: kf.stumbling,
      }));

      return { slotId, finishPosition, keyframes };
    }
  );

  // Overall duration is the latest finish time.
  const durationSeconds = parseFloat(
    Math.max(...finishTimes).toFixed(1)
  );

  return { durationSeconds, horses: result };
}
