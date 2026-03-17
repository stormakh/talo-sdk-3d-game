import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ballRaces, ballSlots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { BallRacePageClient } from "@/components/ball-race/ball-race-page-client";
import type { BallRaceResult, BallRaceWithSlots } from "@/types";

export const dynamic = "force-dynamic";

export default async function BallRacePage({
  params,
}: {
  params: Promise<{ raceId: string }>;
}) {
  const { raceId } = await params;

  const [race] = await db
    .select()
    .from(ballRaces)
    .where(eq(ballRaces.id, raceId))
    .limit(1);

  if (!race) notFound();

  const raceSlots = await db
    .select()
    .from(ballSlots)
    .where(eq(ballSlots.raceId, raceId));

  const safeSlots = raceSlots.map(
    ({ cuit, transactionRef, ...rest }) => rest,
  );

  const raceWithSlots: BallRaceWithSlots = {
    ...race,
    result: (race.result as BallRaceResult) ?? null,
    slots: safeSlots,
  };

  return <BallRacePageClient initialRace={raceWithSlots} />;
}
