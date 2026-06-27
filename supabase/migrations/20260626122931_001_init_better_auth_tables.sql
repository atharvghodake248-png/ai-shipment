-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User table
CREATE TABLE "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Session table
CREATE TABLE "session" (
  "id" TEXT PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Account table
CREATE TABLE "account" (
  "id" TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "account_providerId_accountId_unique" UNIQUE ("providerId", "accountId")
);

-- Verification table
CREATE TABLE "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "verification_identifier_value_unique" UNIQUE ("identifier", "value")
);

-- Enable RLS
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;

-- RLS policies for user table
CREATE POLICY "select_own_user" ON "user" FOR SELECT
  TO authenticated USING (auth.uid()::text = id);
CREATE POLICY "insert_own_user" ON "user" FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = id);
CREATE POLICY "update_own_user" ON "user" FOR UPDATE
  TO authenticated USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);

-- RLS policies for session table
CREATE POLICY "select_own_sessions" ON "session" FOR SELECT
  TO authenticated USING (auth.uid()::text = "userId");
CREATE POLICY "insert_own_sessions" ON "session" FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "update_own_sessions" ON "session" FOR UPDATE
  TO authenticated USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "delete_own_sessions" ON "session" FOR DELETE
  TO authenticated USING (auth.uid()::text = "userId");

-- RLS policies for account table
CREATE POLICY "select_own_accounts" ON "account" FOR SELECT
  TO authenticated USING (auth.uid()::text = "userId");
CREATE POLICY "insert_own_accounts" ON "account" FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "update_own_accounts" ON "account" FOR UPDATE
  TO authenticated USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "delete_own_accounts" ON "account" FOR DELETE
  TO authenticated USING (auth.uid()::text = "userId");

-- RLS policies for verification table (public access for verification flows)
CREATE POLICY "select_verifications" ON "verification" FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_verifications" ON "verification" FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "delete_verifications" ON "verification" FOR DELETE
  TO anon, authenticated USING (true);