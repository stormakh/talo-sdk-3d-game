"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";

const HORSE_COLORS = [
  "#8B4513", "#2F1A0A", "#D2691E", "#A0522D",
  "#6B3A2E", "#3B2012", "#C4A35A", "#1A1A1A",
  "#704214", "#5C4033",
];

type HorseProps = {
  lane: number;
  displayName: string;
  color?: string;
  progress: number;
  lateralOffset: number;
  stumbling: boolean;
};

export function Horse({
  lane,
  displayName,
  color,
  progress,
  lateralOffset,
  stumbling,
}: HorseProps) {
  const groupRef = useRef<THREE.Group>(null);
  const legRefs = useRef<THREE.Mesh[]>([]);

  const horseColor = useMemo(
    () => color || HORSE_COLORS[lane % HORSE_COLORS.length],
    [color, lane]
  );

  // Animate legs
  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    const speed = progress > 0 ? 8 : 0;

    legRefs.current.forEach((leg, i) => {
      if (leg) {
        const offset = (i % 2 === 0 ? 0 : Math.PI) + (i < 2 ? 0 : Math.PI / 2);
        leg.rotation.x = Math.sin(time * speed + offset) * (stumbling ? 0.15 : 0.4);
      }
    });
  });

  const setLegRef = (index: number) => (el: THREE.Mesh | null) => {
    if (el) legRefs.current[index] = el;
  };

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.5, 0.5, 1.2]} />
        <meshStandardMaterial color={horseColor} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.2, 0.5]} rotation={[0.4, 0, 0]} castShadow>
        <boxGeometry args={[0.3, 0.6, 0.3]} />
        <meshStandardMaterial color={horseColor} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.5, 0.7]} castShadow>
        <boxGeometry args={[0.25, 0.3, 0.4]} />
        <meshStandardMaterial color={horseColor} />
      </mesh>

      {/* Legs — front left, front right, back left, back right */}
      {[
        [-0.15, 0.3, 0.35],
        [0.15, 0.3, 0.35],
        [-0.15, 0.3, -0.35],
        [0.15, 0.3, -0.35],
      ].map((pos, i) => (
        <mesh
          key={i}
          ref={setLegRef(i)}
          position={pos as [number, number, number]}
          castShadow
        >
          <boxGeometry args={[0.12, 0.6, 0.12]} />
          <meshStandardMaterial color={horseColor} />
        </mesh>
      ))}

      {/* Tail */}
      <mesh position={[0, 1.0, -0.7]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.06, 0.4, 0.06]} />
        <meshStandardMaterial color={horseColor} />
      </mesh>

      {/* Nameplate */}
      <Html position={[0, 2.0, 0]} center distanceFactor={15}>
        <div
          style={{
            background: "rgba(13,26,13,0.85)",
            border: "1px solid #c8a84e",
            borderRadius: "4px",
            padding: "2px 8px",
            whiteSpace: "nowrap",
            fontSize: "11px",
            color: "#f0ead6",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {displayName}
        </div>
      </Html>
    </group>
  );
}
