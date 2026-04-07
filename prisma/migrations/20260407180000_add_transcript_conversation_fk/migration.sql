-- AlterTable
ALTER TABLE "Transcript" ADD COLUMN "conversationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_conversationId_key" ON "Transcript"("conversationId");

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
