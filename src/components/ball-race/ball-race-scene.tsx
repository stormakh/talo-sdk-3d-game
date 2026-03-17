"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { BallRaceResult } from "@/types";
import {
  generateCourse,
  COURSE_WIDTH,
  COURSE_HEIGHT,
  BALL_RADIUS,
  VIEWPORT_HEIGHT,
  type CourseLayout,
  type Peg,
  type Spinner,
  type Ring,
  type Bumper,
  type Ramp,
  type BouncePad,
  type Bucket,
  type Gap,
  type Funnel,
} from "./ball-race-obstacles";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANVAS_W = 400;
const CANVAS_H = 700; // tall portrait viewport

const BALL_COLORS = [
  "#e74c3c", "#3498db", "#2ecc71", "#f39c12",
  "#9b59b6", "#1abc9c", "#e67e22", "#e84393",
  "#00cec9", "#fd79a8", "#6c5ce7", "#00b894",
  "#fdcb6e", "#d63031", "#0984e3", "#636e72",
];

type SlotInfo = {
  slotId: number;
  displayName: string;
  avatarUrl: string | null;
};

type BallRaceSceneProps = {
  result: BallRaceResult;
  slotsInfo: SlotInfo[];
  onComplete?: () => void;
};

// ---------------------------------------------------------------------------
// Keyframe interpolation
// ---------------------------------------------------------------------------

function interpolate(
  keyframes: { t: number; x: number; y: number; rotation: number }[],
  time: number,
): { x: number; y: number; rotation: number } {
  if (keyframes.length === 0) return { x: 0, y: 0, rotation: 0 };
  if (time <= keyframes[0].t) return keyframes[0];
  if (time >= keyframes[keyframes.length - 1].t)
    return keyframes[keyframes.length - 1];

  let lo = 0;
  let hi = keyframes.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (keyframes[mid].t <= time) lo = mid;
    else hi = mid;
  }

  const a = keyframes[lo];
  const b = keyframes[hi];
  const alpha = (time - a.t) / (b.t - a.t);

  return {
    x: a.x + (b.x - a.x) * alpha,
    y: a.y + (b.y - a.y) * alpha,
    rotation: a.rotation + (b.rotation - a.rotation) * alpha,
  };
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------

function drawPeg(ctx: CanvasRenderingContext2D, peg: Peg) {
  ctx.beginPath();
  ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
  ctx.fillStyle = peg.color ?? "#c8a84e";
  ctx.fill();
  // Highlight
  ctx.beginPath();
  ctx.arc(peg.x - peg.radius * 0.25, peg.y - peg.radius * 0.25, peg.radius * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fill();
}

function drawSpinner(ctx: CanvasRenderingContext2D, spinner: Spinner, time: number) {
  ctx.save();
  ctx.translate(spinner.x, spinner.y);
  ctx.rotate(time * spinner.speed);

  ctx.strokeStyle = "#c8a84e";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  for (let arm = 0; arm < spinner.arms; arm++) {
    const angle = (Math.PI * 2 / spinner.arms) * arm;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * spinner.radius, Math.sin(angle) * spinner.radius);
    ctx.stroke();
    // Paddle at end
    ctx.beginPath();
    ctx.arc(
      Math.cos(angle) * spinner.radius,
      Math.sin(angle) * spinner.radius,
      6, 0, Math.PI * 2,
    );
    ctx.fillStyle = "#e67e22";
    ctx.fill();
  }

  // Center hub
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#c8a84e";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#0d1a0d";
  ctx.fill();

  ctx.restore();
}

