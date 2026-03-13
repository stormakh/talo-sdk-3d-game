"use client";

import { useState } from "react";
import { CreateRaceDialog } from "./create-race-dialog";

export function Navbar() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-sm"
        style={{
          background: "linear-gradient(to bottom, var(--bg-deep), rgba(13,26,13,0.8))",
          borderBottom: "1px solid rgba(200,168,78,0.1)",
        }}
      >
        <a href="/" className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            🏇
          </span>
          <span
            className="text-xl tracking-wide"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-gold)" }}
          >
            The Derby Club
          </span>
        </a>

        <button
          onClick={() => setShowCreateDialog(true)}
          className="cursor-pointer rounded-md px-4 py-2 text-sm font-semibold tracking-wider uppercase transition-all hover:brightness-110"
          style={{
            background: "var(--text-gold)",
            color: "var(--bg-deep)",
            letterSpacing: "2px",
          }}
        >
          Crear Carrera
        </button>
      </nav>

      <CreateRaceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </>
  );
}
