import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { races, slots } from "@/lib/db/schema";
import { getTalo } from "@/lib/talo";
import { generateRaceId } from "@/lib/utils";
import { eq, desc, sql } from "drizzle-orm";

const VALID_SIZES = [4, 6, 8, 10];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { size } = body;
    console.log("[POST /api/races] Creating race with size:", size);

    if (!VALID_SIZES.includes(size)) {
      console.log("[POST /api/races] Invalid size:", size);
      return NextResponse.json(
        { error: `Invalid size. Must be one of: ${VALID_SIZES.join(", ")}` },
        { status: 400 }
      );
    }

    const id = generateRaceId();
    console.log("[POST /api/races] Generated race ID:", id);

    // Create a single Talo payment for the entire race (size * $1 ARS)
    console.log("[POST /api/races] Creating Talo payment...");
    const payment = await getTalo().payments.create({
      user_id: process.env.TALO_USER_ID!,
      price: { amount: size, currency: "ARS" },
      payment_options: ["transfer"],
      external_id: `race_${id}`,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/talo`,
      motive: `Derby ${id} - ${size}-Horse Race`,
    });
    console.log("[POST /api/races] Talo payment created:", JSON.stringify(payment, null, 2));

    // Extract alias and CVU from quotes (Talo returns these in quotes[0])
    const paymentDetails = payment as Record<string, unknown>;
    const quotes = paymentDetails.quotes as Array<{
      alias?: string;
      cvu?: string;
      address?: string;
    }> | undefined;
    const quote = quotes?.[0];
    // CVU can be in `cvu` or `address` field
    const alias = quote?.alias ?? null;
    const cvu = quote?.cvu ?? quote?.address ?? null;
    console.log("[POST /api/races] quote:", JSON.stringify(quote));

    console.log("[POST /api/races] Inserting race into DB...");
    const [race] = await db
      .insert(races)
      .values({
        id,
        size,
        status: "waiting",
        paymentId: payment.id,
        paymentAlias: alias,
        paymentCvu: cvu,
      })
      .returning();
    console.log("[POST /api/races] Race inserted:", JSON.stringify(race));

    return NextResponse.json(race, { status: 201 });
  } catch (error) {
    console.error("[POST /api/races] Failed to create race:", error);
    return NextResponse.json(
      { error: "Failed to create race" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const waitingRaces = await db
      .select({
        id: races.id,
        size: races.size,
        status: races.status,
        createdAt: races.createdAt,
        confirmedSlots: sql<number>`count(case when ${slots.paymentStatus} = 'confirmed' then 1 end)`.mapWith(Number),
      })
      .from(races)
      .leftJoin(slots, eq(races.id, slots.raceId))
      .where(eq(races.status, "waiting"))
      .groupBy(races.id)
      .orderBy(desc(races.createdAt))
      .limit(20);

    return NextResponse.json(waitingRaces);
  } catch (error) {
    console.error("Failed to fetch races:", error);
    return NextResponse.json(
      { error: "Failed to fetch races" },
      { status: 500 }
    );
  }
}
