"use client";

import * as THREE from "three";
import { useMemo } from "react";

const TRACK_LENGTH = 50;
const TRACK_WIDTH = 12;
const FENCE_HEIGHT = 1.2;

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

function Grandstand() {
  return (
    <group position={[-TRACK_WIDTH / 2 - 5, 0, TRACK_LENGTH * 0.7]}>
      {/* Tiered seating */}
      {[0, 1, 2].map((tier) => (
        <mesh key={tier} position={[-tier * 1.5, tier * 1.2, 0]}>
          <boxGeometry args={[3, 0.4, 8]} />
          <meshStandardMaterial color="#3a2a1a" />
        </mesh>
      ))}
      {/* Roof */}
      <mesh position={[-2, 4, 0]}>
        <boxGeometry args={[6, 0.2, 10]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>
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

  return (
    <group>
      {/* Ground plane — grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, TRACK_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a3a1a" />
      </mesh>

      {/* Track surface — dirt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, TRACK_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[TRACK_WIDTH, TRACK_LENGTH + 4]} />
        <meshStandardMaterial color="#4a3a2a" />
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
        <planeGeometry args={[TRACK_WIDTH, 0.15]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Finish line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, TRACK_LENGTH]}>
        <planeGeometry args={[TRACK_WIDTH, 0.15]} />
        <meshStandardMaterial color="#c8a84e" />
      </mesh>

      <Fence side="left" />
      <Fence side="right" />
      <Grandstand />
    </group>
  );
}

export { TRACK_LENGTH, TRACK_WIDTH };
