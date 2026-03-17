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
  type Ring,
  type Bumper,
  type Ramp,
  type BouncePad,
  type Bucket,
} from "@/components/ball-race/ball-race-obstacles";
import { createRngFromString } from "@/lib/seeded-random";

const RACE_DURATION = 35.0;
const DT = 0.04; // 40ms per keyframe
const TOTAL_KEYFRAMES = Math.ceil(RACE_DURATION / DT);
const WINNER_FINISH_TIME = 28.0;
const GRAVITY = 280;
const FRICTION = 0.985;
const BOUNCE_DAMPING = 0.55;
const WALL_MARGIN = 25;

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

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

// ---------------------------------------------------------------------------
// Collision handlers
// ---------------------------------------------------------------------------

type Vec = { x: number; y: number; vx: number; vy: number };

function deflectFromCircle(
  x: number,
  y: number,
  vx: number,
  vy: number,
  cx: number,
  cy: number,
  minDist: number,
  damping: number,
): Vec | null {
  const d = dist(x, y, cx, cy);
  if (d < minDist && d > 0) {
    const nx = (x - cx) / d;
    const ny = (y - cy) / d;
    const dot = vx * nx + vy * ny;
    return {
      x: cx + nx * minDist,
      y: cy + ny * minDist,
      vx: (vx - 2 * dot * nx) * damping,
      vy: (vy - 2 * dot * ny) * damping,
    };
  }
  return null;
}

function handlePeg(
  x: number, y: number, vx: number, vy: number, peg: Peg,
): Vec | null {
  return deflectFromCircle(x, y, vx, vy, peg.x, peg.y, BALL_RADIUS + peg.radius, BOUNCE_DAMPING);
}

function handleBumper(
  x: number, y: number, vx: number, vy: number, bumper: Bumper,
): Vec | null {
  const r = deflectFromCircle(x, y, vx, vy, bumper.x, bumper.y, BALL_RADIUS + bumper.radius, 1.0);
  if (r) {
    // Bumpers add extra velocity outward
    const d = dist(x, y, bumper.x, bumper.y);
    const nx = (x - bumper.x) / (d || 1);
    const ny = (y - bumper.y) / (d || 1);
    r.vx += nx * bumper.strength * 80;
    r.vy += ny * bumper.strength * 80;
  }
  return r;
}

function handleRing(
  x: number, y: number, vx: number, vy: number, ring: Ring,
): Vec | null {
  const d = dist(x, y, ring.x, ring.y);
  // Bounce off outer edge
  if (d > ring.outerRadius - BALL_RADIUS && d < ring.outerRadius + BALL_RADIUS) {
    return deflectFromCircle(x, y, vx, vy, ring.x, ring.y, ring.outerRadius + BALL_RADIUS, BOUNCE_DAMPING);
  }
  // Bounce off inner edge (if inside the ring donut)
  if (d < ring.innerRadius + BALL_RADIUS && d > 0) {
    // Push outward from center
    const nx = (x - ring.x) / d;
    const ny = (y - ring.y) / d;
    const dot = vx * nx + vy * ny;
    return {
      x: ring.x + nx * (ring.innerRadius + BALL_RADIUS),
      y: ring.y + ny * (ring.innerRadius + BALL_RADIUS),
      vx: (vx - 2 * dot * nx) * BOUNCE_DAMPING,
      vy: (vy - 2 * dot * ny) * BOUNCE_DAMPING,
    };
  }
  return null;
}

function handleSpinner(
  x: number, y: number, vx: number, vy: number, spinner: Spinner,
): { vx: number; vy: number } | null {
  const d = dist(x, y, spinner.x, spinner.y);
  if (d < BALL_RADIUS + spinner.radius) {
    const angle = Math.atan2(y - spinner.y, x - spinner.x);
    const tangentAngle = angle + (Math.PI / 2) * spinner.direction;
    const force = spinner.speed * 50;
    return {
      vx: vx + Math.cos(tangentAngle) * force * DT,
      vy: vy + Math.sin(tangentAngle) * force * DT,
    };
  }
  return null;
}

