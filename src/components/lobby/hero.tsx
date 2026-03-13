"use client";

import { useState } from "react";
import { CreateRaceDialog } from "./create-race-dialog";

export function Hero() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      <section className="flex flex-col items-center justify-center px-6 pt-32 pb-16 text-center">
        <p className="label mb-4">Live 3D Horse Racing</p>
        <h1
          className="mb-4 text-5xl leading-tight md:text-7xl"
          style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}
        >
          Race. Bet. Win.
        </h1>
        <p
          className="mb-8 max-w-md text-lg"
          style={{ color: "var(--text-secondary)" }}
        >
          Create or join a derby, pick your horse, and watch the race unfold in
          stunning 3D.
        </p>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="cursor-pointer rounded px-8 py-3 text-sm font-bold tracking-widest uppercase transition-opacity hover:opacity-90"
          style={{
            background: "var(--text-gold)",
            color: "var(--bg-deep)",
          }}
        >
          Create a Race
        </button>
      </section>

      <CreateRaceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </>
  );
}
