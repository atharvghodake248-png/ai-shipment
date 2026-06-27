'use client';

import { use, useState } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, ArrowLeft, Loader2, Inbox } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ProjectPageProps {
  params: Promise<{ id: string; projectId: string }>;
}

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700 border-green-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  DONE: 'bg-purple-100 text-purple-700 border-purple-200',
  CLOSED: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id: workspaceId, projectId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [customer, setCustomer] = useState('');

  const { data: project, isLoading: projectLoading } = trpc.project.getById.useQuery({ id: projectId });
  const { data: features, isLoading: featuresLoading, refetch } = trpc.feature.list.useQuery({ projectId });

  const createFeature = trpc.feature.create.useMutation({
    onSuccess: () => {
      refetch();
      setOpen(false);
      setTitle('');
      setDescription('');
      setCustomer('');
      setPriority('MEDIUM');
    },
  });

  const deleteFeature = trpc.feature.delete.useMutation({ onSuccess: refetch });

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/workspaces/${workspaceId}/projects?org=${orgId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Projects
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{project?.name}</h1>
          {project?.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Feature Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Feature Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Add dark mode support"
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the feature request in detail..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(v) => setPriority(v as typeof priority)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Customer (optional)</Label>
                  <Input
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="Customer name"
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  createFeature.mutate({
                    title,
                    description,
                    priority,
                    projectId,
                    customer: customer || undefined,
                  })
                }
                disabled={!title.trim() || !description.trim() || createFeature.isPending}
                className="w-full"
              >
                {createFeature.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Feature Request'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {featuresLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : features?.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground border rounded-xl">
          <Inbox className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No feature requests yet</p>
          <p className="text-sm mt-1">Add your first feature request to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {features?.map((feature) => (
            <Card key={feature.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-base font-semibold">{feature.title}</CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={PRIORITY_STYLES[feature.priority]} variant="outline">
                      {feature.priority}
                    </Badge>
                    <Badge className={STATUS_STYLES[feature.status]} variant="outline">
                      {feature.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
                <div className="flex items-center justify-between mt-3">
                  {feature.customer ? (
                    <span className="text-xs text-muted-foreground">
                      Customer: {feature.customer}
                    </span>
                  ) : (
                    <span />
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Link
                      href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}/features/${feature.id}/clarify?org=${orgId}`}
                    >
                      <Button variant="outline" size="sm" className="text-xs">
                        🤖 Clarify with AI
                      </Button>
                    </Link>
                    <Link
                      href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}/features/${feature.id}/prd?org=${orgId}`}
                    >
                      <Button variant="outline" size="sm" className="text-xs">
                        📄 View PRD
                      </Button>
                    </Link>
                    <Link
                      href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}/features/${feature.id}/tasks?org=${orgId}`}
                    >
                      <Button variant="outline" size="sm" className="text-xs">
                        📋 Tasks
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive text-xs"
                      onClick={() => deleteFeature.mutate({ id: feature.id })}
                      disabled={deleteFeature.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}