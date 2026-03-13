"use client";

import { useState } from "react";
import { CreateRaceDialog } from "./create-race-dialog";
import { Particles } from "@/components/ui/particles";
import { SparklesCore } from "@/components/ui/sparkles";
import { ShimmerButton } from "@/components/ui/shimmer-button";

function HorsesilhouetteSVG({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M160 40c-5-15-20-25-30-20-5-10-15-15-25-12 2 5 0 10-5 12-8 3-15 10-18 20l-5 15c-10 5-20 15-25 28-3 8-2 18 2 25l5 10h10l-2-15 8-20 15-10 10 5 5 20 8 20h12l-5-25 10-15 15-5 5 15 3 20 5 10h12l-5-20 2-18c5-8 5-18 0-25l-7-15z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Hero() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-20 text-center">
        {/* Background particles */}
        <Particles
          className="absolute inset-0"
          quantity={60}
          color="#c8a84e"
          size={0.6}
          staticity={30}
          ease={80}
        />

        {/* Decorative radial glow behind title */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "600px",
            height: "400px",
            background:
              "radial-gradient(ellipse at center, rgba(200,168,78,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Decorative horse silhouettes */}
        <HorsesilhouetteSVG className="pointer-events-none absolute left-[8%] bottom-[10%] h-24 w-24 -scale-x-100 text-[#c8a84e] opacity-[0.04]" />
        <HorsesilhouetteSVG className="pointer-events-none absolute right-[8%] bottom-[15%] h-20 w-20 text-[#c8a84e] opacity-[0.04]" />

        {/* Content */}
        <p className="label relative z-10 mb-4">Carreras de Caballos 3D en Vivo</p>
        <h1
          className="relative z-10 mb-4 text-5xl leading-tight md:text-7xl"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--text-primary)",
          }}
        >
          Corré. Jugá. Ganá.
        </h1>

        {/* Gold sparkle line under the title */}
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
          Crea o unite a un derby, transferi y mira la carrera en 3D.
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
          Crear una Carrera
        </ShimmerButton>

        {/* Stats bar */}
        <div className="relative z-10 mt-12 flex items-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-gold)" }}>3D</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Carreras en vivo</p>
          </div>
          <div className="h-8 w-px" style={{ background: "var(--border-subtle)" }} />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-gold)" }}>$1</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Por caballo</p>
          </div>
          <div className="h-8 w-px" style={{ background: "var(--border-subtle)" }} />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-gold)" }}>ARS</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Transferencia</p>
          </div>
        </div>
      </section>

      <CreateRaceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </>
  );
}
