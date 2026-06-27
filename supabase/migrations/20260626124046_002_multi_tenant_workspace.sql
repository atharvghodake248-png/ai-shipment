-- Create enum type for organization role
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- Organization table
CREATE TABLE "organization" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_bytes(8)::TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "logo" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Membership table
CREATE TABLE "membership" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_bytes(8)::TEXT,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE,
  CONSTRAINT "membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE,
  CONSTRAINT "membership_organizationId_userId_unique" UNIQUE ("organizationId", "userId")
);

-- Workspace table
CREATE TABLE "workspace" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_bytes(8)::TEXT,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "workspace_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE,
  CONSTRAINT "workspace_organizationId_slug_unique" UNIQUE ("organizationId", "slug")
);

-- Invitation table
CREATE TABLE "invitation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_bytes(8)::TEXT,
  "organizationId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
  "token" TEXT NOT NULL UNIQUE,
  "invitedBy" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "acceptedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE,
  CONSTRAINT "invitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "user"("id") ON DELETE CASCADE,
  CONSTRAINT "invitation_organizationId_email_unique" UNIQUE ("organizationId", "email")
);

-- Enable RLS
ALTER TABLE "organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitation" ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization
CREATE POLICY "select_org_via_membership" ON "organization" FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "membership" m WHERE m."organizationId" = "organization".id AND m."userId" = auth.uid()::text)
  );

CREATE POLICY "insert_organization" ON "organization" FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_org_via_membership" ON "organization" FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "membership" m WHERE m."organizationId" = "organization".id AND m."userId" = auth.uid()::text AND m.role IN ('OWNER', 'ADMIN'))
  );

CREATE POLICY "delete_org_via_ownership" ON "organization" FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "membership" m WHERE m."organizationId" = "organization".id AND m."userId" = auth.uid()::text AND m.role = 'OWNER')
  );

-- RLS policies for membership
CREATE POLICY "select_own_memberships" ON "membership" FOR SELECT
  TO authenticated USING (
    "userId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "membership" m2 WHERE m2."organizationId" = "membership"."organizationId" AND m2."userId" = auth.uid()::text
    )
  );

CREATE POLICY "insert_membership" ON "membership" FOR INSERT
  TO authenticated WITH CHECK (
    "userId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "membership" m WHERE m."organizationId" = "membership"."organizationId" AND m."userId" = auth.uid()::text AND m.role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "update_membership" ON "membership" FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM "membership" m WHERE m."organizationId" = "membership"."organizationId" AND m."userId" = auth.uid()::text AND m.role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "delete_membership" ON "membership" FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM "membership" m WHERE m."organizationId" = "membership"."organizationId" AND m."userId" = auth.uid()::text AND m.role IN ('OWNER', 'ADMIN')
    )
  );

-- RLS policies for workspace
CREATE POLICY "select_workspace_via_membership" ON "workspace" FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM "membership" m WHERE m."organizationId" = "workspace"."organizationId" AND m."userId" = auth.uid()::text
    )
  );

CREATE POLICY "insert_workspace" ON "workspace" FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM "membership" m WHERE m."organizationId" = "workspace"."organizationId" AND m."userId" = auth.uid()::text AND m.role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "update_workspace" ON "workspace" FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM "membership" m WHERE m."organizationId" = "workspace"."organizationId" AND m."userId" = auth.uid()::text AND m.role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "delete_workspace" ON "workspace" FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM "membership" m WHERE m."organizationId" = "workspace"."organizationId" AND m."userId" = auth.uid()::text AND m.role IN ('OWNER', 'ADMIN')
    )
  );

-- RLS policies for invitation
CREATE POLICY "select_invitations" ON "invitation" FOR SELECT
  TO authenticated USING (
    "invitedBy" = auth.uid()::text
    OR EXISTS (SELECT 1 FROM "user" u WHERE u.email = "invitation".email AND u.id = auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM "membership" m WHERE m."organizationId" = "invitation"."organizationId" AND m."userId" = auth.uid()::text AND m.role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "insert_invitation" ON "invitation" FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM "membership" m WHERE m."organizationId" = "invitation"."organizationId" AND m."userId" = auth.uid()::text AND m.role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "update_invitation" ON "invitation" FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "user" u WHERE u.email = "invitation".email AND u.id = auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM "membership" m WHERE m."organizationId" = "invitation"."organizationId" AND m."userId" = auth.uid()::text AND m.role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "delete_invitation" ON "invitation" FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM "membership" m WHERE m."organizationId" = "invitation"."organizationId" AND m."userId" = auth.uid()::text AND m.role IN ('OWNER', 'ADMIN')
    )
  );