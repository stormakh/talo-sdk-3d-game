"use client";

import { useState } from "react";
import { CreateRaceDialog } from "./create-race-dialog";

export function Navbar() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "linear-gradient(to bottom, var(--bg-deep), transparent)",
        }}
      >
        <a href="/" className="flex items-center gap-2">
          <span
            className="text-xl tracking-wide"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-gold)" }}
          >
            The Derby Club
          </span>
        </a>

        <button
          onClick={() => setShowCreateDialog(true)}
          className="cursor-pointer rounded px-4 py-2 text-sm font-semibold tracking-wider uppercase transition-colors"
          style={{
            background: "var(--text-gold)",
            color: "var(--bg-deep)",
            letterSpacing: "2px",
          }}
        >
          Create Race
        </button>
      </nav>

      <CreateRaceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </>
  );
}
