ALTER TABLE "email_verification_token" ADD COLUMN "token" varchar(256);--> statement-breakpoint
ALTER TABLE "email_verification_token" DROP COLUMN IF EXISTS "email";