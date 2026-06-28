'use client';

import { use, useState } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, FolderOpen, Layers, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ProjectsPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectsPage({ params }: ProjectsPageProps) {
  const { id: workspaceId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: projects, isLoading, refetch } = trpc.project.list.useQuery({ workspaceId });

  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      refetch();
      setOpen(false);
      setName('');
      setDescription('');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-zinc-400 mt-1">Manage feature requests organized by project</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <Button onClick={() => setOpen(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl font-semibold shadow-xl shadow-violet-500/20 hover:-translate-y-0.5 transition-all">
              <Plus className="w-4 h-4 mr-2" />New Project
            </Button>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Create Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-zinc-300 text-sm">Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mobile App v2"
                    className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:border-violet-500 focus:ring-violet-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-300 text-sm">Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this project about?"
                    rows={3}
                    className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:border-violet-500 focus:ring-violet-500/20 resize-none"
                  />
                </div>
                <Button
                  onClick={() => createProject.mutate({ name, description, workspaceId })}
                  disabled={!name.trim() || createProject.isPending}
                  className="w-full h-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createProject.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {createProject.isPending ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {projects?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <FolderOpen className="w-9 h-9 text-zinc-700" />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-semibold text-lg mb-1">No projects yet</p>
              <p className="text-zinc-500 text-sm">Create your first project to start tracking feature requests</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects?.map((project) => (
              <div key={project.id} className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 overflow-hidden group">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <FolderOpen className="h-5 w-5 text-violet-400" />
                    </div>
                    <h3 className="font-semibold text-white text-base">{project.name}</h3>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed line-clamp-2 mb-4">
                    {project.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Layers className="w-3.5 h-3.5" />
                    {project._count.features} feature request{project._count.features !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="border-t border-zinc-800 px-6 py-3">
                  <Link
                    href={`/dashboard/workspaces/${workspaceId}/projects/${project.id}?org=${orgId}`}
                    className="flex items-center justify-between text-sm text-zinc-300 hover:text-violet-400 transition-colors group/link"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}