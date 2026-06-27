-- CreateTable
CREATE TABLE "prds" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prds_featureId_key" ON "prds"("featureId");

-- AddForeignKey
ALTER TABLE "prds" ADD CONSTRAINT "prds_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "feature_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
