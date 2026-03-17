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

// Course is 5000 units tall. Target: winner finishes in ~25s.
// Average speed needed: 5000/25 = 200 px/s.
// With obstacles causing bounces, we need gravity that sustains ~200 px/s average.
// Terminal velocity (where gravity = drag from obstacles) should be ~250-300 px/s.
const RACE_DURATION = 32.0;
const DT = 0.04;
const TOTAL_KEYFRAMES = Math.ceil(RACE_DURATION / DT); // 800
const GRAVITY = 400; // strong gravity — units are px/s²
const FRICTION = 0.97;
const BOUNCE_DAMPING = 0.65;
const WALL_MARGIN = 25;
const MIN_DOWNWARD_VY = 60; // balls always fall at least this fast — prevents stalling

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
// Collision handlers — return new state or null if no collision
// ---------------------------------------------------------------------------

type Vec = { x: number; y: number; vx: number; vy: number };

function deflectFromCircle(
  x: number, y: number, vx: number, vy: number,
  cx: number, cy: number, minDist: number, damping: number,
): Vec | null {
  const d = dist(x, y, cx, cy);
  if (d < minDist && d > 0.1) {
    const nx = (x - cx) / d;
    const ny = (y - cy) / d;
    const dot = vx * nx + vy * ny;
    if (dot < 0) {
      // Only deflect if moving toward the obstacle
      return {
        x: cx + nx * (minDist + 0.5),
        y: cy + ny * (minDist + 0.5),
        vx: (vx - 2 * dot * nx) * damping,
        vy: (vy - 2 * dot * ny) * damping,
      };
    }
  }
  return null;
}

function handlePeg(x: number, y: number, vx: number, vy: number, peg: Peg): Vec | null {
  return deflectFromCircle(x, y, vx, vy, peg.x, peg.y, BALL_RADIUS + peg.radius, BOUNCE_DAMPING);
}

function handleBumper(x: number, y: number, vx: number, vy: number, bumper: Bumper): Vec | null {
  const r = deflectFromCircle(x, y, vx, vy, bumper.x, bumper.y, BALL_RADIUS + bumper.radius, 0.9);
  if (r) {
    const d = dist(x, y, bumper.x, bumper.y) || 1;
    const nx = (x - bumper.x) / d;
    const ny = (y - bumper.y) / d;
    r.vx += nx * bumper.strength * 30;
    r.vy += ny * bumper.strength * 30;
  }
  return r;
}

function handleRing(x: number, y: number, vx: number, vy: number, ring: Ring): Vec | null {
  const d = dist(x, y, ring.x, ring.y);
  // Outer edge — bounce inward
  if (d > ring.outerRadius - BALL_RADIUS && d < ring.outerRadius + BALL_RADIUS) {
    return deflectFromCircle(x, y, vx, vy, ring.x, ring.y, ring.outerRadius + BALL_RADIUS, BOUNCE_DAMPING);
  }
  // Inner edge — bounce outward (push away from center)
  if (d < ring.innerRadius + BALL_RADIUS && d > 0.1) {
    const nx = (x - ring.x) / d;
    const ny = (y - ring.y) / d;
    const dot = vx * nx + vy * ny;
    if (dot < 0) {
      return {
        x: ring.x + nx * (ring.innerRadius + BALL_RADIUS + 0.5),
        y: ring.y + ny * (ring.innerRadius + BALL_RADIUS + 0.5),
        vx: (vx - 2 * dot * nx) * BOUNCE_DAMPING,
        vy: (vy - 2 * dot * ny) * BOUNCE_DAMPING,
      };
    }
  }
  return null;
}

function handleSpinner(x: number, y: number, vx: number, vy: number, spinner: Spinner): { vx: number; vy: number } | null {
  const d = dist(x, y, spinner.x, spinner.y);
  if (d < BALL_RADIUS + spinner.radius + 5) {
    const angle = Math.atan2(y - spinner.y, x - spinner.x);
    const tangentAngle = angle + (Math.PI / 2) * spinner.direction;
    const force = Math.abs(spinner.speed) * 8;
    return {
      vx: vx + Math.cos(tangentAngle) * force,
      vy: vy + Math.sin(tangentAngle) * force,
    };
  }
  return null;
}

function handleGap(x: number, y: number, vx: number, vy: number, gap: Gap): Vec | null {
  if (y > gap.y - BALL_RADIUS - gap.wallHeight / 2 &&
      y < gap.y + BALL_RADIUS + gap.wallHeight / 2 &&
      vy > 0) {
    const inOpening = x > gap.openingX - 5 && x < gap.openingX + gap.openingWidth + 5;
    if (!inOpening) {
      return {
        x,
        y: gap.y - BALL_RADIUS - gap.wallHeight / 2 - 1,
        vx: vx * 0.9,
        vy: -vy * 0.4,
      };
    }
  }
  return null;
}

