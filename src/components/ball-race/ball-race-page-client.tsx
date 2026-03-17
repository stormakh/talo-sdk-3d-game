"use client";

import { useState, useEffect, useCallback } from "react";
import type { BallRaceWithSlots, BallSlotWithPosition } from "@/types";
import { useRaceStream } from "@/lib/use-race-stream";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BallRaceScene } from "./ball-race-scene";

// ---------------------------------------------------------------------------
// Share buttons (adapted for ball race)
// ---------------------------------------------------------------------------

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

  const shareText = `Unite a mi Ball Race de ${raceSize} bolas! Transferi a este alias para jugar:\n\n${alias}\n\n${raceUrl}`;

  function copyAlias() {
    navigator.clipboard.writeText(alias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
    );
  }

  function shareX() {
    const tweetText = `Unite a mi Ball Race de ${raceSize} bolas! Transferi al alias ${alias} para jugar 🎱\n\n${raceUrl}`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      "_blank",
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

// ---------------------------------------------------------------------------
// Player lineup (balls with avatars/initials)
// ---------------------------------------------------------------------------

function getAvatarUrl(slot: BallSlotWithPosition): string {
  if (slot.avatarUrl) return slot.avatarUrl;
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(slot.displayName)}`;
}

function getDisplayLabel(slot: BallSlotWithPosition): string {
  return slot.xHandle ? `@${slot.xHandle}` : slot.displayName;
}

function PlayerLineup({
  slots,
  totalSize,
}: {
  slots: BallSlotWithPosition[];
  totalSize: number;
}) {
  const emptyCount = totalSize - slots.length;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-6">
      {slots.map((slot) => (
        <div key={slot.id} className="flex flex-col items-center gap-1">
          <div
            className="h-14 w-14 overflow-hidden rounded-full border-2"
            style={{ borderColor: "var(--border-gold)" }}
          >
            <img
              src={getAvatarUrl(slot)}
              alt={slot.displayName}
              className="h-full w-full object-cover"
            />
          </div>
          <span
            className="max-w-[80px] truncate text-xs"
            style={{ color: "var(--text-primary)" }}
          >
            {getDisplayLabel(slot)}
          </span>
          <span
            className="text-[9px] uppercase tracking-widest"
            style={{ color: "var(--success)" }}
          >
            Listo
          </span>
        </div>
      ))}

      {Array.from({ length: emptyCount }).map((_, i) => (
        <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span
              className="text-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              ?
            </span>
          </div>
          <span
            className="text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            Libre
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results display
// ---------------------------------------------------------------------------

function BallRaceResults({
  race,
  onWatchAgain,
}: {
  race: BallRaceWithSlots;
  onWatchAgain?: () => void;
}) {
  const RANK_COLORS = [
    "var(--text-gold)",
    "var(--text-silver)",
    "var(--text-bronze)",
  ];
  const RANK_LABELS = ["1ro", "2do", "3ro"];

  const sortedSlots = [...race.slots]
    .filter((s) => s.finishPosition !== null)
    .sort((a, b) => (a.finishPosition ?? 99) - (b.finishPosition ?? 99));

  const top3 = sortedSlots.slice(0, 3);
  const rest = sortedSlots.slice(3);

  return (
    <div className="flex flex-col items-center px-6 py-8">
      <p className="label mb-2">Resultados</p>
      <h2
        className="mb-6 text-3xl"
        style={{
          fontFamily: "var(--font-serif)",
          color: "var(--text-primary)",
        }}
      >
        Partida Terminada
      </h2>

      <div className="mb-6 flex items-end gap-4">
        {top3.length >= 3
          ? [top3[1], top3[0], top3[2]].map((slot, i) => {
              const rank = [1, 0, 2][i];
              const color = RANK_COLORS[rank];
              const height =
                rank === 0 ? "h-24" : rank === 1 ? "h-16" : "h-12";

              return (
                <div key={slot.id} className="flex flex-col items-center">
                  <img
                    src={getAvatarUrl(slot)}
                    alt={slot.displayName}
                    className="mb-1 h-10 w-10 rounded-full border-2"
                    style={{ borderColor: color }}
                  />
                  <span
                    className="text-xs font-semibold"
                    style={{ color }}
                  >
                    {getDisplayLabel(slot)}
                  </span>
                  <div
                    className={`${height} mt-1 flex w-16 items-end justify-center rounded-t-lg pb-1`}
                    style={{ background: "var(--bg-surface)" }}
                  >
                    <span
                      className="text-xs font-bold"
                      style={{ color }}
                    >
                      {RANK_LABELS[rank]}
                    </span>
                  </div>
                </div>
              );
            })
          : top3.map((slot, i) => (
              <div key={slot.id} className="flex flex-col items-center">
                <img
                  src={getAvatarUrl(slot)}
                  alt={slot.displayName}
                  className="mb-1 h-10 w-10 rounded-full border-2"
                  style={{ borderColor: RANK_COLORS[i] }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: RANK_COLORS[i] }}
                >
                  {getDisplayLabel(slot)}
                </span>
              </div>
            ))}
      </div>

      {rest.length > 0 && (
        <div
          className="mb-6 w-full max-w-sm rounded-lg border"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {rest.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <span
                className="w-6 text-right text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                {slot.finishPosition}
              </span>
              <img
                src={getAvatarUrl(slot)}
                alt={slot.displayName}
                className="h-7 w-7 rounded-full"
              />
              <span
                className="text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {getDisplayLabel(slot)}
              </span>
            </div>
          ))}
        </div>
      )}

      {onWatchAgain && (
        <button
          onClick={onWatchAgain}
          className="cursor-pointer rounded border px-6 py-2 text-sm tracking-wider uppercase transition-colors"
          style={{
            borderColor: "var(--border-gold)",
            color: "var(--text-gold)",
            background: "transparent",
          }}
        >
          Ver de Nuevo
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page client
// ---------------------------------------------------------------------------

export function BallRacePageClient({
  initialRace,
}: {
  initialRace: BallRaceWithSlots;
}) {
  const [race, setRace] = useState(initialRace);
  const [showScene, setShowScene] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const isWaiting = race.status === "waiting";
  const isFinished = race.status === "finished";
  const confirmedCount = race.slots.filter(
    (s) => s.paymentStatus === "confirmed",
  ).length;

  const raceUrl = typeof window !== "undefined" ? window.location.href : "";

  useRaceStream(race.id, isWaiting, {
    onPlayerJoined: (slot) => {
      setRace((prev) => ({
        ...prev,
        slots: prev.slots.some((s) => s.id === slot.id)
          ? prev.slots
          : [...prev.slots, slot as unknown as BallSlotWithPosition],
      }));
    },
    onRaceFinished: (finishedRace) => {
      setRace(finishedRace as unknown as BallRaceWithSlots);
    },
  });

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
      <div className="flex items-center justify-between px-6 py-4">
        <a
          href="/ball-race"
          className="text-sm transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          &larr; Volver al Lobby
        </a>
      </div>

      <div className="px-6 pb-2 text-center">
        <p className="label mb-1">Ball Race #{race.id}</p>
        <h1
          className="text-4xl md:text-5xl"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--text-primary)",
          }}
        >
          Partida de {race.size} Bolas
        </h1>
      </div>

      {isWaiting && (
        <div className="flex flex-col items-center gap-8 px-6 py-6">
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

              <p className="label mb-2">
                Transferi a este alias para jugar
              </p>
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
                Cada peso = una bola. Podes tener mas de una.
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

          <div className="w-full max-w-md">
            <div className="mb-2 flex items-center justify-between">
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {confirmedCount} de {race.size} bolas
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

          <PlayerLineup slots={race.slots} totalSize={race.size} />
        </div>
      )}

      {isFinished && showScene && race.result && !showResults && (
        <div className="flex justify-center px-4 py-6">
          <BallRaceScene
            result={race.result}
            slotsInfo={race.slots.map((s) => ({
              slotId: s.id,
              displayName: s.xHandle ? `@${s.xHandle}` : s.displayName,
              avatarUrl: s.avatarUrl,
            }))}
            onComplete={handleRaceAnimationComplete}
          />
        </div>
      )}

      {isFinished && showResults && (
        <BallRaceResults race={race} onWatchAgain={handleWatchAgain} />
      )}
    </div>
  );
}
