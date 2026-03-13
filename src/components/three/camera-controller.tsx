"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TRACK_LENGTH } from "./racetrack";

/**
 * 4-phase cinematic camera:
 * Phase 1 (0-2s): Wide establishing shot from side
 * Phase 2 (2-10s): Follow the pack from behind/above
 * Phase 3 (10-14s): Close tracking shot on leaders
 * Phase 4 (14s+): Finish line angle
 */

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

export function CameraController({
  raceTime,
  leadProgress,
}: {
  raceTime: number;
  leadProgress: number;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useFrame(() => {
    const packZ = leadProgress * TRACK_LENGTH;

    if (raceTime < 2) {
      // Phase 1: Wide establishing shot
      const t = raceTime / 2;
      targetPos.current.set(
        lerp(12, 8, t),
        lerp(8, 6, t),
        lerp(-5, 5, t)
      );
      targetLook.current.set(0, 0, Math.max(packZ, 2));
    } else if (raceTime < 10) {
      // Phase 2: Follow from behind/above
      targetPos.current.set(
        0,
        5,
        packZ - 8
      );
      targetLook.current.set(0, 1, packZ + 5);
    } else if (raceTime < 14) {
      // Phase 3: Close side tracking
      const t = (raceTime - 10) / 4;
      targetPos.current.set(
        lerp(6, 4, t),
        lerp(3, 2.5, t),
        packZ + lerp(-2, 0, t)
      );
      targetLook.current.set(0, 1, packZ + 3);
    } else {
      // Phase 4: Finish line angle
      targetPos.current.set(
        5,
        4,
        TRACK_LENGTH + 3
      );
      targetLook.current.set(0, 1, TRACK_LENGTH - 2);
    }

    // Smooth camera movement
    camera.position.lerp(targetPos.current, 0.03);

    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    currentLook.multiplyScalar(10).add(camera.position);
    currentLook.lerp(targetLook.current, 0.05);
    camera.lookAt(targetLook.current);
  });

  return null;
}
