'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FolderKanban, Settings, Calendar, FileText } from 'lucide-react';
import { trpc } from '@/trpc/client';

interface WorkspacePageProps {
  params: Promise<{ id: string }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');

  const { data: workspace, isLoading } = trpc.workspace.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Workspace Not Found</h1>
          <p className="text-muted-foreground">
            The workspace you are looking for does not exist or you do not have access.
          </p>
        </div>
      </div>
    );
  }

  const canManage = workspace.role === 'OWNER' || workspace.role === 'ADMIN';

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderKanban className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{workspace.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline">/{workspace.slug}</Badge>
                <span className="text-sm text-muted-foreground">
                  {workspace.organization.name}
                </span>
              </div>
            </div>
          </div>
          {canManage && (
            <Button variant="outline" asChild>
              <a href={`/dashboard/workspaces/${id}/settings?org=${orgId}`}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </a>
            </Button>
          )}
        </div>

        {workspace.description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{workspace.description}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Shipments</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Transit</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Delivered</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Savings</CardDescription>
              <CardTitle className="text-2xl">$0</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{new Date(workspace.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last updated</span>
                <span className="font-medium">{new Date(workspace.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Activity will appear here as you use this workspace</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
