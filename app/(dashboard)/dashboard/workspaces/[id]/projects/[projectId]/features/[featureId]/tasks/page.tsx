'use client';

import { use, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Sparkles, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface TasksPageProps {
  params: Promise<{ id: string; projectId: string; featureId: string }>;
}

const COLUMNS = [
  { id: 'TODO', label: 'Todo', emoji: '📋', border: 'border-zinc-700', bg: 'bg-zinc-800/30', dot: 'bg-zinc-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', emoji: '🔄', border: 'border-blue-500/30', bg: 'bg-blue-500/5', dot: 'bg-blue-400' },
  { id: 'DONE', label: 'Done', emoji: '✅', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', dot: 'bg-emerald-400' },
];

export default function TasksPage({ params }: TasksPageProps) {
  const { id: workspaceId, projectId, featureId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const { data: feature } = trpc.feature.getById.useQuery({ id: featureId });
  const { data: tasks, isLoading, refetch } = trpc.task.list.useQuery({ featureId });

  const generateTasks = trpc.task.generate.useMutation({
    onSuccess: () => { refetch(); toast.success('Tasks generated!'); },
    onError: () => toast.error('Failed to generate tasks'),
  });

  const updateStatus = trpc.task.updateStatus.useMutation({ onSuccess: refetch });
  const deleteTask = trpc.task.delete.useMutation({ onSuccess: refetch });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggingId) { updateStatus.mutate({ id: draggingId, status: status as 'TODO' | 'IN_PROGRESS' | 'DONE' }); setDraggingId(null); }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const tasksByStatus = (status: string) => tasks?.filter((t) => t.status === status) || [];

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}?org=${orgId}`}>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-1" />Back to Project
            </Button>
          </Link>
        </div>

        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Engineering Tasks</h1>
            {feature && <p className="text-zinc-400 text-sm mt-1">{feature.title}</p>}
          </div>
          <Button onClick={() => generateTasks.mutate({ featureId })} disabled={generateTasks.isPending}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl font-semibold shadow-xl shadow-violet-500/20 hover:-translate-y-0.5 transition-all">
            {generateTasks.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />{tasks?.length ? 'Regenerate' : 'Generate Tasks'}</>}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
            <p className="text-zinc-400 text-sm">Loading tasks...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map((col) => {
              const colTasks = tasksByStatus(col.id);
              return (
                <div key={col.id} className={`rounded-2xl border-2 ${col.border} ${col.bg} p-4 min-h-[500px] transition-all duration-200`}
                  onDrop={(e) => handleDrop(e, col.id)} onDragOver={handleDragOver}>
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <h2 className="font-semibold text-sm text-zinc-200">{col.emoji} {col.label}</h2>
                    </div>
                    <span className="text-xs bg-zinc-800 border border-zinc-700 rounded-full px-2.5 py-0.5 text-zinc-400 font-medium">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {colTasks.map((task) => (
                      <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`rounded-xl bg-zinc-900 border border-zinc-800 p-4 cursor-grab active:cursor-grabbing hover:border-zinc-700 hover:shadow-lg transition-all duration-200 ${draggingId === task.id ? 'opacity-40 scale-95' : 'opacity-100'}`}>
                        <p className="text-sm font-medium text-white mb-1">{task.title}</p>
                        {task.description && <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{task.description}</p>}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {col.id !== 'TODO' && (
                              <Button variant="ghost" size="sm" className="text-xs h-6 w-6 p-0 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg"
                                onClick={() => updateStatus.mutate({ id: task.id, status: col.id === 'IN_PROGRESS' ? 'TODO' : 'IN_PROGRESS' })}>
                                <ChevronLeft className="w-3 h-3" />
                              </Button>
                            )}
                            {col.id !== 'DONE' && (
                              <Button variant="ghost" size="sm" className="text-xs h-6 w-6 p-0 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg"
                                onClick={() => updateStatus.mutate({ id: task.id, status: col.id === 'TODO' ? 'IN_PROGRESS' : 'DONE' })}>
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            onClick={() => deleteTask.mutate({ id: task.id })}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {colTasks.length === 0 && (
                      <div className="text-center py-12 text-xs text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
                        Drop tasks here
                      </div>
                    )}
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