-- AlterTable
ALTER TABLE "webhook_events" ADD COLUMN     "featureId" TEXT;

-- AlterTable
ALTER TABLE "webhook_reviews" ADD COLUMN     "blockingIssues" TEXT,
ADD COLUMN     "nonBlockingIssues" TEXT,
ADD COLUMN     "verdict" TEXT;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "feature_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
