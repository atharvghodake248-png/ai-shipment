-- AlterTable
ALTER TABLE "repositories" ADD COLUMN     "webhookSecret" TEXT;

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "repoFullName" TEXT NOT NULL,
    "prNumber" INTEGER NOT NULL,
    "prTitle" TEXT NOT NULL,
    "prUrl" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewId" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_reviews" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "prNumber" INTEGER NOT NULL,
    "repoFullName" TEXT NOT NULL,
    "filesReviewed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_reviews_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "webhook_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
