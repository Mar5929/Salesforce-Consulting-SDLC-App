-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "metadata" JSONB;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