function handleFunnel(x: number, y: number, vx: number, funnel: Funnel): { vx: number } | null {
  if (y > funnel.y && y < funnel.y + funnel.height) {
    const progress = (y - funnel.y) / funnel.height;
    const currentWidth = funnel.topWidth + (funnel.bottomWidth - funnel.topWidth) * progress;
    const leftEdge = funnel.centerX - currentWidth / 2;
    const rightEdge = funnel.centerX + currentWidth / 2;
    if (x < leftEdge) return { vx: vx + 3 };
    if (x > rightEdge) return { vx: vx - 3 };
    return { vx: vx + (funnel.centerX - x) * 0.02 };
  }
  return null;
}

function handleRamp(x: number, y: number, vx: number, vy: number, ramp: Ramp): Vec | null {
  const dx = ramp.x2 - ramp.x1;
  const dy = ramp.y2 - ramp.y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;

  const nx = -dy / len;
  const ny = dx / len;
  const px = x - ramp.x1;
  const py = y - ramp.y1;
  const dotN = px * nx + py * ny;
  const dotT = px * (dx / len) + py * (dy / len);

  const threshold = BALL_RADIUS + ramp.thickness / 2;
  if (Math.abs(dotN) < threshold && dotT >= -5 && dotT <= len + 5) {
    const velDotN = vx * nx + vy * ny;
    if (velDotN < 0) {
      return {
        x: x + nx * (threshold - dotN + 1),
        y: y + ny * (threshold - dotN + 1),
        vx: (vx - 2 * velDotN * nx) * BOUNCE_DAMPING,
        vy: (vy - 2 * velDotN * ny) * BOUNCE_DAMPING,
      };
    }
  }
  return null;
}

function handleBouncePad(x: number, y: number, vx: number, vy: number, pad: BouncePad): Vec | null {
  if (x > pad.x && x < pad.x + pad.width &&
      y > pad.y - BALL_RADIUS - 2 && y < pad.y + 8 && vy > 0) {
    return {
      x,
      y: pad.y - BALL_RADIUS - 2,
      vx: vx * 0.9,
      vy: -Math.abs(vy) * 0.6 - pad.strength * 5,
    };
  }
  return null;
}

