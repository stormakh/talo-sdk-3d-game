"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Sky } from "@react-three/drei";
import { TRACK_LENGTH } from "./racetrack";

export function Environment() {
  const directionalRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      {/* Physically-based sky */}
      <Sky
        sunPosition={[100, 20, 100]}
        turbidity={8}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* Fog — lighter to match sky */}
      <fog attach="fog" args={["#87CEEB", 60, 200]} />

      {/* Ambient light — warm to match afternoon sun */}
      <ambientLight intensity={0.5} color="#ffe8c0" />

      {/* Main sunlight */}
      <directionalLight
        ref={directionalRef}
        position={[20, 30, 10]}
        intensity={1.4}
        color="#ffe8b0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      {/* Fill light from the other side */}
      <directionalLight
        position={[-15, 10, -10]}
        intensity={0.3}
        color="#88aaff"
      />

      {/* Hemisphere light for natural sky/ground bounce */}
      <hemisphereLight args={["#87CEEB", "#2a5a2a", 0.4]} />

      {/* Golden glow at the finish line */}
      <pointLight
        position={[0, 3, TRACK_LENGTH]}
        intensity={15}
        color="#c8a84e"
        distance={12}
        decay={2}
      />
    </>
  );
}
