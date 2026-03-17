import { createRngFromString } from "@/lib/seeded-random";

/**
 * Obstacle layout generation for Ball Race.
 * Shared between server (simulation) and client (rendering).
 * Must be deterministic given the same seed.
 */

export const COURSE_WIDTH = 400;
export const COURSE_HEIGHT = 800;
export const BALL_RADIUS = 12;
export const PEG_RADIUS = 8;

export type ObstacleType = "peg" | "spinner" | "gap" | "funnel";

export type Peg = {
  type: "peg";
  x: number;
  y: number;
  radius: number;
};

export type Spinner = {
  type: "spinner";
  x: number;
  y: number;
  radius: number;
  speed: number; // radians per second
  direction: 1 | -1;
};

export type Gap = {
  type: "gap";
  y: number;
  openingX: number;
  openingWidth: number;
  wallHeight: number;
};

export type Funnel = {
  type: "funnel";
  y: number;
  topWidth: number;
  bottomWidth: number;
  height: number;
  centerX: number;
};

export type Obstacle = Peg | Spinner | Gap | Funnel;

export type CourseLayout = {
  obstacles: Obstacle[];
  pegs: Peg[];
  spinners: Spinner[];
  gaps: Gap[];
  funnels: Funnel[];
};

export function generateCourse(seed: string): CourseLayout {
  const rng = createRngFromString(seed);
  const obstacles: Obstacle[] = [];

  const marginX = 40;
  const marginTop = 60;
  const marginBottom = 40;
  const usableWidth = COURSE_WIDTH - marginX * 2;
  const usableHeight = COURSE_HEIGHT - marginTop - marginBottom;

  // --- Peg rows ---
  const pegRows = 12;
  const rowSpacing = usableHeight / (pegRows + 3); // leave room for special obstacles

  for (let row = 0; row < pegRows; row++) {
    const y = marginTop + rowSpacing * (row + 1);
    const pegsInRow = row % 2 === 0 ? 6 : 5;
    const spacing = usableWidth / (pegsInRow + 1);
    const offset = row % 2 === 0 ? 0 : spacing / 2;

    for (let col = 0; col < pegsInRow; col++) {
      const baseX = marginX + spacing * (col + 1) + offset;
      // Add slight random jitter
      const jitterX = (rng() - 0.5) * spacing * 0.3;
      const jitterY = (rng() - 0.5) * rowSpacing * 0.15;

      obstacles.push({
        type: "peg",
        x: baseX + jitterX,
        y: y + jitterY,
        radius: PEG_RADIUS + (rng() - 0.5) * 3,
      });
    }
  }

  // --- Spinners (1-2) ---
  const numSpinners = rng() < 0.5 ? 1 : 2;
  const spinnerZones = [0.3, 0.6]; // relative Y positions
  for (let i = 0; i < numSpinners; i++) {
    const y = marginTop + usableHeight * spinnerZones[i];
    obstacles.push({
      type: "spinner",
      x: marginX + usableWidth * (0.3 + rng() * 0.4),
      y,
      radius: 30 + rng() * 15,
      speed: (1.5 + rng() * 2) * (rng() < 0.5 ? 1 : -1),
      direction: rng() < 0.5 ? 1 : -1,
    });
  }

  // --- Gaps (1-2 horizontal barriers with openings) ---
  const numGaps = rng() < 0.6 ? 1 : 2;
  const gapZones = [0.45, 0.75];
  for (let i = 0; i < numGaps; i++) {
    const y = marginTop + usableHeight * gapZones[i];
    const openingWidth = 50 + rng() * 40;
    obstacles.push({
      type: "gap",
      y,
      openingX: marginX + rng() * (usableWidth - openingWidth),
      openingWidth,
      wallHeight: 6,
    });
  }

  // --- Funnel (1, near bottom) ---
  const funnelY = marginTop + usableHeight * 0.85;
  obstacles.push({
    type: "funnel",
    y: funnelY,
    topWidth: usableWidth * 0.7,
    bottomWidth: 60 + rng() * 30,
    height: 50,
    centerX: COURSE_WIDTH / 2 + (rng() - 0.5) * 40,
  });

  // Categorize for convenience
  const pegs = obstacles.filter((o): o is Peg => o.type === "peg");
  const spinners = obstacles.filter((o): o is Spinner => o.type === "spinner");
  const gaps = obstacles.filter((o): o is Gap => o.type === "gap");
  const funnels = obstacles.filter((o): o is Funnel => o.type === "funnel");

  return { obstacles, pegs, spinners, gaps, funnels };
}
