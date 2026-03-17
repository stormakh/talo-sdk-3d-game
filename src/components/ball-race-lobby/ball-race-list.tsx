import { BallRaceCard } from "./ball-race-card";

type BallRace = {
  id: string;
  size: number;
  confirmedSlots: number;
  createdAt: string;
};

export function BallRaceList({ races }: { races: BallRace[] }) {
  if (races.length === 0) {
    return (
      <section className="px-6 py-12">
        <p className="label mb-4">Partidas Abiertas</p>
        <p style={{ color: "var(--text-secondary)" }}>
          No hay partidas abiertas. Crea una para arrancar!
        </p>
      </section>
    );
  }

  return (
    <section className="px-6 py-12">
      <p className="label mb-4">Partidas Abiertas</p>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {races.map((race) => (
          <BallRaceCard
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
