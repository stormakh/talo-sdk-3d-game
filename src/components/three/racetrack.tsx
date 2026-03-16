"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

const TRACK_LENGTH = 120;
const TRACK_WIDTH = 12;
const FENCE_HEIGHT = 1.2;

// Seeded random for deterministic crowd
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// --- Procedural texture generators ---

function createGrassTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Base green
  ctx.fillStyle = "#2a5a2a";
  ctx.fillRect(0, 0, size, size);

  // Scatter grass blades
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = Math.random();
    if (shade < 0.3) {
      ctx.fillStyle = "#1a4a1a";
    } else if (shade < 0.6) {
      ctx.fillStyle = "#3a6a2a";
    } else if (shade < 0.85) {
      ctx.fillStyle = "#2a5a20";
    } else {
      ctx.fillStyle = "#4a7a3a";
    }
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(40, 40);
  return tex;
}

function createDirtTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Base dirt brown
  ctx.fillStyle = "#5a4030";
  ctx.fillRect(0, 0, size, size);

  // Scatter soil grain
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = Math.random();
    if (shade < 0.25) {
      ctx.fillStyle = "#4a3020";
    } else if (shade < 0.5) {
      ctx.fillStyle = "#6a5040";
    } else if (shade < 0.75) {
      ctx.fillStyle = "#5a4535";
    } else {
      ctx.fillStyle = "#7a6050";
    }
    ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 48);
  return tex;
}

