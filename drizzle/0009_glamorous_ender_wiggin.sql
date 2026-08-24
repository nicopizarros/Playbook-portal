ALTER TABLE "articles" ADD COLUMN "score" smallint;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "confirmed" boolean;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "score_boleta" jsonb;