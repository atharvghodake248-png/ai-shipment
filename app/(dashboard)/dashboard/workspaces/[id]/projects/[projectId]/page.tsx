'use client';

import { use, useState } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, ArrowLeft, Loader2, Inbox, Bot, FileText, CheckSquare, Rocket, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ProjectPageProps {
  params: Promise<{ id: string; projectId: string }>;
}

const PRIORITY_CONFIG: Record<string, { style: string; dot: string }> = {
  LOW:      { style: 'bg-zinc-800 text-zinc-400 border-zinc-700',          dot: 'bg-zinc-500' },
  MEDIUM:   { style: 'bg-blue-500/10 text-blue-400 border-blue-500/30',    dot: 'bg-blue-400' },
  HIGH:     { style: 'bg-amber-500/10 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
  CRITICAL: { style: 'bg-rose-500/10 text-rose-400 border-rose-500/30',    dot: 'bg-rose-400' },
};

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'DONE', 'CLOSED'];

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id: workspaceId, projectId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [customer, setCustomer] = useState('');

  const { data: project, isLoading: projectLoading } = trpc.project.getById.useQuery(
    { id: projectId },
    { enabled: !!projectId }
  );
  const { data: features, isLoading: featuresLoading, refetch } = trpc.feature.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

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
  const updateStatus = trpc.feature.updateStatus.useMutation({ onSuccess: refetch });

  if (projectLoading) return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
    </div>
  );

  const base = `/dashboard/workspaces/${workspaceId}/projects/${projectId}/features`;

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/dashboard/workspaces/${workspaceId}/projects?org=${orgId}`}>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-1" />Projects
            </Button>
          </Link>
        </div>

        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project?.name}</h1>
            {project?.description && <p className="text-zinc-500 mt-1">{project.description}</p>}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl font-semibold shadow-xl shadow-violet-500/20 hover:-translate-y-0.5 transition-all">
                <Plus className="w-4 h-4 mr-2" />New Feature Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">New Feature Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-sm">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Add dark mode support"
                    className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:border-violet-500" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-sm">Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the feature request in detail..."
                    rows={4}
                    className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:border-violet-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-sm">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-sm">Customer (optional)</Label>
                    <Input value={customer} onChange={(e) => setCustomer(e.target.value)}
                      placeholder="Customer name"
                      className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:border-violet-500" />
                  </div>
                </div>
                <Button
                  onClick={() => createFeature.mutate({ title, description, priority: priority as any, projectId, customer: customer || undefined })}
                  disabled={!title.trim() || !description.trim() || createFeature.isPending}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl font-semibold">
                  {createFeature.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                    : 'Create Feature Request'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {featuresLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        ) : features?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Inbox className="w-9 h-9 text-zinc-700" />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-semibold text-lg">No feature requests yet</p>
              <p className="text-zinc-600 text-sm mt-1">Click &quot;New Feature Request&quot; to add your first one</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {features?.map((feature) => {
              const pc = PRIORITY_CONFIG[feature.priority] || PRIORITY_CONFIG.MEDIUM;
              return (
                <div key={feature.id} className="rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all duration-200 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${pc.dot}`} />
                        <h3 className="font-semibold text-white text-sm truncate">{feature.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`${pc.style} border text-xs`}>{feature.priority}</Badge>
                        <Select value={feature.status} onValueChange={(v) => updateStatus.mutate({ id: feature.id, status: v })}>
                          <SelectTrigger className="h-7 w-32 text-xs bg-zinc-800 border-zinc-700 text-zinc-300 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                            {STATUS_OPTIONS.map(s => (
                              <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4 leading-relaxed pl-4">{feature.description}</p>
                    <div className="flex items-center justify-between">
                      {feature.customer
                        ? <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-1 rounded-lg">👤 {feature.customer}</span>
                        : <span />}
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { href: `${base}/${feature.id}/clarify`, icon: <Bot className="w-3 h-3" />, label: 'Clarify AI', style: 'bg-violet-600/10 text-violet-400 border-violet-500/20 hover:bg-violet-600/20' },
                          { href: `${base}/${feature.id}/prd`, icon: <FileText className="w-3 h-3" />, label: 'PRD', style: 'bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600/20' },
                          { href: `${base}/${feature.id}/tasks`, icon: <CheckSquare className="w-3 h-3" />, label: 'Tasks', style: 'bg-amber-600/10 text-amber-400 border-amber-500/20 hover:bg-amber-600/20' },
                          { href: `${base}/${feature.id}/approve`, icon: <Rocket className="w-3 h-3" />, label: 'Approve', style: 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600/20' },
                        ].map((action) => (
                          <Link key={action.label} href={`${action.href}?org=${orgId}`}>
                            <button className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${action.style}`}>
                              {action.icon}{action.label}
                            </button>
                          </Link>
                        ))}
                        <button
                          onClick={() => deleteFeature.mutate({ id: feature.id })}
                          disabled={deleteFeature.isPending}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-rose-500/20 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 transition-all">
                          <Trash2 className="w-3 h-3" />Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}