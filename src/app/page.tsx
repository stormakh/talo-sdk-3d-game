import { db } from "@/lib/db";
import { races, slots, leaderboard } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Navbar } from "@/components/lobby/navbar";
import { Hero } from "@/components/lobby/hero";
import { RaceList } from "@/components/lobby/race-list";
import { LeaderboardPodium } from "@/components/lobby/leaderboard-podium";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [waitingRaces, leaderboardEntries] = await Promise.all([
    db
      .select({
        id: races.id,
        size: races.size,
        createdAt: races.createdAt,
        confirmedSlots: sql<number>`count(case when ${slots.paymentStatus} = 'confirmed' then 1 end)`.mapWith(Number),
      })
      .from(races)
      .leftJoin(slots, eq(races.id, slots.raceId))
      .where(eq(races.status, "waiting"))
      .groupBy(races.id)
      .orderBy(desc(races.createdAt))
      .limit(20),
    db
      .select({
        displayName: leaderboard.displayName,
        avatarUrl: leaderboard.avatarUrl,
        totalPoints: leaderboard.totalPoints,
        racesWon: leaderboard.racesWon,
        racesPlayed: leaderboard.racesPlayed,
      })
      .from(leaderboard)
      .orderBy(desc(leaderboard.totalPoints))
      .limit(50),
  ]);

  const serializedRaces = waitingRaces.map((r) => ({
    id: r.id,
    size: r.size,
    confirmedSlots: r.confirmedSlots,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />

      {/* Registration banner */}
      <div className="px-6 py-4">
        <a
          href="/register"
          className="mx-auto block max-w-2xl rounded-lg border p-4 text-center transition-colors"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-gold)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            Paga 10 pesos para que aparezca tu @ de X en vez de tu nombre del
            banco.
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Paga una vez, usalo en todas las carreras.
          </p>
        </a>
      </div>

      <RaceList races={serializedRaces} />
      <LeaderboardPodium entries={leaderboardEntries} />
    </main>
  );
}
