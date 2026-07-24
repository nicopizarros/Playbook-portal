-- Editorial team accounts (2026-07-24).
--
-- Data-only migration: no schema change (the `editors` table and its
-- credentials flow already exist — see lib/db/schema.ts and auth.ts). What
-- this replaces is the *roster*, which until now was whatever
-- scripts/seed-editors.ts happened to be run with (the legacy
-- ADMIN_USERS="user:plaintext,user:plaintext" env var, carried over from
-- the pre-Postgres site). That script and that env var are both retired in
-- the same change as this file; scripts/reset-editor-password.ts is the
-- supported way to rotate a password from here on.
--
-- Passwords were generated with crypto.randomBytes rejection sampling
-- (20-26 chars, mixed case + digits + symbols, independent length and
-- character mix per user — no shared pattern), handed to the team out of
-- band, and never written to this repository. Only the bcrypt hashes
-- (cost 12, matching lib/actions/team.ts's acceptInvitation) exist here.
--
-- Runs automatically against production via scripts/predeploy-migrate.ts on
-- the next production deploy.

-- 1. Upsert the eight current editors.
--
-- DO UPDATE, not DO NOTHING: `aldo` and `nico` already exist in production
-- with credentials from the legacy roster, and the whole point of this
-- change is that those old credentials stop working. Updating in place
-- (rather than delete + re-insert) keeps each editor's `id` stable, so the
-- articles.updated_by / content_revisions.editor_id / media.uploaded_by
-- attribution already pointing at them survives.
INSERT INTO "editors" ("username", "password_hash", "display_name") VALUES
  ('aldo', '$2a$12$3eHSPQiGDY1/CQSJpfABPu9V6apPgo4gZwOcmVWDLg/0vLtdQkbMG', 'Aldo'),
  ('memo', '$2a$12$WRX313eV7ZQmijT4TJrb2uKlAmbIqx.iKNxE5/o8TBHTZdHKJvwnm', 'Memo'),
  ('eve', '$2a$12$8O/YFNsFRPrHY1rFTgoBJOmkM8VR74FLXM4EJl5ON8DvUaogKpIhi', 'Eve'),
  ('nico', '$2a$12$MEB06Y2wJJKAXaylHbKtX.d/H/JWoJKae5C32CfnNhDpV4E9FAw7K', 'Nico'),
  ('emi', '$2a$12$mo1nBoGj08HYYIPFmg5YV.BrNKKSIUAuEEAH5ICpSVXzpaSU9dHJe', 'Emi'),
  ('vlad', '$2a$12$R8Ruawh1KSaFtCO0JuNsM.Ycz0HVJATW5F6x4zzP0/l5/6x79.Mmq', 'Vlad'),
  ('artur', '$2a$12$h6rFH.UkUSGkvm27ErKWHOA5aolud/5L9MQPDwWyZ8PsI3yDqxukm', 'Artur'),
  ('franco', '$2a$12$7aWdbrDuhgszGOTnmR.I.O9GEdtGYUJPssxQk0MHnFw/kuk.uuED6', 'Franco')
ON CONFLICT ("username") DO UPDATE
  SET "password_hash" = EXCLUDED."password_hash",
      "display_name"  = EXCLUDED."display_name";
--> statement-breakpoint

-- 2. Neutralise every editor account that is NOT on the roster above
-- (e.g. the legacy `guillermo` account).
--
-- Deliberately NOT a DELETE. Those rows are referenced by
-- articles.updated_by, content_revisions.editor_id and media.uploaded_by;
-- all three are ON DELETE SET NULL, so deleting would silently erase who
-- edited what from the audit trail that content_revisions exists to keep.
-- Overwriting the hash with a bcrypt digest of a discarded 64-byte random
-- secret achieves the actual security goal — the old credential stops
-- working, permanently and immediately — while leaving history intact. No
-- plaintext exists for this hash anywhere; the only route back into such an
-- account is a fresh invitation from the Equipo tab.
UPDATE "editors"
SET "password_hash" = '$2a$12$Wlspo7aUcJrhvic/BFsCL.NSHK74kvBoFicfBQIy3Yyje5dmpiU56'
WHERE "username" NOT IN ('aldo', 'memo', 'eve', 'nico', 'emi', 'vlad', 'artur', 'franco');
--> statement-breakpoint

-- 3. Drop any still-pending invitation issued under the old roster — an
-- unexpired invite link is a live path to creating an editor account, so
-- it shouldn't outlive the credential reset above. Used invitations
-- (used_at IS NOT NULL) are kept: those are audit trail, not access.
DELETE FROM "editor_invitations" WHERE "used_at" IS NULL;
