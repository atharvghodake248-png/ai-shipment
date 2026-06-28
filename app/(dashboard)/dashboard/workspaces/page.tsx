'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus, Loader2, ArrowRight, Calendar } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { CreateWorkspaceDialog } from '@/components/shared/create-workspace-dialog';

export default function WorkspacesPage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [createOpen, setCreateOpen] = useState(false);

  const { data: organization, isLoading: orgLoading } = trpc.organization.getById.useQuery(
    { id: orgId! }, { enabled: !!orgId }
  );
  const { data: workspaces, isLoading: wsLoading } = trpc.workspace.list.useQuery(
    { organizationId: orgId! }, { enabled: !!orgId }
  );

  if (!orgId) return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
          <FolderKanban className="w-7 h-7 text-zinc-600" />
        </div>
        <p className="text-zinc-400 font-medium">No Organization Selected</p>
        <p className="text-zinc-600 text-sm mt-1">Select one from the sidebar</p>
      </div>
    </div>
  );

  if (orgLoading || wsLoading) return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
    </div>
  );

  const canManage = organization?.role === 'OWNER' || organization?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
            <p className="text-zinc-500 mt-1">Manage workspaces for {organization?.name}</p>
          </div>
          {canManage && (
            <Button onClick={() => setCreateOpen(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl font-semibold shadow-xl shadow-violet-500/20 hover:-translate-y-0.5 transition-all">
              <Plus className="h-4 w-4 mr-2" />New Workspace
            </Button>
          )}
        </div>

        {workspaces && workspaces.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <div key={ws.id} className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FolderKanban className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{ws.name}</h3>
                      <p className="text-xs text-zinc-600">/{ws.slug}</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
                    {ws.description || 'No description provided'}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <Calendar className="w-3 h-3" />
                    Created {new Date(ws.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="border-t border-zinc-800 px-6 py-3">
                  <Link href={`/dashboard/workspaces/${ws.id}?org=${orgId}`}
                    className="flex items-center justify-between text-sm text-zinc-400 hover:text-violet-400 transition-colors group/link">
                    <span>View Details</span>
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <FolderKanban className="w-9 h-9 text-zinc-700" />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-semibold text-lg mb-1">No workspaces yet</p>
              <p className="text-zinc-600 text-sm">Create your first workspace to get started</p>
            </div>
            {canManage && (
              <Button onClick={() => setCreateOpen(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl mt-2">
                <Plus className="h-4 w-4 mr-2" />Create Workspace
              </Button>
            )}
          </div>
        )}
      </div>
      {orgId && <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} organizationId={orgId} />}
    </div>
  );
}