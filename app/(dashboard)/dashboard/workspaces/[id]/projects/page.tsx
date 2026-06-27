'use client';

import { use, useState } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, FolderOpen, Layers, Loader2 } from 'lucide-react';
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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage feature requests organized by project
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mobile App v2"
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project about?"
                  rows={3}
                />
              </div>
              <Button
                onClick={() =>
                  createProject.mutate({ name, description, workspaceId })
                }
                disabled={!name.trim() || createProject.isPending}
                className="w-full"
              >
                {createProject.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects?.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground border rounded-xl">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm mt-1">Create your first project to start tracking feature requests</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/workspaces/${workspaceId}/projects/${project.id}?org=${orgId}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    {project.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Layers className="w-4 h-4" />
                    {project._count.features} feature request
                    {project._count.features !== 1 ? 's' : ''}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}