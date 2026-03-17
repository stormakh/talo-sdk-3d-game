import type { BallKeyframe, BallResult, BallRaceResult } from "@/types";
import {
  generateCourse,
  COURSE_WIDTH,
  COURSE_HEIGHT,
  BALL_RADIUS,
  type Peg,
  type Spinner,
  type Gap,
  type Funnel,
} from "@/components/ball-race/ball-race-obstacles";
import { createRngFromString } from "@/lib/seeded-random";

const RACE_DURATION = 10.0;
const DT = 0.05; // 50ms per keyframe
const TOTAL_KEYFRAMES = Math.ceil(RACE_DURATION / DT); // 200
const WINNER_FINISH_TIME = 8.0;
const GRAVITY = 300; // pixels/s²
const FRICTION = 0.98;
const BOUNCE_DAMPING = 0.6;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ---------------------------------------------------------------------------
// Physics helpers
// ---------------------------------------------------------------------------

function deflectFromPeg(
  x: number,
  y: number,
  vx: number,
  vy: number,
  peg: Peg,
): { x: number; y: number; vx: number; vy: number } | null {
  const d = dist(x, y, peg.x, peg.y);
  const minDist = BALL_RADIUS + peg.radius;

  if (d < minDist && d > 0) {
    // Push ball out of peg
    const nx = (x - peg.x) / d;
    const ny = (y - peg.y) / d;
    const newX = peg.x + nx * minDist;
    const newY = peg.y + ny * minDist;

    // Reflect velocity
    const dot = vx * nx + vy * ny;
    const newVx = (vx - 2 * dot * nx) * BOUNCE_DAMPING;
    const newVy = (vy - 2 * dot * ny) * BOUNCE_DAMPING;

    return { x: newX, y: newY, vx: newVx, vy: newVy };
  }
  return null;
}

function handleSpinner(
  x: number,
  y: number,
  vx: number,
  vy: number,
  spinner: Spinner,
  _t: number,
): { vx: number; vy: number } | null {
  const d = dist(x, y, spinner.x, spinner.y);
  if (d < BALL_RADIUS + spinner.radius) {
    // Apply tangential force based on spinner rotation
    const angle = Math.atan2(y - spinner.y, x - spinner.x);
    const tangentAngle = angle + (Math.PI / 2) * spinner.direction;
    const force = spinner.speed * 40;
    return {
      vx: vx + Math.cos(tangentAngle) * force * DT,
      vy: vy + Math.sin(tangentAngle) * force * DT,
    };
  }
  return null;
}

function handleGap(
  x: number,
  y: number,
  vx: number,
  vy: number,
  gap: Gap,
): { x: number; y: number; vx: number; vy: number } | null {
  // Check if ball is at gap Y level
  if (Math.abs(y - gap.y) < BALL_RADIUS + gap.wallHeight / 2) {
    // Check if ball is NOT in the opening
    const inOpening =
      x > gap.openingX && x < gap.openingX + gap.openingWidth;
    if (!inOpening) {
      // Bounce off the wall
      return {
        x,
        y: gap.y - BALL_RADIUS - gap.wallHeight / 2,
        vx: vx * 0.8,
        vy: -Math.abs(vy) * BOUNCE_DAMPING,
      };
    }
  }
  return null;
}

