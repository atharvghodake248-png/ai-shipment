'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, Layers, CheckSquare, Plus, Building2, GitPullRequest, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { PageLoader } from '@/components/shared/loading';
import { ErrorState } from '@/components/shared/error-boundary';
import { trpc } from '@/trpc/client';
import { CreateOrganizationDialog } from '@/components/shared/create-organization-dialog';
import Link from 'next/link';

function StatSkeleton() {
  return (
    <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24 bg-zinc-800" />
        <Skeleton className="h-9 w-9 rounded-xl bg-zinc-800" />
      </div>
      <Skeleton className="h-8 w-16 bg-zinc-800 mb-2" />
      <Skeleton className="h-3 w-32 bg-zinc-800" />
    </div>
  );
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  const { data: organizations, isLoading: orgsLoading, error: orgsError } = trpc.organization.list.useQuery();
  const currentOrgId = orgId || organizations?.[0]?.id;

  const { data: organization } = trpc.organization.getById.useQuery(
    { id: currentOrgId! },
    { enabled: !!currentOrgId }
  );

  const { data: workspaces, isLoading: workspacesLoading } = trpc.workspace.list.useQuery(
    { organizationId: currentOrgId! },
    { enabled: !!currentOrgId }
  );

  const firstWorkspaceId = workspaces?.[0]?.id;
  const { data: projects } = trpc.project.list.useQuery(
    { workspaceId: firstWorkspaceId! },
    { enabled: !!firstWorkspaceId }
  );

  const firstProjectId = projects?.[0]?.id;
  const { data: features } = trpc.feature.list.useQuery(
    { projectId: firstProjectId! },
    { enabled: !!firstProjectId }
  );

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

  if (orgsError) return (
    <div className="min-h-screen bg-[#09090B] p-8">
      <ErrorState title="Failed to load organizations" message={orgsError.message} />
    </div>
  );

  if (!organizations || organizations.length === 0) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-500/30">
            <Building2 className="h-9 w-9 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Welcome to ShipFlow AI</h2>
          <p className="text-zinc-400 leading-relaxed mb-8">Create your first organization to start shipping features faster with AI.</p>
          <Button onClick={() => setCreateOrgOpen(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl px-6 py-3 font-semibold shadow-xl shadow-violet-500/20 hover:-translate-y-0.5 transition-all">
            <Plus className="h-4 w-4 mr-2" />Create Organization
          </Button>
        </div>
        <CreateOrganizationDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
      </div>
    );
  }

  const org = organization || organizations.find((o) => o.id === currentOrgId);
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
    { title: 'Total Projects', value: totalProjects, icon: FolderKanban, description: `across ${workspaces?.length ?? 0} workspace(s)`, gradient: 'from-blue-600 to-cyan-600', glow: 'shadow-blue-500/20' },
    { title: 'Feature Requests', value: totalFeatures, icon: Layers, description: `${featuresByStatus.OPEN} open · ${featuresByStatus.IN_PROGRESS} in progress`, gradient: 'from-violet-600 to-purple-600', glow: 'shadow-violet-500/20' },
    { title: 'Tasks', value: totalTasks, icon: CheckSquare, description: `${doneTasks} done · ${inProgressTasks} in progress`, gradient: 'from-emerald-600 to-teal-600', glow: 'shadow-emerald-500/20' },
    { title: 'GitHub Repos', value: totalRepos, icon: GitPullRequest, description: 'connected repositories', gradient: 'from-orange-600 to-amber-600', glow: 'shadow-orange-500/20' },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{org?.name ? `${org.name}` : 'Dashboard'}</h1>
            <p className="text-zinc-400 mt-1">Overview of your product delivery activity</p>
          </div>
          {firstWorkspaceId && (
            <Link href={`/dashboard/workspaces/${firstWorkspaceId}/projects?org=${currentOrgId}`}>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl px-5 py-2.5 font-semibold shadow-xl shadow-violet-500/20 hover:-translate-y-0.5 transition-all">
                <Plus className="h-4 w-4 mr-2" />New Project
              </Button>
            </Link>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {workspacesLoading ? (
            [...Array(4)].map((_, i) => <StatSkeleton key={i} />)
          ) : (
            stats.map((stat) => (
              <div key={stat.title} className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl hover:border-zinc-700 hover:shadow-xl transition-all duration-300 p-6 group">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-zinc-400 font-medium">{stat.title}</p>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.glow} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <p className="text-xs text-zinc-500">{stat.description}</p>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Feature Status */}
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <h3 className="font-semibold text-white">Feature Status</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-6">Distribution by status</p>
            {totalFeatures === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">No feature requests yet</div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'Open', value: featuresByStatus.OPEN, color: 'bg-emerald-500' },
                  { label: 'In Progress', value: featuresByStatus.IN_PROGRESS, color: 'bg-blue-500' },
                  { label: 'Done', value: featuresByStatus.DONE, color: 'bg-violet-500' },
                  { label: 'Closed', value: featuresByStatus.CLOSED, color: 'bg-zinc-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">{item.label}</span>
                      <span className="text-sm font-semibold text-white">{item.value}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                      <div className={`${item.color} h-1.5 rounded-full transition-all duration-700`}
                        style={{ width: totalFeatures > 0 ? `${(item.value / totalFeatures) * 100}%` : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task Progress */}
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-white">Task Progress</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-6">Engineering task completion</p>
            {totalTasks === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">No tasks generated yet</div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'Todo', value: tasks?.filter((t) => t.status === 'TODO').length ?? 0, color: 'bg-zinc-500' },
                  { label: 'In Progress', value: inProgressTasks, color: 'bg-blue-500' },
                  { label: 'Done', value: doneTasks, color: 'bg-emerald-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">{item.label}</span>
                      <span className="text-sm font-semibold text-white">{item.value}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                      <div className={`${item.color} h-1.5 rounded-full transition-all duration-700`}
                        style={{ width: totalTasks > 0 ? `${(item.value / totalTasks) * 100}%` : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-white">Quick Actions</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-6">Jump to the most common tasks</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'View Projects', description: 'Browse all projects', icon: FolderKanban, href: firstWorkspaceId ? `/dashboard/workspaces/${firstWorkspaceId}/projects?org=${currentOrgId}` : '#', gradient: 'from-blue-600 to-cyan-600' },
              { label: 'GitHub Integration', description: 'Connect repositories', icon: GitPullRequest, href: firstWorkspaceId ? `/dashboard/workspaces/${firstWorkspaceId}/github?org=${currentOrgId}` : '#', gradient: 'from-violet-600 to-purple-600' },
              { label: 'AI Code Review', description: 'Review pull requests', icon: Sparkles, href: firstWorkspaceId ? `/dashboard/workspaces/${firstWorkspaceId}/github/review?org=${currentOrgId}` : '#', gradient: 'from-emerald-600 to-teal-600' },
            ].map((action) => (
              <Link key={action.label} href={action.href}>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all duration-200 cursor-pointer group">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{action.label}</p>
                    <p className="text-xs text-zinc-400">{action.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <CreateOrganizationDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
    </div>
  );
}