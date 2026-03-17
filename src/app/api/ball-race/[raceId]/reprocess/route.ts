import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ballRaces, ballSlots } from "@/lib/db/schema";
import { simulateBallRace } from "@/lib/ball-race-simulation";
import { eq, sql } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  const { raceId } = await params;

  const [race] = await db
    .select()
    .from(ballRaces)
    .where(eq(ballRaces.id, raceId))
    .limit(1);

  if (!race) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!race.obstaclesSeed) {
    return NextResponse.json({ error: "No obstacle seed" }, { status: 400 });
  }

  const confirmedSlots = await db
    .select()
    .from(ballSlots)
    .where(
      sql`${ballSlots.raceId} = ${raceId} and ${ballSlots.paymentStatus} = 'confirmed'`,
    );

  if (confirmedSlots.length === 0) {
    return NextResponse.json({ error: "No confirmed slots" }, { status: 400 });
  }

  // Re-run simulation with current code
  const simulation = simulateBallRace(
    confirmedSlots.map((s) => ({ id: s.id, ballIndex: s.ballIndex })),
    race.obstaclesSeed,
  );

  // Update slot finish positions
  for (const ball of simulation.balls) {
    await db
      .update(ballSlots)
      .set({ finishPosition: ball.finishPosition })
      .where(eq(ballSlots.id, ball.slotId));
  }

  // Update race result
  await db
    .update(ballRaces)
    .set({
      status: "finished",
      result: simulation as unknown as Record<string, unknown>,
      finishedAt: new Date(),
    })
    .where(eq(ballRaces.id, raceId));

  return NextResponse.json({
    message: "Reprocessed",
    durationSeconds: simulation.durationSeconds,
    ballCount: simulation.balls.length,
    finishPositions: simulation.balls.map((b) => ({
      slotId: b.slotId,
      position: b.finishPosition,
      finalY: b.keyframes[b.keyframes.length - 1]?.y,
      keyframeCount: b.keyframes.length,
    })),
  });
}
