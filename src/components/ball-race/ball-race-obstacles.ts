import { createRngFromString } from "@/lib/seeded-random";

/**
 * Obstacle layout generation for Ball Race.
 * Shared between server (simulation) and client (rendering).
 * Must be deterministic given the same seed.
 */

export const COURSE_WIDTH = 400;
export const COURSE_HEIGHT = 5000;
export const BALL_RADIUS = 10;
export const PEG_RADIUS = 7;
export const VIEWPORT_HEIGHT = 500; // visible area height (camera window)

// ---------------------------------------------------------------------------
// Obstacle types
// ---------------------------------------------------------------------------

export type Peg = {
  type: "peg";
  x: number;
  y: number;
  radius: number;
  color?: string;
};

export type Spinner = {
  type: "spinner";
  x: number;
  y: number;
  radius: number;
  speed: number;
  direction: 1 | -1;
  arms: number; // 2, 3, or 4 arms
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

export type Ring = {
  type: "ring";
  x: number;
  y: number;
  outerRadius: number;
  innerRadius: number;
  color: string;
};

export type Bumper = {
  type: "bumper";
  x: number;
  y: number;
  radius: number;
  strength: number;
  color: string;
};

export type Ramp = {
  type: "ramp";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
};

export type Bucket = {
  type: "bucket";
  x: number;
  y: number;
  width: number;
  height: number;
  openTop: boolean;
};

export type BouncePad = {
  type: "bouncepad";
  x: number;
  y: number;
  width: number;
  strength: number;
  color: string;
};

export type Obstacle =
  | Peg
  | Spinner
  | Gap
  | Funnel
  | Ring
  | Bumper
  | Ramp
  | Bucket
  | BouncePad;

export type CourseLayout = {
  obstacles: Obstacle[];
  pegs: Peg[];
  spinners: Spinner[];
  gaps: Gap[];
  funnels: Funnel[];
  rings: Ring[];
  bumpers: Bumper[];
  ramps: Ramp[];
  buckets: Bucket[];
  bouncePads: BouncePad[];
};

const OBSTACLE_COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#e84393",
];

// ---------------------------------------------------------------------------
// Section generators — each creates a chunk of the course
// ---------------------------------------------------------------------------

type SectionGenerator = (
  rng: () => number,
  yStart: number,
  height: number,
  obstacles: Obstacle[],
) => void;

/** Classic Galton board peg rows */
function sectionPegField(
  rng: () => number,
  yStart: number,
  height: number,
  obstacles: Obstacle[],
) {
  const rows = Math.floor(height / 40);
  const marginX = 35;
  const usableWidth = COURSE_WIDTH - marginX * 2;

  for (let row = 0; row < rows; row++) {
    const y = yStart + 20 + row * (height / rows);
    const pegsInRow = row % 2 === 0 ? 7 : 6;
    const spacing = usableWidth / (pegsInRow + 1);
    const offset = row % 2 === 0 ? 0 : spacing / 2;

    for (let col = 0; col < pegsInRow; col++) {
      const baseX = marginX + spacing * (col + 1) + offset;
      obstacles.push({
        type: "peg",
        x: baseX + (rng() - 0.5) * spacing * 0.25,
        y: y + (rng() - 0.5) * 8,
        radius: PEG_RADIUS + (rng() - 0.5) * 2,
      });
    }
  }
}

/** Big rings that balls can go through or bounce off */
function sectionRings(
  rng: () => number,
  yStart: number,
  height: number,
  obstacles: Obstacle[],
) {
  const numRings = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < numRings; i++) {
    const color = OBSTACLE_COLORS[Math.floor(rng() * OBSTACLE_COLORS.length)];
    const outerR = 30 + rng() * 25;
    obstacles.push({
      type: "ring",
      x: 60 + rng() * (COURSE_WIDTH - 120),
      y: yStart + (height / (numRings + 1)) * (i + 1),
      outerRadius: outerR,
      innerRadius: outerR - 8 - rng() * 4,
      color,
    });
  }
  // Add some pegs around rings
  for (let i = 0; i < 8; i++) {
    obstacles.push({
      type: "peg",
      x: 40 + rng() * (COURSE_WIDTH - 80),
      y: yStart + rng() * height,
      radius: PEG_RADIUS,
    });
  }
}

