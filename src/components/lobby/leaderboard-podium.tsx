import type { LeaderboardEntry } from "@/types";

const RANK_COLORS = [
  "var(--text-gold)",
  "var(--text-silver)",
  "var(--text-bronze)",
];

const RANK_LABELS = ["1ro", "2do", "3ro"];

function getAvatarUrl(entry: LeaderboardEntry): string {
  if (entry.avatarUrl) return entry.avatarUrl;
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(entry.displayName)}`;
}

function PodiumCard({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: number;
}) {
  const color = RANK_COLORS[rank] ?? "var(--text-secondary)";
  const height = rank === 0 ? "h-28" : rank === 1 ? "h-20" : "h-14";

  return (
    <div className="flex flex-col items-center">
      <img
        src={getAvatarUrl(entry)}
        alt={entry.displayName}
        className="mb-2 h-12 w-12 rounded-full border-2"
        style={{ borderColor: color }}
      />
      <span className="text-sm font-semibold" style={{ color }}>
        {entry.displayName}
      </span>
      <span
        className="mb-2 text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        {entry.totalPoints} pts
      </span>
      <div
        className={`${height} w-20 rounded-t-lg flex items-end justify-center pb-2`}
        style={{ background: "var(--bg-surface)" }}
      >
        <span className="text-xs font-bold" style={{ color }}>
          {RANK_LABELS[rank]}
        </span>
      </div>
    </div>
  );
}

export function LeaderboardPodium({
  entries,
}: {
  entries: LeaderboardEntry[];
}) {
  if (entries.length === 0) {
    return (
      <section className="px-6 py-12">
        <p className="label mb-4">Mejores Jinetes</p>
        <p style={{ color: "var(--text-secondary)" }}>
          No hay jinetes todavia. Se el primero en correr!
        </p>
      </section>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder =
    top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumRanks =
    top3.length >= 3 ? [1, 0, 2] : top3.map((_, i) => i);

  return (
    <section className="px-6 py-12">
      <p className="label mb-6">Mejores Jinetes</p>

      {/* Podium */}
      <div className="mb-8 flex items-end justify-center gap-4">
        {podiumOrder.map((entry, i) => (
          <PodiumCard
            key={entry.displayName}
            entry={entry}
            rank={podiumRanks[i]}
          />
        ))}
      </div>

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <div
          className="mx-auto max-w-lg overflow-hidden rounded-lg border"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {rest.map((entry, i) => (
            <div
              key={entry.displayName}
              className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <span
                className="w-6 text-right text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                {i + 4}
              </span>
              <img
                src={getAvatarUrl(entry)}
                alt={entry.displayName}
                className="h-8 w-8 rounded-full"
              />
              <span
                className="flex-1 text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {entry.displayName}
              </span>
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {entry.totalPoints} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
