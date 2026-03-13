import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { races, slots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> }
) {
  try {
    const { raceId } = await params;

    const [race] = await db
      .select()
      .from(races)
      .where(eq(races.id, raceId))
      .limit(1);

    if (!race) {
      return NextResponse.json({ error: "Race not found" }, { status: 404 });
    }

    const raceSlots = await db
      .select()
      .from(slots)
      .where(eq(slots.raceId, raceId));

    // Strip cuit from slots before returning
    const safeSlots = raceSlots.map(({ cuit, transactionRef, ...rest }) => rest);

    return NextResponse.json({ ...race, slots: safeSlots });
  } catch (error) {
    console.error("Failed to fetch race:", error);
    return NextResponse.json(
      { error: "Failed to fetch race" },
      { status: 500 }
    );
  }
}