/** Spinning obstacles */
function sectionSpinners(
  rng: () => number,
  yStart: number,
  height: number,
  obstacles: Obstacle[],
) {
  const count = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < count; i++) {
    obstacles.push({
      type: "spinner",
      x: 70 + rng() * (COURSE_WIDTH - 140),
      y: yStart + (height / (count + 1)) * (i + 1),
      radius: 35 + rng() * 20,
      speed: (1.5 + rng() * 2.5) * (rng() < 0.5 ? 1 : -1),
      direction: rng() < 0.5 ? 1 : -1,
      arms: rng() < 0.3 ? 2 : rng() < 0.6 ? 3 : 4,
    });
  }
  // Scatter pegs between spinners
  for (let i = 0; i < 6; i++) {
    obstacles.push({
      type: "peg",
      x: 35 + rng() * (COURSE_WIDTH - 70),
      y: yStart + rng() * height,
      radius: PEG_RADIUS + rng() * 3,
    });
  }
}

/** Horizontal walls with gaps */
function sectionGaps(
  rng: () => number,
  yStart: number,
  height: number,
  obstacles: Obstacle[],
) {
  const count = 3 + Math.floor(rng() * 2);
  for (let i = 0; i < count; i++) {
    const openingWidth = 40 + rng() * 45;
    obstacles.push({
      type: "gap",
      y: yStart + (height / (count + 1)) * (i + 1),
      openingX: 30 + rng() * (COURSE_WIDTH - 60 - openingWidth),
      openingWidth,
      wallHeight: 8,
    });
  }
}

/** Funnels that narrow the path */
function sectionFunnels(
  rng: () => number,
  yStart: number,
  height: number,
  obstacles: Obstacle[],
) {
  const count = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < count; i++) {
    const usableW = COURSE_WIDTH - 60;
    obstacles.push({
      type: "funnel",
      y: yStart + (height / (count + 1)) * (i + 1),
      topWidth: usableW * (0.6 + rng() * 0.3),
      bottomWidth: 40 + rng() * 40,
      height: 60 + rng() * 30,
      centerX: COURSE_WIDTH / 2 + (rng() - 0.5) * 60,
    });
  }
  // Add pegs below funnel
  for (let i = 0; i < 5; i++) {
    obstacles.push({
      type: "peg",
      x: 40 + rng() * (COURSE_WIDTH - 80),
      y: yStart + height * 0.7 + rng() * height * 0.25,
      radius: PEG_RADIUS,
    });
  }
}

/** Bouncy bumpers — balls bounce off hard */
function sectionBumpers(
  rng: () => number,
  yStart: number,
  height: number,
  obstacles: Obstacle[],
) {
  const count = 4 + Math.floor(rng() * 4);
  for (let i = 0; i < count; i++) {
    const color = OBSTACLE_COLORS[Math.floor(rng() * OBSTACLE_COLORS.length)];
    obstacles.push({
      type: "bumper",
      x: 50 + rng() * (COURSE_WIDTH - 100),
      y: yStart + (height / (count + 1)) * (i + 1) + (rng() - 0.5) * 20,
      radius: 15 + rng() * 12,
      strength: 1.5 + rng() * 1.5,
      color,
    });
  }
}

/** Diagonal ramps that redirect balls */
function sectionRamps(
  rng: () => number,
  yStart: number,
  height: number,
  obstacles: Obstacle[],
) {
  const count = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i++) {
    const goingRight = rng() < 0.5;
    const rampLen = 60 + rng() * 80;
    const cx = 60 + rng() * (COURSE_WIDTH - 120);
    const cy = yStart + (height / (count + 1)) * (i + 1);
    const angle = (goingRight ? 1 : -1) * (0.2 + rng() * 0.4);

    obstacles.push({
      type: "ramp",
      x1: cx - Math.cos(angle) * rampLen / 2,
      y1: cy - Math.sin(angle) * rampLen / 2,
      x2: cx + Math.cos(angle) * rampLen / 2,
      y2: cy + Math.sin(angle) * rampLen / 2,
      thickness: 5 + rng() * 3,
    });
  }
  // Pegs around ramps
  for (let i = 0; i < 4; i++) {
    obstacles.push({
      type: "peg",
      x: 35 + rng() * (COURSE_WIDTH - 70),
      y: yStart + rng() * height,
      radius: PEG_RADIUS,
    });
  }
}

/** Bounce pads — horizontal springboards */
function sectionBouncePads(
  rng: () => number,
  yStart: number,
  height: number,
  obstacles: Obstacle[],
) {
  const count = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < count; i++) {
    const color = OBSTACLE_COLORS[Math.floor(rng() * OBSTACLE_COLORS.length)];
    obstacles.push({
      type: "bouncepad",
      x: 40 + rng() * (COURSE_WIDTH - 120),
      y: yStart + (height / (count + 1)) * (i + 1),
      width: 40 + rng() * 50,
      strength: 2 + rng() * 3,
      color,
    });
  }
  // Scatter some pegs
  for (let i = 0; i < 6; i++) {
    obstacles.push({
      type: "peg",
      x: 35 + rng() * (COURSE_WIDTH - 70),
      y: yStart + rng() * height,
      radius: PEG_RADIUS + rng() * 2,
    });
  }
}

