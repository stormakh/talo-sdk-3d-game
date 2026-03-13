import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { races } from "@/lib/db/schema";
import { talo } from "@/lib/talo";
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

    if (!race.paymentId) {
      return NextResponse.json({ transactions: [] });
    }

    // Fetch payment from Talo to get current transactions
    const payment = await talo.payments.get(race.paymentId);
    const transactions = (payment as Record<string, unknown>).transactions as Array<{
      amount?: string | number;
      currency?: string;
      payment_date?: string;
      beneficiary_name?: string;
      cuit?: string;
      cbu?: string;
      cvu?: string;
      alias?: string;
    }> ?? [];

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
