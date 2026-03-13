import type { RaceWithSlots, SlotWithPosition } from "@/types";

const RANK_COLORS = [
  "var(--text-gold)",
  "var(--text-silver)",
  "var(--text-bronze)",
];

const RANK_LABELS = ["1st", "2nd", "3rd"];

function getAvatarUrl(slot: SlotWithPosition): string {
  if (slot.avatarUrl) return slot.avatarUrl;
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(slot.displayName)}`;
}

function getDisplayLabel(slot: SlotWithPosition): string {
  return slot.xHandle ? `@${slot.xHandle}` : slot.displayName;
}

export function RaceResults({
  race,
  onWatchAgain,
}: {
  race: RaceWithSlots;
  onWatchAgain?: () => void;
}) {
  const sortedSlots = [...race.slots]
    .filter((s) => s.finishPosition !== null)
    .sort((a, b) => (a.finishPosition ?? 99) - (b.finishPosition ?? 99));

  const top3 = sortedSlots.slice(0, 3);
  const rest = sortedSlots.slice(3);

  return (
    <div className="flex flex-col items-center px-6 py-8">
      <p className="label mb-2">Resultados</p>
      <h2
        className="mb-6 text-3xl"
        style={{
          fontFamily: "var(--font-serif)",
          color: "var(--text-primary)",
        }}
      >
        Carrera Terminada
      </h2>

      {/* Podium */}
      <div className="mb-6 flex items-end gap-4">
        {top3.length >= 3
          ? [top3[1], top3[0], top3[2]].map((slot, i) => {
              const rank = [1, 0, 2][i];
              const color = RANK_COLORS[rank];
              const height =
                rank === 0 ? "h-24" : rank === 1 ? "h-16" : "h-12";

              return (
                <div key={slot.id} className="flex flex-col items-center">
                  <img
                    src={getAvatarUrl(slot)}
                    alt={slot.displayName}
                    className="mb-1 h-10 w-10 rounded-full border-2"
                    style={{ borderColor: color }}
                  />
                  <span className="text-xs font-semibold" style={{ color }}>
                    {getDisplayLabel(slot)}
                  </span>
                  <div
                    className={`${height} mt-1 flex w-16 items-end justify-center rounded-t-lg pb-1`}
                    style={{ background: "var(--bg-surface)" }}
                  >
                    <span className="text-xs font-bold" style={{ color }}>
                      {RANK_LABELS[rank]}
                    </span>
                  </div>
                </div>
              );
            })
          : top3.map((slot, i) => (
              <div key={slot.id} className="flex flex-col items-center">
                <img
                  src={getAvatarUrl(slot)}
                  alt={slot.displayName}
                  className="mb-1 h-10 w-10 rounded-full border-2"
                  style={{ borderColor: RANK_COLORS[i] }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: RANK_COLORS[i] }}
                >
                  {getDisplayLabel(slot)}
                </span>
              </div>
            ))}
      </div>

      {/* Remaining results */}
      {rest.length > 0 && (
        <div
          className="mb-6 w-full max-w-sm rounded-lg border"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {rest.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <span
                className="w-6 text-right text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                {slot.finishPosition}
              </span>
              <img
                src={getAvatarUrl(slot)}
                alt={slot.displayName}
                className="h-7 w-7 rounded-full"
              />
              <span
                className="text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {getDisplayLabel(slot)}
              </span>
            </div>
          ))}
        </div>
      )}

      {onWatchAgain && (
        <button
          onClick={onWatchAgain}
          className="cursor-pointer rounded border px-6 py-2 text-sm tracking-wider uppercase transition-colors"
          style={{
            borderColor: "var(--border-gold)",
            color: "var(--text-gold)",
            background: "transparent",
          }}
        >
          Ver de Nuevo
        </button>
      )}
    </div>
  );
}
