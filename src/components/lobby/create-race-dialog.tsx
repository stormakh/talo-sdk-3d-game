"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SIZES = [4, 6, 8, 10] as const;

export function CreateRaceDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<number>(6);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleCreate() {
    console.log("[CreateRaceDialog] handleCreate called, size:", selectedSize);
    setCreating(true);
    try {
      console.log("[CreateRaceDialog] Sending POST /api/races...");
      const res = await fetch("/api/races", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: selectedSize }),
      });
      console.log("[CreateRaceDialog] Response status:", res.status);
      const race = await res.json();
      console.log("[CreateRaceDialog] Response body:", JSON.stringify(race));
      if (!res.ok) throw new Error(race.error || "Error al crear la carrera");
      console.log("[CreateRaceDialog] Navigating to /race/" + race.id);
      router.push(`/race/${race.id}`);
    } catch (err) {
      console.error("[CreateRaceDialog] Error:", err);
      setError(err instanceof Error ? err.message : "Algo salio mal");
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border p-6"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-subtle)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="mb-1 text-2xl"
          style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}
        >
          Crear una Carrera
        </h2>
        <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          Elegi cuantos caballos van a competir.
        </p>

        <div className="mb-6 grid grid-cols-4 gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className="cursor-pointer rounded py-3 text-center text-sm font-semibold transition-colors"
              style={{
                background:
                  selectedSize === size ? "var(--text-gold)" : "var(--bg-surface)",
                color:
                  selectedSize === size ? "var(--bg-deep)" : "var(--text-primary)",
                border:
                  selectedSize === size
                    ? "1px solid var(--text-gold)"
                    : "1px solid var(--border-subtle)",
              }}
            >
              {size}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 text-sm text-center" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer rounded py-2.5 text-sm transition-colors"
            style={{
              background: "var(--bg-surface)",
              color: "var(--text-secondary)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex-1 cursor-pointer rounded py-2.5 text-sm font-semibold tracking-wider uppercase transition-opacity disabled:opacity-50"
            style={{
              background: "var(--text-gold)",
              color: "var(--bg-deep)",
            }}
          >
            {creating ? "Creando..." : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
