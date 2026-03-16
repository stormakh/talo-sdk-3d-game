"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TRACK_LENGTH } from "./racetrack";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

const START_POS = new THREE.Vector3(18, 12, -10);
const START_LOOK = new THREE.Vector3(0, 0, 8);

/**
 * 4-phase cinematic camera:
 * Phase 1 (0-3s):  Wide establishing → transition to chase
 * Phase 2 (3-11s): Follow pack from behind
 * Phase 3 (11-13s): Transition to side finish-line view
 * Phase 4 (13s+):  Locked side view at finish line
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
        // Phase 1: Wide establishing shot
        const t = raceTime / 3;
        targetPos.current.set(
          lerp(18, 4, t),
          lerp(12, 8, t),
          lerp(-10, packZ - 20, t),
        );
        targetLook.current.set(0, 0, Math.max(packZ, 5));
      } else if (raceTime < 11) {
        // Phase 2: Chase from behind — pulled back
        targetPos.current.set(0, 8, packZ - 20);
        targetLook.current.set(0, 1, packZ + 12);
      } else if (raceTime < 13) {
        // Phase 3: Transition to side finish-line view
        const t = (raceTime - 11) / 2;
        targetPos.current.set(
          lerp(0, 16, t),
          lerp(8, 4, t),
          lerp(packZ - 20, TRACK_LENGTH + 2, t),
        );
        targetLook.current.set(
          0,
          1,
          lerp(packZ + 12, TRACK_LENGTH, t),
        );
      } else {
        // Phase 4: Locked side view — classic photo finish
        targetPos.current.set(16, 4, TRACK_LENGTH + 2);
        targetLook.current.set(0, 1, TRACK_LENGTH);
      }
    }

    camera.position.lerp(targetPos.current, 0.06);
    smoothLook.current.lerp(targetLook.current, 0.07);
    camera.lookAt(smoothLook.current);
  });

  return null;
}
