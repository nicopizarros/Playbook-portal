ALTER TABLE "articles" ALTER COLUMN "source" SET DEFAULT 'noticias';--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "tags_property" text[] DEFAULT '{}' NOT NULL;