function handleBucket(x: number, y: number, vx: number, vy: number, bucket: Bucket): Vec | null {
  const left = bucket.x;
  const right = bucket.x + bucket.width;
  const bottom = bucket.y + bucket.height;

  // Only interact if ball is inside horizontal range
  if (x > left - BALL_RADIUS && x < right + BALL_RADIUS && y > bucket.y && y < bottom + BALL_RADIUS) {
    // Left wall
    if (x < left + BALL_RADIUS + 3 && vx < 0) {
      return { x: left + BALL_RADIUS + 3, y, vx: Math.abs(vx) * 0.5, vy };
    }
    // Right wall
    if (x > right - BALL_RADIUS - 3 && vx > 0) {
      return { x: right - BALL_RADIUS - 3, y, vx: -Math.abs(vx) * 0.5, vy };
    }
    // Bottom
    if (y > bottom - BALL_RADIUS - 3 && vy > 0) {
      return { x, y: bottom - BALL_RADIUS - 3, vx: vx * 0.8, vy: -Math.abs(vy) * 0.3 };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Core simulation — NO Y-normalization, physics-driven pacing
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

  // Gravity modifier per position: 1st place gets slightly more gravity
  const gravityBySlot = new Map<number, number>();
  for (let i = 0; i < N; i++) {
    // 1st place: 1.0, last place: ~0.88 — small spread so race is competitive
    const factor = 1.0 - i * (0.12 / Math.max(N - 1, 1));
    gravityBySlot.set(finishOrder[i].id, GRAVITY * factor);
  }

  const finishY = COURSE_HEIGHT - 50;

  // 2. Simulate each ball
  const balls: BallResult[] = [];
  const finishTimes: number[] = [];

  for (const slot of slotsInput) {
    const slotGravity = gravityBySlot.get(slot.id) ?? GRAVITY;
    const ballRng = createRngFromString(obstaclesSeed + "_ball_" + slot.id);

    const startX = 50 + ((COURSE_WIDTH - 100) / Math.max(N + 1, 2)) * slot.ballIndex;
    let x = startX + (ballRng() - 0.5) * 20;
    let y = 15;
    let vx = (ballRng() - 0.5) * 10;
    let vy = 0;
    let rotation = 0;
    let finished = false;
    let finishTime = RACE_DURATION;
    let stallCounter = 0;
    let lastProgressY = 0;

    const keyframes: BallKeyframe[] = [];

    for (let i = 0; i < TOTAL_KEYFRAMES; i++) {
      const t = i * DT;

      if (!finished) {
        // Gravity
        vy += slotGravity * DT;

        // Friction (horizontal only)
        vx *= FRICTION;

        // Small random lateral drift
        vx += (ballRng() - 0.5) * 3;

        // Update position
        x += vx * DT;
        y += vy * DT;

        // --- Collisions (only check nearby obstacles) ---
        // Max 1 collision per frame to prevent multi-hit chaos
        let collided = false;

        if (!collided) for (const peg of course.pegs) {
          if (Math.abs(peg.y - y) > 30) continue;
          const r = handlePeg(x, y, vx, vy, peg);
          if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; collided = true; break; }
        }
        if (!collided) for (const bumper of course.bumpers) {
          if (Math.abs(bumper.y - y) > 50) continue;
          const r = handleBumper(x, y, vx, vy, bumper);
          if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; collided = true; break; }
        }
        if (!collided) for (const ring of course.rings) {
          if (Math.abs(ring.y - y) > ring.outerRadius + 20) continue;
          const r = handleRing(x, y, vx, vy, ring);
          if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; collided = true; break; }
        }
        if (!collided) for (const spinner of course.spinners) {
          if (Math.abs(spinner.y - y) > spinner.radius + 20) continue;
          const r = handleSpinner(x, y, vx, vy, spinner);
          if (r) { vx = r.vx; vy = r.vy; break; }
        }
        if (!collided) for (const gap of course.gaps) {
          if (Math.abs(gap.y - y) > 20) continue;
          const r = handleGap(x, y, vx, vy, gap);
          if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; collided = true; break; }
        }
        for (const funnel of course.funnels) {
          const r = handleFunnel(x, y, vx, funnel);
          if (r) { vx = r.vx; }
        }
        if (!collided) for (const ramp of course.ramps) {
          if (Math.abs(Math.min(ramp.y1, ramp.y2) - y) > 40) continue;
          const r = handleRamp(x, y, vx, vy, ramp);
          if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; collided = true; break; }
        }
        if (!collided) for (const pad of course.bouncePads) {
          if (Math.abs(pad.y - y) > 20) continue;
          const r = handleBouncePad(x, y, vx, vy, pad);
          if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; collided = true; break; }
        }
        if (!collided) for (const bucket of course.buckets) {
          const r = handleBucket(x, y, vx, vy, bucket);
          if (r) { x = r.x; y = r.y; vx = r.vx; vy = r.vy; collided = true; break; }
        }

        // Wall boundaries
        if (x < BALL_RADIUS + WALL_MARGIN) {
          x = BALL_RADIUS + WALL_MARGIN;
          vx = Math.abs(vx) * 0.5;
        }
        if (x > COURSE_WIDTH - BALL_RADIUS - WALL_MARGIN) {
          x = COURSE_WIDTH - BALL_RADIUS - WALL_MARGIN;
          vx = -Math.abs(vx) * 0.5;
        }

        // Cap velocities
        vx = clamp(vx, -150, 150);
        vy = clamp(vy, -100, 350);

        // Anti-stall: if ball hasn't progressed 10 units in 15 frames, force it down
        if (i % 15 === 0) {
          if (y - lastProgressY < 10) {
            stallCounter++;
            if (stallCounter >= 2) {
              // Teleport ball past the blockage
              y += 40;
              vy = MIN_DOWNWARD_VY * 2;
              vx = (ballRng() - 0.5) * 40;
              stallCounter = 0;
            }
          } else {
            stallCounter = 0;
          }
          lastProgressY = y;
        }

        // Ensure ball always has some downward momentum
        if (vy < MIN_DOWNWARD_VY) {
          vy += (MIN_DOWNWARD_VY - vy) * 0.3; // gradually restore, don't snap
        }

        rotation += (vx * DT) / BALL_RADIUS;

        // Check finish
        if (y >= finishY) {
          y = finishY;
          vy = 0;
          finished = true;
          finishTime = t;
        }
      }

      keyframes.push({
        t: parseFloat(t.toFixed(2)),
        x: parseFloat(x.toFixed(1)),
        y: parseFloat(y.toFixed(1)),
        rotation: parseFloat(rotation.toFixed(2)),
      });
    }

    finishTimes.push(finishTime);

    // Determine finish position based on actual finish time
    balls.push({ slotId: slot.id, finishPosition: 0, keyframes });
  }

  // Assign finish positions by actual finish times
  const sortedByFinish = balls
    .map((b, i) => ({ idx: i, time: finishTimes[i] }))
    .sort((a, b) => a.time - b.time);

  for (let i = 0; i < sortedByFinish.length; i++) {
    balls[sortedByFinish[i].idx].finishPosition = i + 1;
  }

  const durationSeconds = parseFloat(Math.max(...finishTimes).toFixed(1));

  return { durationSeconds, balls, obstaclesSeed };
}
