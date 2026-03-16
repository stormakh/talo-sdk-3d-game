"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";

const HORSE_COLORS = [
  "#8B4513", "#2F1A0A", "#D2691E", "#A0522D",
  "#6B3A2E", "#3B2012", "#C4A35A", "#1A1A1A",
  "#704214", "#5C4033",
];

const MODEL_PATH = "/models/Horse.glb";

// Preload the model
useGLTF.preload(MODEL_PATH);

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
  stumbling,
}: HorseProps) {
  const { scene, animations } = useGLTF(MODEL_PATH);
  const meshRef = useRef<THREE.Mesh>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);

  const horseColor = useMemo(
    () => color || HORSE_COLORS[lane % HORSE_COLORS.length],
    [color, lane],
  );

  // Clone the scene so each horse is independent
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Apply unique color to this horse
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = false;

        // Clone material so each horse gets its own color
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          mat.color = new THREE.Color(horseColor);
          mesh.material = mat;
        }
      }
    });

    return clone;
  }, [scene, horseColor]);

  // Set up animation mixer
  useEffect(() => {
    if (animations.length === 0) return;

    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    const clip = animations[0];
    const action = mixer.clipAction(clip);
    action.play();
    actionRef.current = action;

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(clonedScene);
    };
  }, [animations, clonedScene]);

  // Animate morph targets based on progress
  useFrame((_, delta) => {
    if (!mixerRef.current) return;

    // Adjust animation speed based on movement
    const speed = progress > 0 ? (stumbling ? 1.5 : 3.0) : 0;
    if (actionRef.current) {
      actionRef.current.timeScale = speed;
    }

    mixerRef.current.update(delta);
  });

  return (
    <group>
      {/* Horse model — scaled to ~1.5 units tall, oriented to run along +Z */}
      <primitive
        object={clonedScene}
        ref={meshRef}
        scale={0.008}
        rotation={[0, 0, 0]}
        position={[0, 0, 0]}
      />

      {/* Nameplate */}
      <Html position={[0, 1.8, 0]} center distanceFactor={15}>
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
