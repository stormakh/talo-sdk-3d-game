import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const races = pgTable("3drace_races", {
  id: text("id").primaryKey(),
  size: integer("size").notNull(),
  status: text("status").notNull().default("waiting"),
  result: jsonb("result"),
  paymentId: text("payment_id"),
  paymentAlias: text("payment_alias"),
  paymentCvu: text("payment_cvu"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
});

export const slots = pgTable("3drace_slots", {
  id: serial("id").primaryKey(),
  raceId: text("race_id")
    .notNull()
    .references(() => races.id),
  lane: integer("lane").notNull(),
  displayName: text("display_name").notNull(),
  xHandle: text("x_handle"),
  avatarUrl: text("avatar_url"),
  cuit: text("cuit"),
  transactionRef: text("transaction_ref"),
  paymentStatus: text("payment_status").notNull().default("confirmed"),
  finishPosition: integer("finish_position"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const registrations = pgTable("3drace_registrations", {
  id: text("id").primaryKey(),
  xHandle: text("x_handle").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  cuit: text("cuit").unique(),
  paymentId: text("payment_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leaderboard = pgTable("3drace_leaderboard", {
  id: serial("id").primaryKey(),
  cuit: text("cuit").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  totalPoints: integer("total_points").notNull().default(0),
  racesWon: integer("races_won").notNull().default(0),
  racesPlayed: integer("races_played").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
