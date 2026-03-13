import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { races, slots, registrations } from "@/lib/db/schema";
import { getTalo } from "@/lib/talo";
import { eq } from "drizzle-orm";
import type { TaloTransaction } from "@/types";

function extractLastName(beneficiaryName: string): string {
  const parts = beneficiaryName.trim().split(/\s+/);
  const last = parts[parts.length - 1] || beneficiaryName;
  return last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ raceId: string }> }
) {
  const { raceId } = await params;

  const [race] = await db
    .select()
    .from(races)
    .where(eq(races.id, raceId))
    .limit(1);

  if (!race) {
    return NextResponse.json({ error: "Carrera no encontrada" }, { status: 404 });
  }

  if (!race.paymentId) {
    return NextResponse.json({ error: "Carrera sin pago asociado" }, { status: 400 });
  }

  // Fetch the full payment from Talo
  const payment = await getTalo().payments.get(race.paymentId);
  const transactions =
    ((payment as Record<string, unknown>).transactions as TaloTransaction[] | undefined) ?? [];

  if (transactions.length === 0) {
    return NextResponse.json({ error: "No hay transacciones en este pago" }, { status: 400 });
  }

  // Get existing slots for this race
  const existingSlots = await db
    .select()
    .from(slots)
    .where(eq(slots.raceId, raceId));

  const updates: Array<{ slotId: number; displayName: string; cuit: string | null; xHandle: string | null; avatarUrl: string | null }> = [];

  for (const tx of transactions) {
    const processed = tx.transaction_data?.PROCESSED;
    const txCuit = processed?.senderCuit ?? null;
    const senderName = processed?.senderTitular ?? null;

    if (!senderName && !txCuit) continue;

    // Find slots that were created from this transaction (match by transactionRef pattern)
    const txIndex = transactions.indexOf(tx);
    const matchingSlots = existingSlots.filter((s) =>
      s.transactionRef?.startsWith(`race_${raceId}_tx_${txIndex}_`)
    );

    for (const slot of matchingSlots) {
      let displayName = senderName ? extractLastName(senderName) : slot.displayName;
      let xHandle: string | null = null;
      let avatarUrl: string | null = null;

      // Check registration by cuit
      if (txCuit) {
        const [reg] = await db
          .select()
          .from(registrations)
          .where(eq(registrations.cuit, txCuit))
          .limit(1);

        if (reg && reg.status === "confirmed") {
          displayName = reg.xHandle;
          xHandle = reg.xHandle;
          avatarUrl = reg.avatarUrl;
        }
      }

      // Apply numbered suffix if multiple slots from same tx
      const slotIndex = slot.transactionRef?.match(/_slot_(\d+)$/)?.[1];
      const finalName = matchingSlots.length > 1 && slotIndex
        ? `${displayName} (${Number(slotIndex) + 1})`
        : displayName;

      await db
        .update(slots)
        .set({
          displayName: finalName,
          cuit: txCuit,
          xHandle,
          avatarUrl,
        })
        .where(eq(slots.id, slot.id));

      updates.push({
        slotId: slot.id,
        displayName: finalName,
        cuit: txCuit,
        xHandle,
        avatarUrl,
      });
    }
  }

  return NextResponse.json({
    message: `Reprocesados ${updates.length} slots`,
    updates,
  });
}
