'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2, Settings, Mail } from 'lucide-react';
import { trpc } from '@/trpc/client';

const roleColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OWNER: 'default',
  ADMIN: 'secondary',
  MEMBER: 'outline',
};

export default function TeamPage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');

  const { data: organization, isLoading } = trpc.organization.getById.useQuery(
    { id: orgId! },
    { enabled: !!orgId }
  );

  const { data: pendingInvites } = trpc.organization.getPendingInvitations.useQuery(undefined, {
    enabled: !!orgId,
  });

  if (!orgId) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Organization Selected</h1>
          <p className="text-muted-foreground">
            Select an organization from the sidebar to view team members.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Organization Not Found</h1>
          <p className="text-muted-foreground">
            The organization you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const canManage = organization.role === 'OWNER' || organization.role === 'ADMIN';

  const orgInvites = pendingInvites?.filter((i) => i.organizationId === orgId) || [];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Team</h1>
            <p className="text-muted-foreground">{organization.name} team members</p>
          </div>
          {canManage && (
            <Button asChild>
              <Link href={`/dashboard/settings?org=${orgId}`}>
                <Settings className="mr-2 h-4 w-4" />
                Manage Team
              </Link>
            </Button>
          )}
        </div>

        {/* Pending Invitations */}
        {orgInvites.length > 0 && canManage && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Pending Invitations
              </CardTitle>
              <CardDescription>Invitations waiting for acceptance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orgInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited as{' '}
                        <Badge variant={roleColors[invite.role]}>{invite.role}</Badge>
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Members ({organization.memberships.length})</CardTitle>
            <CardDescription>People with access to this organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organization.memberships.map((membership) => (
                <div
                  key={membership.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold">
                      {membership.user.name?.[0]?.toUpperCase() || membership.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{membership.user.name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{membership.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={roleColors[membership.role]}>{membership.role}</Badge>
                    <div className="text-sm text-muted-foreground">
                      Joined {new Date(membership.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
