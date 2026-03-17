import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ballRaces, ballSlots } from "@/lib/db/schema";
import { getTalo } from "@/lib/talo";
import { generateRaceId } from "@/lib/utils";
import { eq, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const VALID_SIZES = [4, 8, 12, 16];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { size } = body;

    if (!VALID_SIZES.includes(size)) {
      return NextResponse.json(
        { error: `Tamaño invalido. Debe ser: ${VALID_SIZES.join(", ")}` },
        { status: 400 },
      );
    }

    const id = generateRaceId();
    const obstaclesSeed = nanoid(8);

    const payment = await getTalo().payments.create({
      user_id: process.env.TALO_USER_ID!,
      price: { amount: size, currency: "ARS" },
      payment_options: ["transfer"],
      external_id: `ballrace_${id}`,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/talo`,
      motive: `Ball Race ${id} - ${size} Bolas`,
    });

    const paymentDetails = payment as Record<string, unknown>;
    const quotes = paymentDetails.quotes as
      | Array<{ alias?: string; cvu?: string; address?: string }>
      | undefined;
    const quote = quotes?.[0];
    const alias = quote?.alias ?? null;
    const cvu = quote?.cvu ?? quote?.address ?? null;

    const [race] = await db
      .insert(ballRaces)
      .values({
        id,
        size,
        status: "waiting",
        obstaclesSeed,
        paymentId: payment.id,
        paymentAlias: alias,
        paymentCvu: cvu,
      })
      .returning();

    return NextResponse.json(race, { status: 201 });
  } catch (error) {
    console.error("[POST /api/ball-race] Failed to create ball race:", error);
    return NextResponse.json(
      { error: "Failed to create ball race" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const waitingRaces = await db
      .select({
        id: ballRaces.id,
        size: ballRaces.size,
        status: ballRaces.status,
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
      .limit(20);

    return NextResponse.json(waitingRaces);
  } catch (error) {
    console.error("Failed to fetch ball races:", error);
    return NextResponse.json(
      { error: "Failed to fetch ball races" },
      { status: 500 },
    );
  }
}
