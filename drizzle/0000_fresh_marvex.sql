CREATE TABLE "3drace_leaderboard" (
	"id" serial PRIMARY KEY NOT NULL,
	"x_handle" text NOT NULL,
	"avatar_url" text NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"races_won" integer DEFAULT 0 NOT NULL,
	"races_played" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "3drace_leaderboard_x_handle_unique" UNIQUE("x_handle")
);
--> statement-breakpoint
CREATE TABLE "3drace_races" (
	"id" text PRIMARY KEY NOT NULL,
	"size" integer NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "3drace_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"race_id" text NOT NULL,
	"lane" integer NOT NULL,
	"x_handle" text NOT NULL,
	"avatar_url" text NOT NULL,
	"payment_id" text,
	"payment_url" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"finish_position" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "3drace_slots" ADD CONSTRAINT "3drace_slots_race_id_3drace_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."3drace_races"("id") ON DELETE no action ON UPDATE no action;