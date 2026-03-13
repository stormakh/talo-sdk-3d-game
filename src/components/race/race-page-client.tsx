"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { RaceWithSlots } from "@/types";
import { RiderLineup } from "./rider-lineup";
import { PaymentInfo } from "./payment-modal";
import { RaceResults } from "./race-results";
import { useRaceStream } from "@/lib/use-race-stream";

const RaceScene = dynamic(
  () => import("@/components/three/race-scene").then((m) => m.RaceScene),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[400px] w-full items-center justify-center rounded-lg"
        style={{ background: "var(--bg-card)" }}
      >
        <p style={{ color: "var(--text-secondary)" }}>Loading 3D scene...</p>
      </div>
    ),
  }
);

export function RacePageClient({
  initialRace,
}: {
  initialRace: RaceWithSlots;
}) {
  const [race, setRace] = useState(initialRace);
  const [showScene, setShowScene] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const isWaiting = race.status === "waiting";
  const isFinished = race.status === "finished";
  const confirmedCount = race.slots.filter(
    (s) => s.paymentStatus === "confirmed"
  ).length;

  // SSE for real-time updates while waiting
  useRaceStream(race.id, isWaiting, {
    onPlayerJoined: (slot) => {
      setRace((prev) => ({
        ...prev,
        slots: prev.slots.some((s) => s.id === slot.id)
          ? prev.slots
          : [...prev.slots, slot],
      }));
    },
    onRaceFinished: (finishedRace) => {
      setRace(finishedRace);
    },
  });

  // When race transitions to finished, show the 3D scene
  useEffect(() => {
    if (isFinished && race.result && !showScene && !showResults) {
      setShowScene(true);
    }
  }, [isFinished, race.result, showScene, showResults]);

  const handleRaceAnimationComplete = useCallback(() => {
    setShowResults(true);
  }, []);

  const handleWatchAgain = useCallback(() => {
    setShowResults(false);
    setShowScene(true);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <a
          href="/"
          className="text-sm transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          &larr; Volver al Lobby
        </a>
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="cursor-pointer rounded border px-3 py-1.5 text-xs tracking-wider uppercase transition-colors"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          Compartir
        </button>
      </div>

      {/* Title */}
      <div className="px-6 pb-4 text-center">
        <p className="label mb-1">Carrera #{race.id}</p>
        <h1
          className="text-4xl md:text-5xl"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--text-primary)",
          }}
        >
          Derby de {race.size} Caballos
        </h1>
      </div>

      {/* Waiting state */}
      {isWaiting && (
        <div className="flex flex-col gap-6">
          <RiderLineup slots={race.slots} totalSize={race.size} />

          {/* Payment info — alias & CVU */}
          <PaymentInfo alias={race.paymentAlias} cvu={race.paymentCvu} />

          <p
            className="py-2 text-center text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            {confirmedCount} de {race.size} caballos confirmados. Esperando...
          </p>
        </div>
      )}

      {/* Finished state — 3D scene */}
      {isFinished && showScene && race.result && !showResults && (
        <div className="px-4 py-6">
          <RaceScene race={race} onComplete={handleRaceAnimationComplete} />
        </div>
      )}

      {/* Finished state — Results */}
      {isFinished && showResults && (
        <RaceResults race={race} onWatchAgain={handleWatchAgain} />
      )}
    </div>
  );
}
