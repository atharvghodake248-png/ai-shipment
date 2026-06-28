'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FolderKanban, Settings, Calendar, FileText, Package, Truck, CheckCircle2, DollarSign } from 'lucide-react';
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
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Workspace Not Found</h1>
          <p className="text-zinc-400 leading-relaxed">
            The workspace you are looking for does not exist or you do not have access.
          </p>
        </div>
      </div>
    );
  }

  const canManage = workspace.role === 'OWNER' || workspace.role === 'ADMIN';

  const stats = [
    { label: 'Shipments', value: '0', icon: Package, gradient: 'from-blue-600 to-cyan-600', glow: 'shadow-blue-500/20' },
    { label: 'In Transit', value: '0', icon: Truck, gradient: 'from-amber-600 to-orange-600', glow: 'shadow-amber-500/20' },
    { label: 'Delivered', value: '0', icon: CheckCircle2, gradient: 'from-emerald-600 to-teal-600', glow: 'shadow-emerald-500/20' },
    { label: 'Savings', value: '$0', icon: DollarSign, gradient: 'from-violet-600 to-purple-600', glow: 'shadow-violet-500/20' },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
              <FolderKanban className="h-7 w-7 text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">{workspace.name}</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 font-mono text-xs">/{workspace.slug}</Badge>
                <span className="text-sm text-zinc-400">{workspace.organization.name}</span>
              </div>
            </div>
          </div>
          {canManage && (
            <a href={`/dashboard/workspaces/${id}/settings?org=${orgId}`}>
              <Button variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl">
                <Settings className="mr-2 h-4 w-4" />Settings
              </Button>
            </a>
          )}
        </div>

        {/* Description */}
        {workspace.description && (
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl p-6 mb-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Description</p>
            <p className="text-zinc-300 leading-relaxed">{workspace.description}</p>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl hover:border-zinc-700 transition-all duration-300 p-6 group">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-zinc-400 font-medium">{stat.label}</p>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.glow} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Timeline & Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <h2 className="font-semibold text-white text-sm">Timeline</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800/50">
                <span className="text-sm text-zinc-400">Created</span>
                <span className="text-sm font-medium text-white">{new Date(workspace.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-400">Last updated</span>
                <span className="text-sm font-medium text-white">{new Date(workspace.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
              <FileText className="h-4 w-4 text-zinc-400" />
              <h2 className="font-semibold text-white text-sm">Activity</h2>
            </div>
            <div className="p-10 text-center">
              <FileText className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
              <p className="text-zinc-300 font-medium text-sm">No recent activity</p>
              <p className="text-zinc-500 text-xs mt-1">Activity will appear here as you use this workspace</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}