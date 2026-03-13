"use client";

import { useRef } from "react";
import * as THREE from "three";

export function Environment() {
  const directionalRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      {/* Sky color */}
      <color attach="background" args={["#1a3a1a"]} />
      <fog attach="fog" args={["#1a3a1a", 30, 80]} />

      {/* Ambient light */}
      <ambientLight intensity={0.4} color="#c8d8b8" />

      {/* Main sunlight */}
      <directionalLight
        ref={directionalRef}
        position={[20, 30, 10]}
        intensity={1.2}
        color="#ffe8b0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
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
      <hemisphereLight args={["#4488aa", "#2a3f2a", 0.4]} />
    </>
  );
}
