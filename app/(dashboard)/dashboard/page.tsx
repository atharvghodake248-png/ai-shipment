'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderKanban,
  Layers,
  CheckSquare,
  FileText,
  Plus,
  Building2,
  GitPullRequest,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { PageLoader } from '@/components/shared/loading';
import { ErrorState } from '@/components/shared/error-boundary';
import { trpc } from '@/trpc/client';
import { CreateOrganizationDialog } from '@/components/shared/create-organization-dialog';
import Link from 'next/link';

function StatSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-20 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  const { data: organizations, isLoading: orgsLoading, error: orgsError } = trpc.organization.list.useQuery();
  const currentOrgId = orgId || organizations?.[0]?.id;

  const { data: organization, isLoading: orgLoading } = trpc.organization.getById.useQuery(
    { id: currentOrgId! },
    { enabled: !!currentOrgId }
  );

  const { data: workspaces, isLoading: workspacesLoading } = trpc.workspace.list.useQuery(
    { organizationId: currentOrgId! },
    { enabled: !!currentOrgId }
  );

  // Fetch projects for all workspaces
  const firstWorkspaceId = workspaces?.[0]?.id;
  const { data: projects } = trpc.project.list.useQuery(
    { workspaceId: firstWorkspaceId! },
    { enabled: !!firstWorkspaceId }
  );

  // Fetch features for first project
  const firstProjectId = projects?.[0]?.id;
  const { data: features } = trpc.feature.list.useQuery(
    { projectId: firstProjectId! },
    { enabled: !!firstProjectId }
  );

  // Fetch tasks for first feature
  const firstFeatureId = features?.[0]?.id;
  const { data: tasks } = trpc.task.list.useQuery(
    { featureId: firstFeatureId! },
    { enabled: !!firstFeatureId }
  );

  const { data: connectedRepos } = trpc.github.listConnectedRepos.useQuery(
    { workspaceId: firstWorkspaceId! },
    { enabled: !!firstWorkspaceId }
  );

  if (orgsLoading) return <PageLoader />;

  if (orgsError) {
    return (
      <div className="p-8">
        <ErrorState title="Failed to load organizations" message={orgsError.message} />
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="p-8">
        <Card className="max-w-lg mx-auto text-center border-dashed">
          <CardContent className="py-16">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Welcome to ShipFlow AI</h2>
            <p className="text-muted-foreground mb-6">
              Create your first organization to get started.
            </p>
            <Button onClick={() => setCreateOrgOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
        <CreateOrganizationDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
      </div>
    );
  }

  const org = organization || organizations.find((o) => o.id === currentOrgId);

  // Compute stats
  const totalProjects = projects?.length ?? 0;
  const totalFeatures = features?.length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const doneTasks = tasks?.filter((t) => t.status === 'DONE').length ?? 0;
  const inProgressTasks = tasks?.filter((t) => t.status === 'IN_PROGRESS').length ?? 0;
  const totalRepos = connectedRepos?.length ?? 0;

  const featuresByStatus = {
    OPEN: features?.filter((f) => f.status === 'OPEN').length ?? 0,
    IN_PROGRESS: features?.filter((f) => f.status === 'IN_PROGRESS').length ?? 0,
    DONE: features?.filter((f) => f.status === 'DONE').length ?? 0,
    CLOSED: features?.filter((f) => f.status === 'CLOSED').length ?? 0,
  };

  const stats = [
    {
      title: 'Total Projects',
      value: totalProjects,
      icon: FolderKanban,
      description: `across ${workspaces?.length ?? 0} workspace(s)`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Feature Requests',
      value: totalFeatures,
      icon: Layers,
      description: `${featuresByStatus.OPEN} open · ${featuresByStatus.IN_PROGRESS} in progress`,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Tasks',
      value: totalTasks,
      icon: CheckSquare,
      description: `${doneTasks} done · ${inProgressTasks} in progress`,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'GitHub Repos',
      value: totalRepos,
      icon: GitPullRequest,
      description: 'connected repositories',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {org?.name ? `${org.name} Dashboard` : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your product management activity.
          </p>
        </div>
        {firstWorkspaceId && (
          <Link href={`/dashboard/workspaces/${firstWorkspaceId}/projects?org=${currentOrgId}`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {workspacesLoading ? (
          [...Array(4)].map((_, i) => <StatSkeleton key={i} />)
        ) : (
          stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Feature Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Feature Status Breakdown
            </CardTitle>
            <CardDescription>Distribution of feature requests by status</CardDescription>
          </CardHeader>
          <CardContent>
            {totalFeatures === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No feature requests yet
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Open', value: featuresByStatus.OPEN, color: 'bg-green-500' },
                  { label: 'In Progress', value: featuresByStatus.IN_PROGRESS, color: 'bg-blue-500' },
                  { label: 'Done', value: featuresByStatus.DONE, color: 'bg-purple-500' },
                  { label: 'Closed', value: featuresByStatus.CLOSED, color: 'bg-gray-400' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all`}
                        style={{
                          width: totalFeatures > 0 ? `${(item.value / totalFeatures) * 100}%` : '0%',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              Task Progress
            </CardTitle>
            <CardDescription>Engineering task completion status</CardDescription>
          </CardHeader>
          <CardContent>
            {totalTasks === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No tasks generated yet
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Todo', value: tasks?.filter((t) => t.status === 'TODO').length ?? 0, color: 'bg-slate-400' },
                  { label: 'In Progress', value: inProgressTasks, color: 'bg-blue-500' },
                  { label: 'Done', value: doneTasks, color: 'bg-green-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all`}
                        style={{
                          width: totalTasks > 0 ? `${(item.value / totalTasks) * 100}%` : '0%',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>Jump to the most common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              {
                label: 'View Projects',
                description: 'Browse all projects',
                icon: FolderKanban,
                href: firstWorkspaceId
                  ? `/dashboard/workspaces/${firstWorkspaceId}/projects?org=${currentOrgId}`
                  : '#',
              },
              {
                label: 'GitHub Integration',
                description: 'Connect repositories',
                icon: GitPullRequest,
                href: firstWorkspaceId
                  ? `/dashboard/workspaces/${firstWorkspaceId}/github?org=${currentOrgId}`
                  : '#',
              },
              {
                label: 'AI Code Review',
                description: 'Review pull requests',
                icon: Sparkles,
                href: firstWorkspaceId
                  ? `/dashboard/workspaces/${firstWorkspaceId}/github/review?org=${currentOrgId}`
                  : '#',
              },
            ].map((action) => (
              <Link key={action.label} href={action.href}>
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <action.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Org Info */}
      {org && (
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                {org.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{org.name}</p>
                <p className="text-sm text-muted-foreground">
                  {org.workspaceCount} workspace(s) · {org.memberCount} member(s) · {org.role} role
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateOrganizationDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
    </div>
  );
}