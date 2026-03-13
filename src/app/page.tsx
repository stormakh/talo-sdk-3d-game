import { db } from "@/lib/db";
import { races, slots, leaderboard } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Navbar } from "@/components/lobby/navbar";
import { Hero } from "@/components/lobby/hero";
import { RaceList } from "@/components/lobby/race-list";
import { LeaderboardPodium } from "@/components/lobby/leaderboard-podium";
import { RegistrationBanner } from "@/components/lobby/registration-banner";

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
      <RegistrationBanner />
      <div className="mx-auto my-2 h-px max-w-4xl bg-gradient-to-r from-transparent via-[#c8a84e33] to-transparent" />
      <RaceList races={serializedRaces} />
      <div className="mx-auto my-2 h-px max-w-4xl bg-gradient-to-r from-transparent via-[#c8a84e33] to-transparent" />
      <LeaderboardPodium entries={leaderboardEntries} />
    </main>
  );
}
