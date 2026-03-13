import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leaderboard } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const entries = await db
      .select({
        displayName: leaderboard.displayName,
        avatarUrl: leaderboard.avatarUrl,
        totalPoints: leaderboard.totalPoints,
        racesWon: leaderboard.racesWon,
        racesPlayed: leaderboard.racesPlayed,
      })
      .from(leaderboard)
      .orderBy(desc(leaderboard.totalPoints))
      .limit(50);

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
