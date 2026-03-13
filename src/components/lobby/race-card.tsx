"use client";

import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";

type RaceCardProps = {
  id: string;
  size: number;
  confirmedSlots: number;
  createdAt: string;
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "recien";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export function RaceCard({
  id,
  size,
  confirmedSlots,
  createdAt,
}: RaceCardProps) {
  const fillPercent = Math.round((confirmedSlots / size) * 100);

  return (
    <Link
      href={`/race/${id}`}
      className="group relative block min-w-[220px] shrink-0 overflow-hidden rounded-lg border p-5 transition-colors hover:border-[var(--border-gold)]"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <BorderBeam
        size={80}
        duration={4}
        colorFrom="#c8a84e"
        colorTo="#8B6914"
        borderWidth={2}
        className="opacity-0 transition-opacity group-hover:opacity-100"
      />

      <p className="label mb-1">Derby</p>
      <h3
        className="mb-3 text-lg"
        style={{
          fontFamily: "var(--font-serif)",
          color: "var(--text-primary)",
        }}
      >
        Carrera de {size}
      </h3>

      {/* Progress bar */}
      <div
        className="mb-2 h-2 w-full overflow-hidden rounded-full"
        style={{ background: "var(--bg-surface)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${fillPercent}%`,
            background:
              fillPercent === 100 ? "var(--success)" : "var(--text-gold)",
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {confirmedSlots}/{size} caballos
        </span>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {timeAgo(createdAt)}
        </span>
      </div>
    </Link>
  );
}
