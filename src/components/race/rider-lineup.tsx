import type { SlotWithPosition } from "@/types";

function getAvatarUrl(slot: SlotWithPosition): string {
  if (slot.avatarUrl) return slot.avatarUrl;
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(slot.displayName)}`;
}

function getDisplayLabel(slot: SlotWithPosition): string {
  return slot.xHandle ? `@${slot.xHandle}` : slot.displayName;
}

export function RiderLineup({
  slots,
  totalSize,
}: {
  slots: SlotWithPosition[];
  totalSize: number;
}) {
  const emptyCount = totalSize - slots.length;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-6">
      {slots.map((slot) => (
        <div key={slot.id} className="flex flex-col items-center gap-1">
          <div
            className="h-14 w-14 overflow-hidden rounded-full border-2"
            style={{ borderColor: "var(--border-gold)" }}
          >
            <img
              src={getAvatarUrl(slot)}
              alt={slot.displayName}
              className="h-full w-full object-cover"
            />
          </div>
          <span
            className="max-w-[80px] truncate text-xs"
            style={{ color: "var(--text-primary)" }}
          >
            {getDisplayLabel(slot)}
          </span>
          <span
            className="text-[9px] uppercase tracking-widest"
            style={{ color: "var(--success)" }}
          >
            Listo
          </span>
        </div>
      ))}

      {/* Empty slots */}
      {Array.from({ length: emptyCount }).map((_, i) => (
        <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span
              className="text-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              ?
            </span>
          </div>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Libre
          </span>
        </div>
      ))}
    </div>
  );
}
