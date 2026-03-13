"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { RaceWithSlots } from "@/types";
import { RiderLineup } from "./rider-lineup";
import { RaceResults } from "./race-results";
import { useRaceStream } from "@/lib/use-race-stream";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const RaceScene = dynamic(
  () => import("@/components/three/race-scene").then((m) => m.RaceScene),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[400px] w-full items-center justify-center rounded-lg"
        style={{ background: "var(--bg-card)" }}
      >
        <p style={{ color: "var(--text-secondary)" }}>Cargando escena 3D...</p>
      </div>
    ),
  }
);

function ShareButtons({
  alias,
  raceUrl,
  raceSize,
}: {
  alias: string;
  raceUrl: string;
  raceSize: number;
}) {
  const [copied, setCopied] = useState(false);

  const shareText = `Corré en mi derby de ${raceSize} caballos! Transferi a este alias para unirte:\n\n${alias}\n\n${raceUrl}`;

  function copyAlias() {
    navigator.clipboard.writeText(alias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
  }

  function shareX() {
    const tweetText = `Corré en mi derby de ${raceSize} caballos! Transferi al alias ${alias} para unirte 🏇\n\n${raceUrl}`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      "_blank"
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <ShimmerButton
          onClick={shareWhatsApp}
          shimmerColor="#25D366"
          shimmerSize="0.06em"
          shimmerDuration="3s"
          background="rgba(37, 211, 102, 1)"
          borderRadius="8px"
          className="flex-1 gap-2 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp
        </ShimmerButton>

        <ShimmerButton
          onClick={shareX}
          shimmerColor="#ffffff"
          shimmerSize="0.06em"
          shimmerDuration="3s"
          background="rgba(0, 0, 0, 1)"
          borderRadius="8px"
          className="flex-1 gap-2 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Publicar en X
        </ShimmerButton>
      </div>

      <button
        onClick={copyAlias}
        className="cursor-pointer rounded-lg border px-4 py-2 text-sm transition-colors"
        style={{
          borderColor: "var(--border-subtle)",
          color: copied ? "var(--success)" : "var(--text-secondary)",
          background: "var(--bg-surface)",
        }}
      >
        {copied ? "Alias copiado!" : "Copiar alias"}
      </button>
    </div>
  );
}

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

  const raceUrl = typeof window !== "undefined" ? window.location.href : "";

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
      </div>

      {/* Title */}
      <div className="px-6 pb-2 text-center">
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
        <div className="flex flex-col items-center gap-8 px-6 py-6">
          {/* Alias hero card */}
          {race.paymentAlias && (
            <div
              className="relative w-full max-w-md overflow-hidden rounded-xl border p-6 text-center"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-gold)",
              }}
            >
              <BorderBeam
                size={120}
                duration={5}
                colorFrom="#c8a84e"
                colorTo="#8B6914"
                borderWidth={1.5}
              />

              <p className="label mb-2">Transferi a este alias para correr</p>
              <p
                className="mb-1 font-mono text-2xl font-bold tracking-wide md:text-3xl"
                style={{ color: "var(--text-gold)" }}
              >
                {race.paymentAlias}
              </p>
              <p
                className="mb-5 text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Cada peso = un caballo. Podes tener mas de uno.
              </p>

              <ShareButtons
                alias={race.paymentAlias}
                raceUrl={raceUrl}
                raceSize={race.size}
              />

              {race.paymentCvu && (
                <details className="mt-4 text-left">
                  <summary
                    className="cursor-pointer text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Tambien podes transferir por CVU
                  </summary>
                  <code
                    className="mt-1 block rounded px-3 py-2 font-mono text-xs"
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-gold)",
                    }}
                  >
                    {race.paymentCvu}
                  </code>
                </details>
              )}
            </div>
          )}

          {/* Progress */}
          <div className="w-full max-w-md">
            <div className="mb-2 flex items-center justify-between">
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {confirmedCount} de {race.size} caballos
              </span>
              <span
                className="text-sm font-semibold"
                style={{
                  color:
                    confirmedCount === race.size
                      ? "var(--success)"
                      : "var(--text-gold)",
                }}
              >
                {Math.round((confirmedCount / race.size) * 100)}%
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ background: "var(--bg-surface)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((confirmedCount / race.size) * 100)}%`,
                  background:
                    confirmedCount === race.size
                      ? "var(--success)"
                      : "var(--text-gold)",
                }}
              />
            </div>
          </div>

          {/* Rider lineup */}
          <RiderLineup slots={race.slots} totalSize={race.size} />
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
