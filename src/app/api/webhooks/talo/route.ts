import { db } from "@/lib/db";
import { races, slots, leaderboard, registrations } from "@/lib/db/schema";
import { getTalo } from "@/lib/talo";
import { simulateRace } from "@/lib/race-simulation";
import { emitRaceEvent } from "@/lib/race-events";
import { eq, sql } from "drizzle-orm";
import type { TaloTransaction } from "@/types";

function extractLastName(beneficiaryName: string): string {
  const parts = beneficiaryName.trim().split(/\s+/);
  const last = parts[parts.length - 1] || beneficiaryName;
  return last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
}

function stripCuit<T extends Record<string, unknown>>(
  obj: T
): Omit<T, "cuit"> {
  const { cuit: _, ...rest } = obj;
  return rest as Omit<T, "cuit">;
}

async function computeRace(raceId: string) {
  const confirmedSlots = await db
    .select()
    .from(slots)
    .where(
      sql`${slots.raceId} = ${raceId} and ${slots.paymentStatus} = 'confirmed'`
    );

  if (confirmedSlots.length === 0) return;

  const simulation = simulateRace(
    confirmedSlots.map((s) => ({ id: s.id, lane: s.lane }))
  );

  for (const horse of simulation.horses) {
    await db
      .update(slots)
      .set({ finishPosition: horse.finishPosition })
      .where(eq(slots.id, horse.slotId));
  }

  await db
    .update(races)
    .set({
      status: "finished",
      result: simulation as unknown as Record<string, unknown>,
      finishedAt: new Date(),
    })
    .where(eq(races.id, raceId));

  const [race] = await db
    .select()
    .from(races)
    .where(eq(races.id, raceId))
    .limit(1);

  const raceSize = race.size;

  for (const slot of confirmedSlots) {
    const horse = simulation.horses.find((h) => h.slotId === slot.id);
    if (!horse) continue;

    const isWinner = horse.finishPosition === 1;
    const pointsToAdd = isWinner ? raceSize - 1 : 0;

    await db
      .insert(leaderboard)
      .values({
        cuit: slot.cuit ?? `unknown_${slot.id}`,
        displayName: slot.displayName,
        avatarUrl: slot.avatarUrl,
        totalPoints: pointsToAdd,
        racesWon: isWinner ? 1 : 0,
        racesPlayed: 1,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: leaderboard.cuit,
        set: {
          displayName: slot.displayName,
          avatarUrl: slot.avatarUrl,
          totalPoints: sql`${leaderboard.totalPoints} + ${pointsToAdd}`,
          racesWon: sql`${leaderboard.racesWon} + ${isWinner ? 1 : 0}`,
          racesPlayed: sql`${leaderboard.racesPlayed} + 1`,
          updatedAt: new Date(),
        },
      });
  }

  // Emit race_finished with full race data (cuit stripped)
  const finishedSlots = await db
    .select()
    .from(slots)
    .where(eq(slots.raceId, raceId));

  emitRaceEvent({
    type: "race_finished",
    raceId,
    payload: {
      ...race,
      slots: finishedSlots.map((s) => stripCuit(s)),
    },
  });
}

