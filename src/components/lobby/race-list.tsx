import { RaceCard } from "./race-card";

type Race = {
  id: string;
  size: number;
  confirmedSlots: number;
  createdAt: string;
};

export function RaceList({ races }: { races: Race[] }) {
  if (races.length === 0) {
    return (
      <section className="px-6 py-12">
        <p className="label mb-4">Open Races</p>
        <p style={{ color: "var(--text-secondary)" }}>
          No open races right now. Create one to get started!
        </p>
      </section>
    );
  }

  return (
    <section className="px-6 py-12">
      <p className="label mb-4">Open Races</p>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {races.map((race) => (
          <RaceCard
            key={race.id}
            id={race.id}
            size={race.size}
            confirmedSlots={race.confirmedSlots}
            createdAt={race.createdAt}
          />
        ))}
      </div>
    </section>
  );
}
