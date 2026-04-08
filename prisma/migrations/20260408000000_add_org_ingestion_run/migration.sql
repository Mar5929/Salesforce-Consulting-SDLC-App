-- CreateTable
CREATE TABLE "OrgIngestionRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "SyncRunStatus" NOT NULL DEFAULT 'PENDING',
    "currentPhase" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OrgIngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgIngestionRun_projectId_startedAt_idx" ON "OrgIngestionRun"("projectId", "startedAt");

-- AddForeignKey
ALTER TABLE "OrgIngestionRun" ADD CONSTRAINT "OrgIngestionRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