async function handleRacePayment(
  raceId: string,
  transactions: TaloTransaction[]
) {
  const [race] = await db
    .select()
    .from(races)
    .where(eq(races.id, raceId))
    .limit(1);

  if (!race || race.status !== "waiting") return;

  const existingSlots = await db
    .select()
    .from(slots)
    .where(eq(slots.raceId, raceId));

  let currentSlotCount = existingSlots.length;

  for (let txIndex = 0; txIndex < transactions.length; txIndex++) {
    const tx = transactions[txIndex];
    const txAmount = Math.floor(Number(tx.amount ?? 0));
    // Extract sender info from transaction_data.PROCESSED
    const processed = tx.transaction_data?.PROCESSED;
    const txCuit = processed?.senderCuit ?? null;
    const beneficiaryName = processed?.senderTitular ?? "Anon";

    if (txAmount <= 0) continue;

    // Determine display name: check registration by cuit
    let displayName = extractLastName(beneficiaryName);
    let xHandle: string | null = null;
    let avatarUrl: string | null = null;

    if (txCuit) {
      const [reg] = await db
        .select()
        .from(registrations)
        .where(
          sql`${registrations.cuit} = ${txCuit} and ${registrations.status} = 'confirmed'`
        )
        .limit(1);

      if (reg) {
        displayName = reg.xHandle;
        xHandle = reg.xHandle;
        avatarUrl = reg.avatarUrl;
      }
    }

    const slotsToCreate = Math.min(txAmount, race.size - currentSlotCount);

    for (let j = 0; j < slotsToCreate; j++) {
      const ref = `race_${raceId}_tx_${txIndex}_slot_${j}`;

      // Idempotency: skip if this transactionRef already exists
      const [existing] = await db
        .select({ id: slots.id })
        .from(slots)
        .where(eq(slots.transactionRef, ref))
        .limit(1);

      if (existing) continue;

      const slotDisplayName =
        slotsToCreate > 1 ? `${displayName} (${j + 1})` : displayName;

      const lane = currentSlotCount + 1;

      const [newSlot] = await db
        .insert(slots)
        .values({
          raceId,
          lane,
          displayName: slotDisplayName,
          xHandle,
          avatarUrl,
          cuit: txCuit,
          transactionRef: ref,
          paymentStatus: "confirmed",
        })
        .returning();

      currentSlotCount++;

      // Emit SSE event (strip cuit)
      emitRaceEvent({
        type: "player_joined",
        raceId,
        payload: { slot: stripCuit(newSlot) },
      });
    }
  }

  // Check if race is full
  if (currentSlotCount >= race.size) {
    await computeRace(raceId);
  }
}

async function handleRegistrationPayment(
  registrationId: string,
  transactions: TaloTransaction[]
) {
  if (transactions.length === 0) return;

  const [reg] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, registrationId))
    .limit(1);

  if (!reg || reg.status === "confirmed") return;

  // Find a transaction with amount >= 10 and extract cuit from transaction_data
  const validTx = transactions.find((tx) => Number(tx.amount ?? 0) >= 10);
  const validTxCuit = validTx?.transaction_data?.PROCESSED?.senderCuit;
  if (!validTx || !validTxCuit) return;

  // Upsert: if this cuit already has a registration, update it
  const [existingByCuit] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.cuit, validTxCuit))
    .limit(1);

  if (existingByCuit && existingByCuit.id !== reg.id) {
    // Update existing registration with new xHandle
    await db
      .update(registrations)
      .set({
        xHandle: reg.xHandle,
        avatarUrl: reg.avatarUrl,
        status: "confirmed",
      })
      .where(eq(registrations.id, existingByCuit.id));

    // Delete the pending one
    await db.delete(registrations).where(eq(registrations.id, reg.id));
  } else {
    // Confirm this registration
    await db
      .update(registrations)
      .set({
        cuit: validTxCuit,
        status: "confirmed",
      })
      .where(eq(registrations.id, reg.id));
  }

  // Update leaderboard display name if this cuit has entries
  await db
    .update(leaderboard)
    .set({
      displayName: reg.xHandle,
      avatarUrl: reg.avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(leaderboard.cuit, validTxCuit));
}

let _webhookHandler: (request: Request) => Promise<Response>;

function getWebhookHandler(): (request: Request) => Promise<Response> {
  if (!_webhookHandler) {
    _webhookHandler = getTalo().webhooks.handler({
      onPaymentUpdated: async ({ payment }) => {
    const externalId = payment.external_id;
    console.log("[WEBHOOK] payment updated:", externalId, payment.payment_status);
    if (!externalId) return;

    const transactions =
      ((payment as Record<string, unknown>).transactions as
        | TaloTransaction[]
        | undefined) ?? [];

    if (transactions.length > 0) {
      const tx0 = transactions[0];
      const processed = tx0.transaction_data?.PROCESSED;
      console.log("[WEBHOOK] tx sender:", processed?.senderTitular, "cuit:", processed?.senderCuit, "amount:", tx0.amount);
    }

    const raceMatch = externalId.match(/^race_(.+)$/);
    if (raceMatch) {
      await handleRacePayment(raceMatch[1], transactions);
      return;
    }

    const registerMatch = externalId.match(/^register_(.+)$/);
    if (registerMatch) {
      await handleRegistrationPayment(registerMatch[1], transactions);
      return;
    }
  },
    });
  }
  return _webhookHandler;
}

export async function POST(request: Request) {
  return getWebhookHandler()(request);
}