function drawRing(ctx: CanvasRenderingContext2D, ring: Ring) {
  ctx.beginPath();
  ctx.arc(ring.x, ring.y, ring.outerRadius, 0, Math.PI * 2);
  ctx.arc(ring.x, ring.y, ring.innerRadius, 0, Math.PI * 2, true);
  ctx.fillStyle = ring.color;
  ctx.fill();
  // Inner glow
  ctx.beginPath();
  ctx.arc(ring.x, ring.y, ring.outerRadius, 0, Math.PI * 2);
  ctx.arc(ring.x, ring.y, ring.innerRadius, 0, Math.PI * 2, true);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBumper(ctx: CanvasRenderingContext2D, bumper: Bumper) {
  // Outer glow
  const grad = ctx.createRadialGradient(
    bumper.x, bumper.y, bumper.radius * 0.3,
    bumper.x, bumper.y, bumper.radius * 1.3,
  );
  grad.addColorStop(0, bumper.color);
  grad.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(bumper.x, bumper.y, bumper.radius * 1.3, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  // Body
  ctx.beginPath();
  ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
  ctx.fillStyle = bumper.color;
  ctx.fill();
  // Highlight
  ctx.beginPath();
  ctx.arc(bumper.x - bumper.radius * 0.2, bumper.y - bumper.radius * 0.2, bumper.radius * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fill();
}

function drawRamp(ctx: CanvasRenderingContext2D, ramp: Ramp) {
  ctx.beginPath();
  ctx.moveTo(ramp.x1, ramp.y1);
  ctx.lineTo(ramp.x2, ramp.y2);
  ctx.strokeStyle = "#c8a84e";
  ctx.lineWidth = ramp.thickness;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawBouncePad(ctx: CanvasRenderingContext2D, pad: BouncePad) {
  // Spring body
  ctx.fillStyle = pad.color;
  const r = 4;
  ctx.beginPath();
  ctx.moveTo(pad.x + r, pad.y);
  ctx.lineTo(pad.x + pad.width - r, pad.y);
  ctx.quadraticCurveTo(pad.x + pad.width, pad.y, pad.x + pad.width, pad.y + r);
  ctx.lineTo(pad.x + pad.width, pad.y + 6);
  ctx.lineTo(pad.x, pad.y + 6);
  ctx.lineTo(pad.x, pad.y + r);
  ctx.quadraticCurveTo(pad.x, pad.y, pad.x + r, pad.y);
  ctx.fill();
  // Zig-zag spring pattern
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const segments = 6;
  const sw = pad.width / segments;
  for (let i = 0; i < segments; i++) {
    const sx = pad.x + sw * i;
    ctx.moveTo(sx, pad.y + 1);
    ctx.lineTo(sx + sw / 2, pad.y + 5);
    ctx.lineTo(sx + sw, pad.y + 1);
  }
  ctx.stroke();
}

function drawBucket(ctx: CanvasRenderingContext2D, bucket: Bucket) {
  ctx.strokeStyle = "#c8a84e";
  ctx.lineWidth = 3;
  // Left wall
  ctx.beginPath();
  ctx.moveTo(bucket.x, bucket.y);
  ctx.lineTo(bucket.x, bucket.y + bucket.height);
  ctx.stroke();
  // Bottom
  ctx.beginPath();
  ctx.moveTo(bucket.x, bucket.y + bucket.height);
  ctx.lineTo(bucket.x + bucket.width, bucket.y + bucket.height);
  ctx.stroke();
  // Right wall
  ctx.beginPath();
  ctx.moveTo(bucket.x + bucket.width, bucket.y);
  ctx.lineTo(bucket.x + bucket.width, bucket.y + bucket.height);
  ctx.stroke();
}

function drawGap(ctx: CanvasRenderingContext2D, gap: Gap) {
  ctx.fillStyle = "rgba(200, 168, 78, 0.7)";
  ctx.fillRect(25, gap.y - gap.wallHeight / 2, gap.openingX - 25, gap.wallHeight);
  const rightStart = gap.openingX + gap.openingWidth;
  ctx.fillRect(rightStart, gap.y - gap.wallHeight / 2, COURSE_WIDTH - 25 - rightStart, gap.wallHeight);
}

function drawFunnel(ctx: CanvasRenderingContext2D, funnel: Funnel) {
  const tl = funnel.centerX - funnel.topWidth / 2;
  const tr = funnel.centerX + funnel.topWidth / 2;
  const bl = funnel.centerX - funnel.bottomWidth / 2;
  const br = funnel.centerX + funnel.bottomWidth / 2;

  ctx.strokeStyle = "#c8a84e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tl, funnel.y);
  ctx.lineTo(bl, funnel.y + funnel.height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tr, funnel.y);
  ctx.lineTo(br, funnel.y + funnel.height);
  ctx.stroke();
}

function drawObstacles(ctx: CanvasRenderingContext2D, course: CourseLayout, time: number) {
  for (const peg of course.pegs) drawPeg(ctx, peg);
  for (const spinner of course.spinners) drawSpinner(ctx, spinner, time);
  for (const ring of course.rings) drawRing(ctx, ring);
  for (const bumper of course.bumpers) drawBumper(ctx, bumper);
  for (const ramp of course.ramps) drawRamp(ctx, ramp);
  for (const pad of course.bouncePads) drawBouncePad(ctx, pad);
  for (const bucket of course.buckets) drawBucket(ctx, bucket);
  for (const gap of course.gaps) drawGap(ctx, gap);
  for (const funnel of course.funnels) drawFunnel(ctx, funnel);
}

function getInitials(name: string): string {
  const parts = name.replace(/^@/, "").split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, rotation: number,
  color: string,
  avatarImg: HTMLImageElement | null,
  displayName: string,
  isLeader: boolean,
) {
  const r = BALL_RADIUS;
  ctx.save();
  ctx.translate(x, y);

  // Leader glow
  if (isLeader) {
    const glow = ctx.createRadialGradient(0, 0, r, 0, 0, r * 2.5);
    glow.addColorStop(0, color + "60");
    glow.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  // Colored ring
  ctx.beginPath();
  ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Inner circle with clip
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();

  if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
    ctx.save();
    ctx.rotate(rotation * 0.08);
    ctx.drawImage(avatarImg, -r, -r, r * 2, r * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${r * 0.85}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(getInitials(displayName), 0, 1);
  }

  ctx.restore();

  // Name label
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const label = displayName.length > 12 ? displayName.slice(0, 11) + "…" : displayName;
  ctx.fillText(label, x, y + r + 4);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BallRaceScene({ result, slotsInfo, onComplete }: BallRaceSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const completedRef = useRef(false);
  const [phase, setPhase] = useState<"countdown" | "racing" | "finished">("countdown");
  const [countdown, setCountdown] = useState(3);
  const avatarImgsRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const cameraYRef = useRef(0);

  // Pre-load avatar images
  useEffect(() => {
    const map = new Map<number, HTMLImageElement>();
    for (const slot of slotsInfo) {
      if (slot.avatarUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = slot.avatarUrl;
        map.set(slot.slotId, img);
      }
    }
    avatarImgsRef.current = map;
  }, [slotsInfo]);

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

  // Generate course layout
  const courseRef = useRef<CourseLayout | null>(null);
  const slotIndexMap = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    if (!courseRef.current && result.obstaclesSeed) {
      courseRef.current = generateCourse(result.obstaclesSeed);
    }
    if (slotIndexMap.current.size === 0) {
      result.balls.forEach((ball, i) => {
        slotIndexMap.current.set(ball.slotId, i);
      });
    }
  }, [result]);

  // Animation loop
  useEffect(() => {
    if (phase !== "racing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const course = courseRef.current;
    if (!course) return;

    startTimeRef.current = performance.now();
    completedRef.current = false;
    cameraYRef.current = 0;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.scale(dpr, dpr);

    function render() {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;

      // Find the leading ball (lowest finishPosition = 1st place)
      let leaderY = 0;
      let leaderId = result.balls[0]?.slotId ?? 0;
      for (const ball of result.balls) {
        const pos = interpolate(ball.keyframes, elapsed);
        if (pos.y > leaderY) {
          leaderY = pos.y;
          leaderId = ball.slotId;
        }
      }

      // Camera follows the leader with smooth lerp
      const targetCameraY = leaderY - CANVAS_H * 0.35;
      const clampedTarget = Math.max(0, Math.min(targetCameraY, COURSE_HEIGHT - CANVAS_H));
      cameraYRef.current += (clampedTarget - cameraYRef.current) * 0.06;
      const cameraY = cameraYRef.current;

      ctx!.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background
      ctx!.fillStyle = "#0d1a0d";
      ctx!.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Translate for camera
      ctx!.save();
      ctx!.translate(0, -cameraY);

      // Side walls
      ctx!.fillStyle = "rgba(200, 168, 78, 0.12)";
      ctx!.fillRect(0, cameraY, 22, CANVAS_H);
      ctx!.fillRect(COURSE_WIDTH - 22, cameraY, 22, CANVAS_H);

      // Subtle grid lines for depth
      ctx!.strokeStyle = "rgba(200, 168, 78, 0.04)";
      ctx!.lineWidth = 1;
      const gridStart = Math.floor(cameraY / 100) * 100;
      for (let gy = gridStart; gy < cameraY + CANVAS_H + 100; gy += 100) {
        ctx!.beginPath();
        ctx!.moveTo(25, gy);
        ctx!.lineTo(COURSE_WIDTH - 25, gy);
        ctx!.stroke();
      }

      // Draw obstacles (only those in view)
      const viewTop = cameraY - 80;
      const viewBottom = cameraY + CANVAS_H + 80;

      // Filter visible obstacles for perf
      const visibleCourse: CourseLayout = {
        obstacles: [],
        pegs: course!.pegs.filter((o) => o.y > viewTop && o.y < viewBottom),
        spinners: course!.spinners.filter((o) => o.y > viewTop - o.radius && o.y < viewBottom + o.radius),
        rings: course!.rings.filter((o) => o.y > viewTop - o.outerRadius && o.y < viewBottom + o.outerRadius),
        bumpers: course!.bumpers.filter((o) => o.y > viewTop - o.radius && o.y < viewBottom + o.radius),
        ramps: course!.ramps.filter((o) => Math.min(o.y1, o.y2) < viewBottom && Math.max(o.y1, o.y2) > viewTop),
        bouncePads: course!.bouncePads.filter((o) => o.y > viewTop && o.y < viewBottom),
        buckets: course!.buckets.filter((o) => o.y > viewTop && o.y + o.height < viewBottom + 50),
        gaps: course!.gaps.filter((o) => o.y > viewTop && o.y < viewBottom),
        funnels: course!.funnels.filter((o) => o.y > viewTop - 20 && o.y < viewBottom),
      };

      drawObstacles(ctx!, visibleCourse, elapsed);

      // Finish line
      const finishY = COURSE_HEIGHT - 50;
      if (finishY > viewTop && finishY < viewBottom) {
        const checkerSize = 12;
        for (let col = 0; col < COURSE_WIDTH / checkerSize; col++) {
          ctx!.fillStyle = col % 2 === 0 ? "rgba(255,255,255,0.15)" : "rgba(200,168,78,0.25)";
          ctx!.fillRect(col * checkerSize, finishY - checkerSize / 2, checkerSize, checkerSize);
        }
      }

      // Draw balls (leader last so it's on top)
      const ballPositions: { slotId: number; x: number; y: number; rotation: number }[] = [];
      for (const ball of result.balls) {
        const pos = interpolate(ball.keyframes, elapsed);
        ballPositions.push({ slotId: ball.slotId, ...pos });
      }

      // Sort: leader drawn last (on top)
      ballPositions.sort((a, b) => {
        if (a.slotId === leaderId) return 1;
        if (b.slotId === leaderId) return -1;
        return 0;
      });

      for (const bp of ballPositions) {
        // Skip if not visible
        if (bp.y < viewTop - 20 || bp.y > viewBottom + 20) continue;
        const colorIdx = slotIndexMap.current.get(bp.slotId) ?? 0;
        const color = BALL_COLORS[colorIdx % BALL_COLORS.length];
        const slotInfo = slotsInfo.find((s) => s.slotId === bp.slotId);
        const avatarImg = avatarImgsRef.current.get(bp.slotId) ?? null;

        drawBall(
          ctx!, bp.x, bp.y, bp.rotation,
          color, avatarImg,
          slotInfo?.displayName ?? "?",
          bp.slotId === leaderId,
        );
      }

      ctx!.restore(); // undo camera translate

      // HUD — position indicator
      ctx!.fillStyle = "rgba(0,0,0,0.5)";
      ctx!.fillRect(CANVAS_W - 50, 10, 40, CANVAS_H - 20);
      ctx!.strokeStyle = "rgba(200,168,78,0.3)";
      ctx!.lineWidth = 1;
      ctx!.strokeRect(CANVAS_W - 50, 10, 40, CANVAS_H - 20);

      // Mini-map dots
      const mapH = CANVAS_H - 20;
      for (const bp of ballPositions) {
        const mapY = 10 + (bp.y / COURSE_HEIGHT) * mapH;
        const colorIdx = slotIndexMap.current.get(bp.slotId) ?? 0;
        ctx!.beginPath();
        ctx!.arc(CANVAS_W - 30, mapY, bp.slotId === leaderId ? 4 : 2.5, 0, Math.PI * 2);
        ctx!.fillStyle = BALL_COLORS[colorIdx % BALL_COLORS.length];
        ctx!.fill();
      }

      // Viewport indicator on minimap
      const vpTop = 10 + (cameraY / COURSE_HEIGHT) * mapH;
      const vpH = (CANVAS_H / COURSE_HEIGHT) * mapH;
      ctx!.strokeStyle = "rgba(200,168,78,0.5)";
      ctx!.lineWidth = 1;
      ctx!.strokeRect(CANVAS_W - 50, vpTop, 40, vpH);

      // Check if race is done
      if (elapsed >= result.durationSeconds + 1.5 && !completedRef.current) {
        completedRef.current = true;
        setPhase("finished");
        setTimeout(() => onComplete?.(), 2000);
        return;
      }

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, result, slotsInfo, onComplete]);

  const handleReplay = useCallback(() => {
    setPhase("countdown");
    setCountdown(3);
    completedRef.current = false;
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-lg"
      style={{
        width: "100%",
        maxWidth: "400px",
        aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      {phase === "countdown" && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(13,26,13,0.6)" }}
        >
          <span
            className="text-7xl font-bold"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-gold)" }}
          >
            {countdown > 0 ? countdown : "GO!"}
          </span>
        </div>
      )}

      {phase === "finished" && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(13,26,13,0.6)" }}
        >
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