function createCheckerboardTexture(): THREE.CanvasTexture {
  const size = 64;
  const squares = 8;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const sq = size / squares;
  for (let row = 0; row < squares; row++) {
    for (let col = 0; col < squares; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? "#ffffff" : "#1a1a1a";
      ctx.fillRect(col * sq, row * sq, sq, sq);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 1);
  return tex;
}

function Fence({ side }: { side: "left" | "right" }) {
  const x = side === "left" ? -TRACK_WIDTH / 2 - 0.3 : TRACK_WIDTH / 2 + 0.3;
  const posts = useMemo(() => {
    const arr: number[] = [];
    for (let z = -2; z <= TRACK_LENGTH + 2; z += 3) {
      arr.push(z);
    }
    return arr;
  }, []);

  return (
    <group>
      {posts.map((z) => (
        <mesh key={z} position={[x, FENCE_HEIGHT / 2, z]}>
          <boxGeometry args={[0.1, FENCE_HEIGHT, 0.1]} />
          <meshStandardMaterial color="#5a4a2a" />
        </mesh>
      ))}
      {/* Top rail */}
      <mesh position={[x, FENCE_HEIGHT, TRACK_LENGTH / 2]}>
        <boxGeometry args={[0.08, 0.08, TRACK_LENGTH + 4]} />
        <meshStandardMaterial color="#5a4a2a" />
      </mesh>
      {/* Middle rail */}
      <mesh position={[x, FENCE_HEIGHT * 0.5, TRACK_LENGTH / 2]}>
        <boxGeometry args={[0.08, 0.08, TRACK_LENGTH + 4]} />
        <meshStandardMaterial color="#5a4a2a" />
      </mesh>
    </group>
  );
}

const CROWD_COLORS = [
  "#c83232", "#3256c8", "#32a832", "#c8c832", "#c87832",
  "#a832c8", "#32c8c8", "#c8326e", "#6e6e6e", "#e8e8e8",
];

function CrowdPerson({ position, seed }: { position: [number, number, number]; seed: number }) {
  const color = CROWD_COLORS[Math.floor(seededRandom(seed) * CROWD_COLORS.length)];
  const heightVar = 0.3 + seededRandom(seed + 1) * 0.15;
  const ref = useRef<THREE.Group>(null);

  // Subtle idle animation — bob up/down slowly
  useFrame(({ clock }) => {
    if (ref.current) {
      const phase = seededRandom(seed + 2) * Math.PI * 2;
      const speed = 1.5 + seededRandom(seed + 3) * 1.5;
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * speed + phase) * 0.03;
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Body */}
      <mesh position={[0, heightVar / 2, 0]}>
        <boxGeometry args={[0.25, heightVar, 0.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, heightVar + 0.12, 0]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial color="#d4a574" />
      </mesh>
    </group>
  );
}

function Crowd({ tierY, tierX, tierZ, count, seedBase, spreadZ = 7 }: {
  tierY: number; tierX: number; tierZ: number; count: number; seedBase: number; spreadZ?: number;
}) {
  const people = useMemo(() => {
    const arr: { pos: [number, number, number]; seed: number }[] = [];
    for (let i = 0; i < count; i++) {
      const z = tierZ + (seededRandom(seedBase + i) - 0.5) * spreadZ;
      const x = tierX + (seededRandom(seedBase + i + 100) - 0.5) * 1.5;
      arr.push({ pos: [x, tierY + 0.2, z], seed: seedBase + i });
    }
    return arr;
  }, [tierY, tierX, tierZ, count, seedBase, spreadZ]);

  return (
    <>
      {people.map((p, i) => (
        <CrowdPerson key={i} position={p.pos} seed={p.seed} />
      ))}
    </>
  );
}

function Grandstand({ side, zCenter, seedOffset, standLength }: {
  side: "left" | "right";
  zCenter: number;
  seedOffset: number;
  standLength: number;
}) {
  const xSign = side === "left" ? -1 : 1;
  const baseX = xSign * (TRACK_WIDTH / 2 + 5);

  return (
    <group position={[baseX, 0, zCenter]}>
      {/* Tiered seating */}
      {[0, 1, 2].map((tier) => (
        <mesh key={tier} position={[-xSign * tier * 1.5, tier * 1.2, 0]}>
          <boxGeometry args={[3, 0.4, standLength]} />
          <meshStandardMaterial color="#3a2a1a" />
        </mesh>
      ))}
      {/* Crowd on each tier */}
      {[0, 1, 2].map((tier) => (
        <Crowd
          key={tier}
          tierX={-xSign * tier * 1.5}
          tierY={tier * 1.2 + 0.2}
          tierZ={0}
          count={Math.floor((standLength / 8) * (8 + tier * 3))}
          seedBase={seedOffset + tier * 50}
          spreadZ={standLength * 0.9}
        />
      ))}
    </group>
  );
}

export function Racetrack() {
  const laneLinePositions = useMemo(() => {
    const lines: number[] = [];
    for (let i = 0; i <= 10; i++) {
      lines.push(-TRACK_WIDTH / 2 + (TRACK_WIDTH / 10) * i);
    }
    return lines;
  }, []);

  const grassTex = useMemo(() => createGrassTexture(), []);
  const dirtTex = useMemo(() => createDirtTexture(), []);
  const checkerTex = useMemo(() => createCheckerboardTexture(), []);

  return (
    <group>
      {/* Ground plane — grass with texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, TRACK_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[200, TRACK_LENGTH + 80]} />
        <meshStandardMaterial map={grassTex} />
      </mesh>

      {/* Track surface — dirt with texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, TRACK_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[TRACK_WIDTH, TRACK_LENGTH + 4]} />
        <meshStandardMaterial map={dirtTex} />
      </mesh>

      {/* Lane lines */}
      {laneLinePositions.map((x, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.005, TRACK_LENGTH / 2]}
        >
          <planeGeometry args={[0.04, TRACK_LENGTH + 4]} />
          <meshStandardMaterial color="#6a5a4a" transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Start line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <planeGeometry args={[TRACK_WIDTH, 0.3]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Finish line — checkerboard */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, TRACK_LENGTH]}>
        <planeGeometry args={[TRACK_WIDTH, 0.5]} />
        <meshStandardMaterial map={checkerTex} />
      </mesh>

      <Fence side="left" />
      <Fence side="right" />

      {/* Left side stands — spread along the track */}
      <Grandstand side="left" zCenter={20} seedOffset={0} standLength={20} />
      <Grandstand side="left" zCenter={55} seedOffset={400} standLength={25} />
      <Grandstand side="left" zCenter={95} seedOffset={800} standLength={20} />

      {/* Right side stands */}
      <Grandstand side="right" zCenter={35} seedOffset={200} standLength={22} />
      <Grandstand side="right" zCenter={75} seedOffset={600} standLength={28} />
      <Grandstand side="right" zCenter={TRACK_LENGTH - 5} seedOffset={1000} standLength={15} />
    </group>
  );
}

export { TRACK_LENGTH, TRACK_WIDTH };
