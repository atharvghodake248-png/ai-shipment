'use client';

import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Building2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/trpc/client';

export default function SettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');

  const { data: org } = trpc.organization.getById.useQuery(
    { id: orgId! },
    { enabled: !!orgId }
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{session?.user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{session?.user.email}</span>
            </div>
          </CardContent>
        </Card>

        {org && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{org.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug</span>
                <Badge variant="outline">/{org.slug}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{org.memberCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Role</span>
                <Badge>{org.role}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}