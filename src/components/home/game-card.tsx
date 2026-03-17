"use client";

import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";

type GameCardProps = {
  title: string;
  description: string;
  href: string;
  icon: string;
  available: boolean;
  tags?: string[];
};

export function GameCard({
  title,
  description,
  href,
  icon,
  available,
  tags = [],
}: GameCardProps) {
  const content = (
    <div
      className={`group relative flex min-h-[220px] flex-col overflow-hidden rounded-xl border p-6 transition-colors ${
        available
          ? "hover:border-[var(--border-gold)]"
          : "pointer-events-none opacity-50"
      }`}
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {available && (
        <BorderBeam
          size={100}
          duration={5}
          colorFrom="#c8a84e"
          colorTo="#8B6914"
          borderWidth={1.5}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        />
      )}

      {!available && (
        <span
          className="absolute top-4 right-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          style={{
            background: "var(--bg-surface)",
            color: "var(--text-secondary)",
          }}
        >
          Proximamente
        </span>
      )}

      <span className="mb-4 text-4xl">{icon}</span>

      <h3
        className="mb-2 text-xl"
        style={{
          fontFamily: "var(--font-serif)",
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h3>

      <p
        className="mb-4 flex-1 text-sm leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {description}
      </p>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2.5 py-0.5 text-xs"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-gold)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (!available) return content;

  return <Link href={href}>{content}</Link>;
}
