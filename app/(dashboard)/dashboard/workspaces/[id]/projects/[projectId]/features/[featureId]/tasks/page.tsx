'use client';

import { use, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Sparkles, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface TasksPageProps {
  params: Promise<{ id: string; projectId: string; featureId: string }>;
}

const COLUMNS = [
  { id: 'TODO', label: '📋 Todo', color: 'bg-slate-50 border-slate-200' },
  { id: 'IN_PROGRESS', label: '🔄 In Progress', color: 'bg-blue-50 border-blue-200' },
  { id: 'DONE', label: '✅ Done', color: 'bg-green-50 border-green-200' },
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
    if (draggingId) {
      updateStatus.mutate({ id: draggingId, status: status as 'TODO' | 'IN_PROGRESS' | 'DONE' });
      setDraggingId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const tasksByStatus = (status: string) =>
    tasks?.filter((t) => t.status === status) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}?org=${orgId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Project
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Engineering Tasks</h1>
          {feature && <p className="text-muted-foreground mt-1">{feature.title}</p>}
        </div>
        <Button
          onClick={() => generateTasks.mutate({ featureId })}
          disabled={generateTasks.isPending}
        >
          {generateTasks.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />{tasks?.length ? 'Regenerate Tasks' : 'Generate Tasks'}</>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className={`rounded-xl border-2 p-4 min-h-[400px] ${col.color}`}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm">{col.label}</h2>
                <span className="text-xs bg-white border rounded-full px-2 py-0.5 text-muted-foreground">
                  {tasksByStatus(col.id).length}
                </span>
              </div>

              <div className="space-y-3">
                {tasksByStatus(col.id).map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className={`cursor-grab active:cursor-grabbing transition-opacity ${
                      draggingId === task.id ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm font-medium mb-1">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mb-3">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {col.id !== 'TODO' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={() => updateStatus.mutate({
                                id: task.id,
                                status: col.id === 'IN_PROGRESS' ? 'TODO' : 'IN_PROGRESS',
                              })}
                            >
                              ←
                            </Button>
                          )}
                          {col.id !== 'DONE' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={() => updateStatus.mutate({
                                id: task.id,
                                status: col.id === 'TODO' ? 'IN_PROGRESS' : 'DONE',
                              })}
                            >
                              →
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => deleteTask.mutate({ id: task.id })}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {tasksByStatus(col.id).length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}