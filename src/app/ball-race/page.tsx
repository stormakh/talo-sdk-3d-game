import { db } from "@/lib/db";
import { ballRaces, ballSlots, ballLeaderboard } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { BallRaceNavbar } from "@/components/ball-race-lobby/navbar";
import { BallRaceHero } from "@/components/ball-race-lobby/hero";
import { BallRaceList } from "@/components/ball-race-lobby/ball-race-list";
import { LeaderboardPodium } from "@/components/lobby/leaderboard-podium";
import { RegistrationBanner } from "@/components/lobby/registration-banner";

export const dynamic = "force-dynamic";

export default async function BallRaceLobby() {
  const [waitingRaces, leaderboardEntries] = await Promise.all([
    db
      .select({
        id: ballRaces.id,
        size: ballRaces.size,
        createdAt: ballRaces.createdAt,
        confirmedSlots:
          sql<number>`count(case when ${ballSlots.paymentStatus} = 'confirmed' then 1 end)`.mapWith(
            Number,
          ),
      })
      .from(ballRaces)
      .leftJoin(ballSlots, eq(ballRaces.id, ballSlots.raceId))
      .where(eq(ballRaces.status, "waiting"))
      .groupBy(ballRaces.id)
      .orderBy(desc(ballRaces.createdAt))
      .limit(20),
    db
      .select({
        displayName: ballLeaderboard.displayName,
        avatarUrl: ballLeaderboard.avatarUrl,
        totalPoints: ballLeaderboard.totalPoints,
        racesWon: ballLeaderboard.racesWon,
        racesPlayed: ballLeaderboard.racesPlayed,
      })
      .from(ballLeaderboard)
      .orderBy(desc(ballLeaderboard.totalPoints))
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
      <BallRaceNavbar />
      <BallRaceHero />
      <RegistrationBanner />
      <div className="mx-auto my-2 h-px max-w-4xl bg-gradient-to-r from-transparent via-[#c8a84e33] to-transparent" />
      <BallRaceList races={serializedRaces} />
      <div className="mx-auto my-2 h-px max-w-4xl bg-gradient-to-r from-transparent via-[#c8a84e33] to-transparent" />
      <LeaderboardPodium entries={leaderboardEntries} />
    </main>
  );
}
