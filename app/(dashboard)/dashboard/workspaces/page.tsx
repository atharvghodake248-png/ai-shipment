'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, Plus, Loader2, Settings, ArrowRight } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { CreateWorkspaceDialog } from '@/components/shared/create-workspace-dialog';

export default function WorkspacesPage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: organization, isLoading: orgLoading } = trpc.organization.getById.useQuery(
    { id: orgId! },
    { enabled: !!orgId }
  );

  const { data: workspaces, isLoading: wsLoading } = trpc.workspace.list.useQuery(
    { organizationId: orgId! },
    { enabled: !!orgId }
  );

  if (!orgId) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Organization Selected</h1>
          <p className="text-muted-foreground">
            Select an organization from the sidebar to view its workspaces.
          </p>
        </div>
      </div>
    );
  }

  if (orgLoading || wsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canManage = organization?.role === 'OWNER' || organization?.role === 'ADMIN';

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Workspaces</h1>
            <p className="text-muted-foreground">Manage workspaces for {organization?.name}</p>
          </div>
          {canManage && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Workspace
            </Button>
          )}
        </div>

        {workspaces && workspaces.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <Card key={ws.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{ws.name}</CardTitle>
                        <CardDescription className="text-xs">/{ws.slug}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ws.description || 'No description provided'}
                  </p>
                  <div className="mt-4 flex items-center text-xs text-muted-foreground">
                    Created {new Date(ws.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <div className="flex items-center justify-between w-full">
                    <Link href={`/dashboard/workspaces/${ws.id}?org=${orgId}`}>
                      <Button variant="ghost" className="gap-2">
                        View Details
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    {canManage && (
                      <Link href={`/dashboard/workspaces/${ws.id}/settings?org=${orgId}`}>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="text-xl mb-2">No workspaces yet</CardTitle>
              <CardDescription className="text-center mb-4">
                Create your first workspace to start organizing shipments and projects
              </CardDescription>
              {canManage && (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workspace
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {orgId && (
        <CreateWorkspaceDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          organizationId={orgId}
        />
      )}
    </div>
  );
}
