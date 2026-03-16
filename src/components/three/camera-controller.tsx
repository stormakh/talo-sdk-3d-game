"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TRACK_LENGTH } from "./racetrack";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

// Starting camera — wide establishing shot
const START_POS = new THREE.Vector3(15, 10, -8);
const START_LOOK = new THREE.Vector3(0, 0, 5);

/**
 * 4-phase cinematic camera:
 * Phase 1 (0-3s):  Wide establishing → transition to chase
 * Phase 2 (3-11s): Follow pack from behind, pulled back further
 * Phase 3 (11-13s): Transition to side finish-line view
 * Phase 4 (13s+):  Locked side view at finish line (classic photo finish)
 */

export function CameraController({
  raceTime,
  leadProgress,
  racing,
}: {
  raceTime: number;
  leadProgress: number;
  racing: boolean;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3().copy(START_POS));
  const targetLook = useRef(new THREE.Vector3().copy(START_LOOK));
  const smoothLook = useRef(new THREE.Vector3().copy(START_LOOK));
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      camera.position.copy(START_POS);
      camera.lookAt(START_LOOK);
      smoothLook.current.copy(START_LOOK);
      initialized.current = true;
    }
  }, [camera]);

  useFrame(() => {
    if (!racing) {
      targetPos.current.copy(START_POS);
      targetLook.current.copy(START_LOOK);
    } else {
      const packZ = leadProgress * TRACK_LENGTH;

      if (raceTime < 3) {
        // Phase 1: Wide establishing shot, slowly pulling in
        const t = raceTime / 3;
        targetPos.current.set(
          lerp(15, 3, t),
          lerp(10, 7, t),
          lerp(-8, packZ - 14, t),
        );
        targetLook.current.set(0, 0, Math.max(packZ, 3));
      } else if (raceTime < 11) {
        // Phase 2: Chase from behind — further back, higher up
        targetPos.current.set(0, 7, packZ - 14);
        targetLook.current.set(0, 1, packZ + 8);
      } else if (raceTime < 13) {
        // Phase 3: Transition to side finish-line view
        const t = (raceTime - 11) / 2;
        targetPos.current.set(
          lerp(0, 14, t),
          lerp(7, 3, t),
          lerp(packZ - 14, TRACK_LENGTH, t),
        );
        targetLook.current.set(
          lerp(0, 0, t),
          lerp(1, 1, t),
          lerp(packZ + 8, TRACK_LENGTH, t),
        );
      } else {
        // Phase 4: Locked side view — classic finish line camera
        targetPos.current.set(14, 3, TRACK_LENGTH);
        targetLook.current.set(0, 1, TRACK_LENGTH);
      }
    }

    // Smooth position & lookAt
    camera.position.lerp(targetPos.current, 0.06);
    smoothLook.current.lerp(targetLook.current, 0.07);
    camera.lookAt(smoothLook.current);
  });

  return null;
}
