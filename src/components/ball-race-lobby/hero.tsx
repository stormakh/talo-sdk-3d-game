"use client";

import { useState } from "react";
import { CreateBallRaceDialog } from "./create-ball-race-dialog";
import { Particles } from "@/components/ui/particles";
import { SparklesCore } from "@/components/ui/sparkles";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export function BallRaceHero() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-20 text-center">
        <Particles
          className="absolute inset-0"
          quantity={60}
          color="#c8a84e"
          size={0.6}
          staticity={30}
          ease={80}
        />

        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "600px",
            height: "400px",
            background:
              "radial-gradient(ellipse at center, rgba(200,168,78,0.06) 0%, transparent 70%)",
          }}
        />

        <p className="label relative z-10 mb-4">Ball Race en Vivo</p>
        <h1
          className="relative z-10 mb-4 text-5xl leading-tight md:text-7xl"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--text-primary)",
          }}
        >
          Tirá. Mirá. Ganá.
        </h1>

        <div className="relative z-10 mx-auto mb-6 h-10 w-[20rem]">
          <div className="absolute left-1/2 top-0 h-[2px] w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#c8a84e] to-transparent blur-sm" />
          <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#c8a84e] to-transparent" />
          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1.2}
            particleDensity={600}
            className="h-full w-full"
            particleColor="#c8a84e"
            speed={2}
          />
          <div className="absolute inset-0 h-full w-full bg-[var(--bg-deep)] [mask-image:radial-gradient(300px_120px_at_top,transparent_20%,white)]" />
        </div>

        <p
          className="relative z-10 mb-8 max-w-md text-lg"
          style={{ color: "var(--text-secondary)" }}
        >
          Bolas cayendo por obstaculos al azar. Transferi y mira quien llega
          primero.
        </p>

        <ShimmerButton
          onClick={() => setShowCreateDialog(true)}
          shimmerColor="#c8a84e"
          shimmerSize="0.08em"
          shimmerDuration="2.5s"
          background="rgba(200, 168, 78, 1)"
          borderRadius="8px"
          className="relative z-10 px-8 py-3 text-sm font-bold tracking-widest uppercase text-[#0d1a0d]"
        >
          Crear una Partida
        </ShimmerButton>

        <div className="relative z-10 mt-12 flex items-center gap-8">
          <div className="text-center">
            <p
              className="text-2xl font-bold"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--text-gold)",
              }}
            >
              2D
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Animacion en vivo
            </p>
          </div>
          <div
            className="h-8 w-px"
            style={{ background: "var(--border-subtle)" }}
          />
          <div className="text-center">
            <p
              className="text-2xl font-bold"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--text-gold)",
              }}
            >
              $1
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Por bola
            </p>
          </div>
          <div
            className="h-8 w-px"
            style={{ background: "var(--border-subtle)" }}
          />
          <div className="text-center">
            <p
              className="text-2xl font-bold"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--text-gold)",
              }}
            >
              ARS
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Transferencia
            </p>
          </div>
        </div>
      </section>

      <CreateBallRaceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </>
  );
}
