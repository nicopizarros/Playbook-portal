ALTER TABLE "articles" ADD COLUMN "source_url" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "articles_source_url_unique" ON "articles" USING btree ("source_url");