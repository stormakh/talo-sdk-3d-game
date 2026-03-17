"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { BallRaceResult } from "@/types";
import {
  generateCourse,
  COURSE_WIDTH,
  COURSE_HEIGHT,
  BALL_RADIUS,
  type CourseLayout,
} from "./ball-race-obstacles";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BALL_COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#e84393",
  "#00cec9",
  "#fd79a8",
  "#6c5ce7",
  "#00b894",
  "#fdcb6e",
  "#d63031",
  "#0984e3",
  "#636e72",
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

  // Binary search
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

function drawObstacles(
  ctx: CanvasRenderingContext2D,
  course: CourseLayout,
  time: number,
) {
  // Pegs
  ctx.fillStyle = "#c8a84e";
  for (const peg of course.pegs) {
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Spinners
  ctx.strokeStyle = "#c8a84e";
  ctx.lineWidth = 3;
  for (const spinner of course.spinners) {
    ctx.save();
    ctx.translate(spinner.x, spinner.y);
    ctx.rotate(time * spinner.speed);

    // Draw spinner arms
    ctx.beginPath();
    ctx.moveTo(-spinner.radius, 0);
    ctx.lineTo(spinner.radius, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -spinner.radius);
    ctx.lineTo(0, spinner.radius);
    ctx.stroke();

    // Center circle
    ctx.fillStyle = "#c8a84e";
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Gaps (horizontal walls with opening)
  ctx.fillStyle = "rgba(200, 168, 78, 0.6)";
  for (const gap of course.gaps) {
    // Left wall
    ctx.fillRect(20, gap.y - gap.wallHeight / 2, gap.openingX - 20, gap.wallHeight);
    // Right wall
    const rightStart = gap.openingX + gap.openingWidth;
    ctx.fillRect(
      rightStart,
      gap.y - gap.wallHeight / 2,
      COURSE_WIDTH - 20 - rightStart,
      gap.wallHeight,
    );
  }

  // Funnels
  ctx.strokeStyle = "rgba(200, 168, 78, 0.5)";
  ctx.lineWidth = 2;
  for (const funnel of course.funnels) {
    const topLeft = funnel.centerX - funnel.topWidth / 2;
    const topRight = funnel.centerX + funnel.topWidth / 2;
    const bottomLeft = funnel.centerX - funnel.bottomWidth / 2;
    const bottomRight = funnel.centerX + funnel.bottomWidth / 2;

    // Left wall
    ctx.beginPath();
    ctx.moveTo(topLeft, funnel.y);
    ctx.lineTo(bottomLeft, funnel.y + funnel.height);
    ctx.stroke();

    // Right wall
    ctx.beginPath();
    ctx.moveTo(topRight, funnel.y);
    ctx.lineTo(bottomRight, funnel.y + funnel.height);
    ctx.stroke();
  }

  // Finish line
  const finishY = COURSE_HEIGHT - 30;
  const checkerSize = 10;
  for (let col = 0; col < COURSE_WIDTH / checkerSize; col++) {
    const isBlack = col % 2 === 0;
    ctx.fillStyle = isBlack ? "rgba(255,255,255,0.15)" : "rgba(200,168,78,0.2)";
    ctx.fillRect(col * checkerSize, finishY - checkerSize / 2, checkerSize, checkerSize);
  }
}

function getInitials(name: string): string {
  const parts = name.replace(/^@/, "").split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  color: string,
  avatarImg: HTMLImageElement | null,
  displayName: string,
) {
  ctx.save();
  ctx.translate(x, y);

  // Colored ring
  ctx.beginPath();
  ctx.arc(0, 0, BALL_RADIUS + 2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Inner circle
  ctx.beginPath();
  ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
  ctx.clip();

  if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
    ctx.save();
    ctx.rotate(rotation * 0.1); // subtle rotation
    ctx.drawImage(
      avatarImg,
      -BALL_RADIUS,
      -BALL_RADIUS,
      BALL_RADIUS * 2,
      BALL_RADIUS * 2,
    );
    ctx.restore();
  } else {
    // Initials fallback
    ctx.fillStyle = color;
    ctx.fillRect(-BALL_RADIUS, -BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2);
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${BALL_RADIUS * 0.9}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(getInitials(displayName), 0, 0);
  }

  ctx.restore();

  // Name label below ball
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const label =
    displayName.length > 10
      ? displayName.slice(0, 9) + "…"
      : displayName;
  ctx.fillText(label, x, y + BALL_RADIUS + 4);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BallRaceScene({
  result,
  slotsInfo,
  onComplete,
}: BallRaceSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const completedRef = useRef(false);
  const [phase, setPhase] = useState<"countdown" | "racing" | "finished">(
    "countdown",
  );
  const [countdown, setCountdown] = useState(3);
  const avatarImgsRef = useRef<Map<number, HTMLImageElement>>(new Map());

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

  // Generate course layout (memoized)
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

    const dpr = window.devicePixelRatio || 1;
    canvas.width = COURSE_WIDTH * dpr;
    canvas.height = COURSE_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    function render() {
      const elapsed =
        (performance.now() - startTimeRef.current) / 1000;

      // Clear
      ctx!.clearRect(0, 0, COURSE_WIDTH, COURSE_HEIGHT);

      // Background
      ctx!.fillStyle = "#0d1a0d";
      ctx!.fillRect(0, 0, COURSE_WIDTH, COURSE_HEIGHT);

      // Side walls
      ctx!.fillStyle = "rgba(200, 168, 78, 0.15)";
      ctx!.fillRect(0, 0, 20, COURSE_HEIGHT);
      ctx!.fillRect(COURSE_WIDTH - 20, 0, 20, COURSE_HEIGHT);

      // Obstacles
      drawObstacles(ctx!, course!, elapsed);

      // Balls
      for (const ball of result.balls) {
        const pos = interpolate(ball.keyframes, elapsed);
        const colorIdx = slotIndexMap.current.get(ball.slotId) ?? 0;
        const color = BALL_COLORS[colorIdx % BALL_COLORS.length];
        const slotInfo = slotsInfo.find((s) => s.slotId === ball.slotId);
        const avatarImg =
          avatarImgsRef.current.get(ball.slotId) ?? null;

        drawBall(
          ctx!,
          pos.x,
          pos.y,
          pos.rotation,
          color,
          avatarImg,
          slotInfo?.displayName ?? "?",
        );
      }

      // Check if race is done
      if (
        elapsed >= result.durationSeconds + 1 &&
        !completedRef.current
      ) {
        completedRef.current = true;
        setPhase("finished");
        setTimeout(() => onComplete?.(), 2000);
        return;
      }

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
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
        aspectRatio: `${COURSE_WIDTH} / ${COURSE_HEIGHT}`,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />

      {/* Countdown overlay */}
      {phase === "countdown" && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(13,26,13,0.6)" }}
        >
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
