"use client";

import { BorderBeam } from "@/components/ui/border-beam";

export function RegistrationBanner() {
  return (
    <div className="px-6 py-4">
      <a
        href="/register"
        className="relative mx-auto block max-w-2xl overflow-hidden rounded-lg border p-4 text-center transition-colors"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-gold)",
        }}
      >
        <BorderBeam
          size={120}
          duration={6}
          colorFrom="#c8a84e"
          colorTo="#8B6914"
          borderWidth={1}
        />
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>
          Paga 10 pesos para que aparezca tu @ de X en vez de tu nombre del
          banco.
        </p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Paga una vez, usalo en todas las carreras.
        </p>
      </a>
    </div>
  );
}
