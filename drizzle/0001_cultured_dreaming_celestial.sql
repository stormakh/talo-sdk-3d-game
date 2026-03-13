ALTER TABLE "3drace_races" ADD COLUMN "payment_id" text;--> statement-breakpoint
ALTER TABLE "3drace_races" ADD COLUMN "payment_alias" text;--> statement-breakpoint
ALTER TABLE "3drace_races" ADD COLUMN "payment_cvu" text;--> statement-breakpoint
ALTER TABLE "3drace_slots" DROP COLUMN "payment_id";--> statement-breakpoint
ALTER TABLE "3drace_slots" DROP COLUMN "payment_url";