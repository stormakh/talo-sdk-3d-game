"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SIZES = [4, 8, 12, 16] as const;

export function CreateBallRaceDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<number>(8);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/ball-race", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: selectedSize }),
      });
      const race = await res.json();
      if (!res.ok)
        throw new Error(race.error || "Error al crear la partida");
      router.push(`/ball-race/race/${race.id}`);
    } catch (err) {
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
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--text-primary)",
          }}
        >
          Crear Ball Race
        </h2>
        <p
          className="mb-6 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Elegi cuantas bolas van a competir.
        </p>

        <div className="mb-6 grid grid-cols-4 gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className="cursor-pointer rounded py-3 text-center text-sm font-semibold transition-colors"
              style={{
                background:
                  selectedSize === size
                    ? "var(--text-gold)"
                    : "var(--bg-surface)",
                color:
                  selectedSize === size
                    ? "var(--bg-deep)"
                    : "var(--text-primary)",
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
          <p
            className="mb-4 text-center text-sm"
            style={{ color: "#ef4444" }}
          >
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
