/*
  Warnings:

  - You are about to drop the column `sessionToken` on the `session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `session` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "session_sessionToken_key";

-- AlterTable
ALTER TABLE "session" DROP COLUMN "sessionToken",
ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");
