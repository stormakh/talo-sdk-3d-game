import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { races, slots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { RacePageClient } from "@/components/race/race-page-client";
import type { RaceResult, RaceWithSlots } from "@/types";

export const dynamic = "force-dynamic";

export default async function RacePage({
  params,
}: {
  params: Promise<{ raceId: string }>;
}) {
  const { raceId } = await params;

  const [race] = await db
    .select()
    .from(races)
    .where(eq(races.id, raceId))
    .limit(1);

  if (!race) notFound();

  const raceSlots = await db
    .select()
    .from(slots)
    .where(eq(slots.raceId, raceId));

  // Strip cuit from slots
  const safeSlots = raceSlots.map(({ cuit, transactionRef, ...rest }) => rest);

  const raceWithSlots: RaceWithSlots = {
    ...race,
    result: (race.result as RaceResult) ?? null,
    slots: safeSlots,
  };

  return <RacePageClient initialRace={raceWithSlots} />;
}
