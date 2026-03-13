import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { talo } from "@/lib/talo";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { xHandle } = body;

    if (!xHandle || typeof xHandle !== "string") {
      return NextResponse.json(
        { error: "xHandle is required" },
        { status: 400 }
      );
    }

    const handle = xHandle.replace(/^@/, "").trim();
    if (!handle) {
      return NextResponse.json(
        { error: "Invalid X handle" },
        { status: 400 }
      );
    }

    const id = nanoid(10);
    const avatarUrl = `https://unavatar.io/x/${handle}`;

    const payment = await talo.payments.create({
      user_id: process.env.TALO_USER_ID!,
      price: { amount: 10, currency: "ARS" },
      payment_options: ["transfer"],
      external_id: `register_${id}`,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/talo`,
      motive: `Derby Club - Registro @${handle}`,
    });

    const paymentDetails = payment as Record<string, unknown>;
    const transactionFields = paymentDetails.transaction_fields as {
      alias?: string;
      cvu?: string;
    } | undefined;

    await db.insert(registrations).values({
      id,
      xHandle: handle,
      avatarUrl,
      paymentId: payment.id,
      status: "pending",
    });

    return NextResponse.json(
      {
        registrationId: id,
        paymentAlias: transactionFields?.alias ?? null,
        paymentCvu: transactionFields?.cvu ?? null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create registration:", error);
    return NextResponse.json(
      { error: "Failed to create registration" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Registration ID required" },
      { status: 400 }
    );
  }

  const [reg] = await db
    .select({
      id: registrations.id,
      xHandle: registrations.xHandle,
      avatarUrl: registrations.avatarUrl,
      status: registrations.status,
      createdAt: registrations.createdAt,
    })
    .from(registrations)
    .where(eq(registrations.id, id))
    .limit(1);

  if (!reg) {
    return NextResponse.json(
      { error: "Registration not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(reg);
}
