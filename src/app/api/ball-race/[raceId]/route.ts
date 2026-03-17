import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ballRaces, ballSlots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> },
) {
  try {
    const { raceId } = await params;

    const [race] = await db
      .select()
      .from(ballRaces)
      .where(eq(ballRaces.id, raceId))
      .limit(1);

    if (!race) {
      return NextResponse.json(
        { error: "Ball race not found" },
        { status: 404 },
      );
    }

    const raceSlots = await db
      .select()
      .from(ballSlots)
      .where(eq(ballSlots.raceId, raceId));

    const safeSlots = raceSlots.map(
      ({ cuit, transactionRef, ...rest }) => rest,
    );

    return NextResponse.json({ ...race, slots: safeSlots });
  } catch (error) {
    console.error("Failed to fetch ball race:", error);
    return NextResponse.json(
      { error: "Failed to fetch ball race" },
      { status: 500 },
    );
  }
}