function handleFunnel(
  x: number,
  y: number,
  vx: number,
  funnel: Funnel,
): { vx: number } | null {
  if (y > funnel.y && y < funnel.y + funnel.height) {
    const progress = (y - funnel.y) / funnel.height;
    const currentWidth =
      funnel.topWidth + (funnel.bottomWidth - funnel.topWidth) * progress;
    const leftEdge = funnel.centerX - currentWidth / 2;
    const rightEdge = funnel.centerX + currentWidth / 2;

    if (x < leftEdge) {
      return { vx: vx + 80 * DT }; // push right
    }
    if (x > rightEdge) {
      return { vx: vx - 80 * DT }; // push left
    }
    // Gently guide toward center
    const centerPull = (funnel.centerX - x) * 0.5 * DT;
    return { vx: vx + centerPull };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Core simulation
// ---------------------------------------------------------------------------

export function simulateBallRace(
  slotsInput: { id: number; ballIndex: number }[],
  obstaclesSeed: string,
): BallRaceResult {
  const N = slotsInput.length;
  if (N === 0) {
    return { durationSeconds: 0, balls: [], obstaclesSeed };
  }

  const course = generateCourse(obstaclesSeed);
  // Use a different seed for the race randomness (not obstacle layout)
  const rng = createRngFromString(obstaclesSeed + "_race");

  // 1. Random finish order
  const finishOrder = shuffle([...slotsInput], rng);

  // 2. Assign finish times
  const finishTimes: number[] = [WINNER_FINISH_TIME];
  for (let i = 1; i < N; i++) {
    finishTimes.push(finishTimes[i - 1] + 0.1 + rng() * 0.3);
  }

  // Map slotId -> position and target time
  const slotPosition = new Map<number, number>();
  const slotFinishTime = new Map<number, number>();
  for (let i = 0; i < N; i++) {
    slotPosition.set(finishOrder[i].id, i + 1);
    slotFinishTime.set(finishOrder[i].id, finishTimes[i]);
  }

  // 3. Simulate each ball
  const balls: BallResult[] = slotsInput.map((slot) => {
    const position = slotPosition.get(slot.id)!;
    const targetFinishTime = slotFinishTime.get(slot.id)!;
    const ballRng = createRngFromString(
      obstaclesSeed + "_ball_" + slot.id,
    );

    // Start position: spread evenly across top
    const startX =
      60 + ((COURSE_WIDTH - 120) / (N + 1)) * (slot.ballIndex);
    let x = startX + (ballRng() - 0.5) * 20;
    let y = 10;
    let vx = (ballRng() - 0.5) * 30;
    let vy = 0;
    let rotation = 0;

    // Speed factor to control how fast this ball falls (for ranking)
    const baseFallSpeed = 1.0 - (position - 1) * (0.12 / Math.max(N - 1, 1));

    const rawKeyframes: BallKeyframe[] = [];

    for (let i = 0; i < TOTAL_KEYFRAMES; i++) {
      const t = i * DT;

      // Apply gravity
      vy += GRAVITY * DT * baseFallSpeed;

      // Apply friction
      vx *= FRICTION;

      // Add slight random drift
      vx += (ballRng() - 0.5) * 15;

      // Update position
      x += vx * DT;
      y += vy * DT;

      // Collision with pegs
      for (const peg of course.pegs) {
        const result = deflectFromPeg(x, y, vx, vy, peg);
        if (result) {
          x = result.x;
          y = result.y;
          vx = result.vx;
          vy = result.vy;
        }
      }

      // Collision with spinners
      for (const spinner of course.spinners) {
        const result = handleSpinner(x, y, vx, vy, spinner, t);
        if (result) {
          vx = result.vx;
          vy = result.vy;
        }
      }

      // Collision with gaps
      for (const gap of course.gaps) {
        const result = handleGap(x, y, vx, vy, gap);
        if (result) {
          x = result.x;
          y = result.y;
          vx = result.vx;
          vy = result.vy;
        }
      }

      // Funnel guidance
      for (const funnel of course.funnels) {
        const result = handleFunnel(x, y, vx, funnel);
        if (result) {
          vx = result.vx;
        }
      }

      // Wall boundaries
      if (x < BALL_RADIUS + 20) {
        x = BALL_RADIUS + 20;
        vx = Math.abs(vx) * BOUNCE_DAMPING;
      }
      if (x > COURSE_WIDTH - BALL_RADIUS - 20) {
        x = COURSE_WIDTH - BALL_RADIUS - 20;
        vx = -Math.abs(vx) * BOUNCE_DAMPING;
      }

      // Rotation from horizontal movement
      rotation += (vx * DT) / BALL_RADIUS;

      rawKeyframes.push({
        t: parseFloat(t.toFixed(2)),
        x: parseFloat(x.toFixed(1)),
        y: parseFloat(y.toFixed(1)),
        rotation: parseFloat(rotation.toFixed(2)),
      });
    }

    // 4. Normalize Y so ball reaches bottom at target finish time
    const finishIndex = Math.min(
      Math.round(targetFinishTime / DT),
      TOTAL_KEYFRAMES - 1,
    );
    const rawYAtFinish = rawKeyframes[finishIndex].y;
    const targetY = COURSE_HEIGHT - 30; // finish line
    const yScale = rawYAtFinish > 0 ? targetY / rawYAtFinish : 1;

    const keyframes: BallKeyframe[] = rawKeyframes.map((kf) => ({
      t: kf.t,
      x: kf.x,
      y: parseFloat(Math.min(kf.y * yScale, targetY).toFixed(1)),
      rotation: kf.rotation,
    }));

    return { slotId: slot.id, finishPosition: position, keyframes };
  });

  const durationSeconds = parseFloat(Math.max(...finishTimes).toFixed(1));

  return { durationSeconds, balls, obstaclesSeed };
}
