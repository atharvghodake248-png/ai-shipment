// @ts-nocheck
'use client';
import { use, useState } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Rocket, FileText, ListTodo } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ApprovePage({ params }) {
  const { id: workspaceId, projectId, featureId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const router = useRouter();
  const [note, setNote] = useState('');
  const [decision, setDecision] = useState(null);

  const { data: feature, isLoading } = trpc.feature.getById.useQuery({ id: featureId });
  const { data: tasks } = trpc.task.list.useQuery({ featureId });
  const updateStatus = trpc.feature.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      const approved = vars.status === 'DONE';
      setDecision(approved ? 'approved' : 'rejected');
      toast.success(approved ? '🚀 Feature approved and shipped!' : '❌ Feature rejected');
      setTimeout(() => router.push('/dashboard/workspaces/' + workspaceId + '/projects/' + projectId + '?org=' + orgId), 1500);
    },
  });

  const doneTasks = tasks?.filter(t => t.status === 'DONE').length || 0;
  const totalTasks = tasks?.length || 0;

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={'/dashboard/workspaces/' + workspaceId + '/projects/' + projectId + '?org=' + orgId}>
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <h1 className="text-2xl font-bold">Human Approval</h1>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Awaiting Review</Badge>
      </div>

      <div className="space-y-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" /> Feature Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{feature?.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{feature?.description}</p>
            <div className="flex gap-2 mt-3">
              <Badge variant="outline">{feature?.priority}</Badge>
              <Badge variant="outline">{feature?.status}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="w-4 h-4" /> Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-100 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: totalTasks ? (doneTasks / totalTasks * 100) + '%' : '0%' }} />
              </div>
              <span className="text-sm font-medium">{doneTasks}/{totalTasks} done</span>
            </div>
            <div className="mt-3 space-y-1">
              {tasks?.map(t => (
                <div key={t.id} className="flex items-center gap-2 text-sm">
                  <div className={'w-2 h-2 rounded-full ' + (t.status === 'DONE' ? 'bg-green-500' : t.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-300')} />
                  <span className={t.status === 'DONE' ? 'line-through text-muted-foreground' : ''}>{t.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {feature?.aiClarification && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">AI Clarified Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feature.aiClarification}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reviewer Note (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note about your decision..." rows={3} />
          </CardContent>
        </Card>
      </div>

      {decision ? (
        <div className={'flex items-center justify-center gap-2 p-4 rounded-lg text-lg font-semibold ' + (decision === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
          {decision === 'approved' ? <><Rocket className="w-5 h-5" /> Feature Shipped! 🎉</> : <><XCircle className="w-5 h-5" /> Feature Rejected</>}
        </div>
      ) : (
        <div className="flex gap-4">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-base"
            onClick={() => updateStatus.mutate({ id: featureId, status: 'DONE' })}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
            Approve & Ship
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 h-12 text-base"
            onClick={() => updateStatus.mutate({ id: featureId, status: 'OPEN' })}
            disabled={updateStatus.isPending}
          >
            <XCircle className="w-5 h-5 mr-2" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}