/** Bucket traps — open-top containers that can temporarily trap balls */
function sectionBuckets(
  rng: () => number,
  yStart: number,
  height: number,
  obstacles: Obstacle[],
) {
  const count = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < count; i++) {
    obstacles.push({
      type: "bucket",
      x: 50 + rng() * (COURSE_WIDTH - 140),
      y: yStart + (height / (count + 1)) * (i + 1),
      width: 50 + rng() * 40,
      height: 30 + rng() * 20,
      openTop: true,
    });
  }
  // Pegs above buckets to guide balls in
  for (let i = 0; i < 6; i++) {
    obstacles.push({
      type: "peg",
      x: 40 + rng() * (COURSE_WIDTH - 80),
      y: yStart + rng() * height * 0.5,
      radius: PEG_RADIUS,
    });
  }
}

/** Dense mixed zone with many small obstacles */
function sectionChaos(
  rng: () => number,
  yStart: number,
  height: number,
  obstacles: Obstacle[],
) {
  // Dense pegs
  for (let i = 0; i < 20; i++) {
    obstacles.push({
      type: "peg",
      x: 30 + rng() * (COURSE_WIDTH - 60),
      y: yStart + rng() * height,
      radius: PEG_RADIUS - 1 + rng() * 4,
      color: OBSTACLE_COLORS[Math.floor(rng() * OBSTACLE_COLORS.length)],
    });
  }
  // A couple bumpers
  for (let i = 0; i < 2; i++) {
    obstacles.push({
      type: "bumper",
      x: 60 + rng() * (COURSE_WIDTH - 120),
      y: yStart + height * 0.3 + rng() * height * 0.4,
      radius: 18 + rng() * 10,
      strength: 2 + rng(),
      color: OBSTACLE_COLORS[Math.floor(rng() * OBSTACLE_COLORS.length)],
    });
  }
  // A spinner
  obstacles.push({
    type: "spinner",
    x: COURSE_WIDTH / 2 + (rng() - 0.5) * 100,
    y: yStart + height * 0.5,
    radius: 25 + rng() * 15,
    speed: (2 + rng() * 2) * (rng() < 0.5 ? 1 : -1),
    direction: rng() < 0.5 ? 1 : -1,
    arms: 3,
  });
}

// ---------------------------------------------------------------------------
// Main course generator
// ---------------------------------------------------------------------------

const SECTION_TYPES: SectionGenerator[] = [
  sectionPegField,
  sectionRings,
  sectionSpinners,
  sectionGaps,
  sectionFunnels,
  sectionBumpers,
  sectionRamps,
  sectionBouncePads,
  sectionBuckets,
  sectionChaos,
];

export function generateCourse(seed: string): CourseLayout {
  const rng = createRngFromString(seed);
  const obstacles: Obstacle[] = [];

  const marginTop = 80;
  const marginBottom = 60;
  const usableHeight = COURSE_HEIGHT - marginTop - marginBottom;

  // Divide course into ~16 sections
  const numSections = 16;
  const sectionHeight = usableHeight / numSections;

  for (let i = 0; i < numSections; i++) {
    const yStart = marginTop + i * sectionHeight;
    // Pick a random section type, but ensure variety
    const typeIdx = Math.floor(rng() * SECTION_TYPES.length);
    SECTION_TYPES[typeIdx](rng, yStart, sectionHeight, obstacles);
  }

  // Categorize
  const pegs = obstacles.filter((o): o is Peg => o.type === "peg");
  const spinners = obstacles.filter((o): o is Spinner => o.type === "spinner");
  const gaps = obstacles.filter((o): o is Gap => o.type === "gap");
  const funnels = obstacles.filter((o): o is Funnel => o.type === "funnel");
  const rings = obstacles.filter((o): o is Ring => o.type === "ring");
  const bumpers = obstacles.filter((o): o is Bumper => o.type === "bumper");
  const ramps = obstacles.filter((o): o is Ramp => o.type === "ramp");
  const buckets = obstacles.filter((o): o is Bucket => o.type === "bucket");
  const bouncePads = obstacles.filter(
    (o): o is BouncePad => o.type === "bouncepad",
  );

  return {
    obstacles,
    pegs,
    spinners,
    gaps,
    funnels,
    rings,
    bumpers,
    ramps,
    buckets,
    bouncePads,
  };
}