function handleGap(
  x: number, y: number, vx: number, vy: number, gap: Gap,
): Vec | null {
  if (Math.abs(y - gap.y) < BALL_RADIUS + gap.wallHeight / 2) {
    const inOpening = x > gap.openingX && x < gap.openingX + gap.openingWidth;
    if (!inOpening) {
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
  x: number, y: number, vx: number, funnel: Funnel,
): { vx: number } | null {
  if (y > funnel.y && y < funnel.y + funnel.height) {
    const progress = (y - funnel.y) / funnel.height;
    const currentWidth =
      funnel.topWidth + (funnel.bottomWidth - funnel.topWidth) * progress;
    const leftEdge = funnel.centerX - currentWidth / 2;
    const rightEdge = funnel.centerX + currentWidth / 2;
    if (x < leftEdge) return { vx: vx + 100 * DT };
    if (x > rightEdge) return { vx: vx - 100 * DT };
    return { vx: vx + (funnel.centerX - x) * 0.6 * DT };
  }
  return null;
}

function handleRamp(
  x: number, y: number, vx: number, vy: number, ramp: Ramp,
): Vec | null {
  // Line segment collision
  const dx = ramp.x2 - ramp.x1;
  const dy = ramp.y2 - ramp.y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;

  const nx = -dy / len; // normal (pointing "up" from the ramp)
  const ny = dx / len;

  // Distance from ball to line
  const px = x - ramp.x1;
  const py = y - ramp.y1;
  const dotN = px * nx + py * ny;
  const dotT = px * (dx / len) + py * (dy / len);

  if (
    Math.abs(dotN) < BALL_RADIUS + ramp.thickness / 2 &&
    dotT >= 0 &&
    dotT <= len
  ) {
    // Reflect velocity off normal
    const velDotN = vx * nx + vy * ny;
    if (velDotN < 0) {
      // Ball moving toward ramp
      return {
        x: x - nx * (dotN - (BALL_RADIUS + ramp.thickness / 2)),
        y: y - ny * (dotN - (BALL_RADIUS + ramp.thickness / 2)),
        vx: (vx - 2 * velDotN * nx) * BOUNCE_DAMPING,
        vy: (vy - 2 * velDotN * ny) * BOUNCE_DAMPING,
      };
    }
  }
  return null;
}

function handleBouncePad(
  x: number, y: number, vx: number, vy: number, pad: BouncePad,
): Vec | null {
  if (
    x > pad.x &&
    x < pad.x + pad.width &&
    y > pad.y - BALL_RADIUS &&
    y < pad.y + 6 &&
    vy > 0
  ) {
    return {
      x,
      y: pad.y - BALL_RADIUS,
      vx: vx * 0.9,
      vy: -Math.abs(vy) * pad.strength * 0.5,
    };
  }
  return null;
}

function handleBucket(
  x: number, y: number, vx: number, vy: number, bucket: Bucket,
): Vec | null {
  const left = bucket.x;
  const right = bucket.x + bucket.width;
  const top = bucket.y;
  const bottom = bucket.y + bucket.height;

  // Left wall
  if (x > left - BALL_RADIUS && x < left + 5 && y > top && y < bottom) {
    return { x: left - BALL_RADIUS, y, vx: -Math.abs(vx) * BOUNCE_DAMPING, vy };
  }
  // Right wall
  if (x < right + BALL_RADIUS && x > right - 5 && y > top && y < bottom) {
    return { x: right + BALL_RADIUS, y, vx: Math.abs(vx) * BOUNCE_DAMPING, vy };
  }
  // Bottom
  if (y > bottom - BALL_RADIUS && y < bottom + 5 && x > left && x < right) {
    return { x, y: bottom - BALL_RADIUS, vx, vy: -Math.abs(vy) * BOUNCE_DAMPING };
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
  const rng = createRngFromString(obstaclesSeed + "_race");

  // 1. Random finish order
  const finishOrder = shuffle([...slotsInput], rng);

  // 2. Assign finish times — winner at 28s, others staggered
  const finishTimes: number[] = [WINNER_FINISH_TIME];
  for (let i = 1; i < N; i++) {
    finishTimes.push(finishTimes[i - 1] + 0.15 + rng() * 0.5);
  }

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
    const ballRng = createRngFromString(obstaclesSeed + "_ball_" + slot.id);

    const startX = 50 + ((COURSE_WIDTH - 100) / (N + 1)) * slot.ballIndex;
    let x = startX + (ballRng() - 0.5) * 20;
    let y = 15;
    let vx = (ballRng() - 0.5) * 20;
    let vy = 0;
    let rotation = 0;

    const baseFallSpeed =
      1.0 - (position - 1) * (0.1 / Math.max(N - 1, 1));

    const rawKeyframes: BallKeyframe[] = [];

    for (let i = 0; i < TOTAL_KEYFRAMES; i++) {
      const t = i * DT;

      // Gravity
      vy += GRAVITY * DT * baseFallSpeed;
      // Friction
      vx *= FRICTION;
      // Random drift
      vx += (ballRng() - 0.5) * 12;

      // Update position
      x += vx * DT;
      y += vy * DT;

      // Collisions — pegs
      for (const peg of course.pegs) {
        const r = handlePeg(x, y, vx, vy, peg);
        if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; }
      }
      // Bumpers
      for (const bumper of course.bumpers) {
        const r = handleBumper(x, y, vx, vy, bumper);
        if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; }
      }
      // Rings
      for (const ring of course.rings) {
        const r = handleRing(x, y, vx, vy, ring);
        if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; }
      }
      // Spinners
      for (const spinner of course.spinners) {
        const r = handleSpinner(x, y, vx, vy, spinner);
        if (r) { vx = r.vx; vy = r.vy; }
      }
      // Gaps
      for (const gap of course.gaps) {
        const r = handleGap(x, y, vx, vy, gap);
        if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; }
      }
      // Funnels
      for (const funnel of course.funnels) {
        const r = handleFunnel(x, y, vx, funnel);
        if (r) { vx = r.vx; }
      }
      // Ramps
      for (const ramp of course.ramps) {
        const r = handleRamp(x, y, vx, vy, ramp);
        if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; }
      }
      // Bounce pads
      for (const pad of course.bouncePads) {
        const r = handleBouncePad(x, y, vx, vy, pad);
        if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; }
      }
      // Buckets
      for (const bucket of course.buckets) {
        const r = handleBucket(x, y, vx, vy, bucket);
        if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; }
      }

      // Walls
      if (x < BALL_RADIUS + WALL_MARGIN) {
        x = BALL_RADIUS + WALL_MARGIN;
        vx = Math.abs(vx) * BOUNCE_DAMPING;
      }
      if (x > COURSE_WIDTH - BALL_RADIUS - WALL_MARGIN) {
        x = COURSE_WIDTH - BALL_RADIUS - WALL_MARGIN;
        vx = -Math.abs(vx) * BOUNCE_DAMPING;
      }

      // Cap downward velocity
      vy = clamp(vy, -400, 500);

      rotation += (vx * DT) / BALL_RADIUS;

      rawKeyframes.push({
        t: parseFloat(t.toFixed(2)),
        x: parseFloat(x.toFixed(1)),
        y: parseFloat(y.toFixed(1)),
        rotation: parseFloat(rotation.toFixed(2)),
      });
    }

    // Normalize Y
    const finishIndex = Math.min(
      Math.round(targetFinishTime / DT),
      TOTAL_KEYFRAMES - 1,
    );
    const rawYAtFinish = rawKeyframes[finishIndex].y;
    const targetY = COURSE_HEIGHT - 50;
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
