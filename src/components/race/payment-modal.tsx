"use client";

import { BorderBeam } from "@/components/ui/border-beam";

export function PaymentInfo({
  alias,
  cvu,
}: {
  alias: string | null;
  cvu: string | null;
}) {
  if (!alias && !cvu) return null;

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div
      className="relative mx-auto w-full max-w-sm overflow-hidden rounded-lg border p-5"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-gold)",
      }}
    >
      <BorderBeam
        size={100}
        duration={5}
        colorFrom="#c8a84e"
        colorTo="#8B6914"
        borderWidth={1}
      />
      <p className="label mb-3 text-center">Transferi para correr</p>

      {alias && (
        <div className="mb-3">
          <p className="mb-1 text-xs" style={{ color: "var(--text-secondary)" }}>
            Alias
          </p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 rounded px-3 py-2 text-sm font-mono"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-gold)",
              }}
            >
              {alias}
            </code>
            <button
              onClick={() => copyToClipboard(alias)}
              className="cursor-pointer rounded px-3 py-2 text-xs uppercase tracking-wider transition-colors"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
              }}
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      {cvu && (
        <div>
          <p className="mb-1 text-xs" style={{ color: "var(--text-secondary)" }}>
            CVU
          </p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 rounded px-3 py-2 text-sm font-mono"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-gold)",
              }}
            >
              {cvu}
            </code>
            <button
              onClick={() => copyToClipboard(cvu)}
              className="cursor-pointer rounded px-3 py-2 text-xs uppercase tracking-wider transition-colors"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
              }}
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      <p
        className="mt-3 text-center text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        Cada peso = un caballo. Podes tener mas de uno en la misma carrera.
      </p>
    </div>
  );
}
