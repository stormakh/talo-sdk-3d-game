"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TRACK_LENGTH } from "./racetrack";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

// Starting camera position — matches Canvas initial camera prop
const START_POS = new THREE.Vector3(12, 8, -5);
const START_LOOK = new THREE.Vector3(0, 0, 2);

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

  // Snap camera to start position on first mount (no lerp wiggle)
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
      // During countdown: hold steady at start position
      targetPos.current.copy(START_POS);
      targetLook.current.copy(START_LOOK);
    } else {
      const packZ = leadProgress * TRACK_LENGTH;

      if (raceTime < 2) {
        const t = raceTime / 2;
        targetPos.current.set(lerp(12, 8, t), lerp(8, 6, t), lerp(-5, 5, t));
        targetLook.current.set(0, 0, Math.max(packZ, 2));
      } else if (raceTime < 10) {
        targetPos.current.set(0, 5, packZ - 8);
        targetLook.current.set(0, 1, packZ + 5);
      } else if (raceTime < 14) {
        const t = (raceTime - 10) / 4;
        targetPos.current.set(lerp(6, 4, t), lerp(3, 2.5, t), packZ + lerp(-2, 0, t));
        targetLook.current.set(0, 1, packZ + 3);
      } else {
        targetPos.current.set(5, 4, TRACK_LENGTH + 3);
        targetLook.current.set(0, 1, TRACK_LENGTH - 2);
      }
    }

    // Smooth position
    camera.position.lerp(targetPos.current, 0.05);

    // Smooth lookAt (lerp the look target, not snap)
    smoothLook.current.lerp(targetLook.current, 0.06);
    camera.lookAt(smoothLook.current);
  });

  return null;
}
