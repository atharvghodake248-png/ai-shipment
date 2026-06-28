// @ts-nocheck
'use client';

import { use, useState } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Rocket, FileText, ListTodo, Sparkles } from 'lucide-react';
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
  const completionPct = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

  if (isLoading) return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href={'/dashboard/workspaces/' + workspaceId + '/projects/' + projectId + '?org=' + orgId}>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-1" />Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Human Approval</h1>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs mt-0.5">Awaiting Review</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {/* Feature Info */}
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h2 className="font-semibold text-white text-sm">Feature Request</h2>
            </div>
            <div className="p-5">
              <p className="font-semibold text-white text-base mb-2">{feature?.title}</p>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4">{feature?.description}</p>
              <div className="flex gap-2">
                <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">{feature?.priority}</Badge>
                <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">{feature?.status}</Badge>
              </div>
            </div>
          </div>

          {/* Task Completion */}
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-emerald-400" />
                <h2 className="font-semibold text-white text-sm">Task Completion</h2>
              </div>
              <span className="text-sm font-bold text-white">{doneTasks}/{totalTasks}</span>
            </div>
            <div className="p-5">
              <div className="w-full bg-zinc-800 rounded-full h-2 mb-5 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-700 shadow-lg shadow-emerald-500/30"
                  style={{ width: `${completionPct}%` }} />
              </div>
              <div className="space-y-2">
                {tasks?.map(t => (
                  <div key={t.id} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'DONE' ? 'bg-emerald-400' : t.status === 'IN_PROGRESS' ? 'bg-blue-400' : 'bg-zinc-600'}`} />
                    <span className={t.status === 'DONE' ? 'line-through text-zinc-600' : 'text-zinc-300'}>{t.title}</span>
                    {t.status === 'DONE' && <CheckCircle className="w-3 h-3 text-emerald-500 ml-auto shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Clarification */}
          {feature?.aiClarification && (
            <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl overflow-hidden">
              <div className="p-5 border-b border-zinc-800">
                <h2 className="font-semibold text-white text-sm">AI Clarified Requirements</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-zinc-500 whitespace-pre-wrap leading-relaxed">{feature.aiClarification}</p>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800">
              <h2 className="font-semibold text-white text-sm">Reviewer Note <span className="text-zinc-600 font-normal">(optional)</span></h2>
            </div>
            <div className="p-5">
              <Textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Add a note about your decision..."
                rows={3}
                className="bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600 rounded-xl focus:border-violet-500 resize-none" />
            </div>
          </div>
        </div>

        {/* Decision */}
        {decision ? (
          <div className={`flex items-center justify-center gap-3 p-6 rounded-2xl text-lg font-bold ${decision === 'approved' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'}`}>
            {decision === 'approved' ? <><Rocket className="w-6 h-6" />Feature Shipped! 🎉</> : <><XCircle className="w-6 h-6" />Feature Rejected</>}
          </div>
        ) : (
          <div className="flex gap-3">
            <Button className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white h-13 text-base font-semibold rounded-xl shadow-xl shadow-emerald-500/20 hover:-translate-y-0.5 transition-all"
              onClick={() => updateStatus.mutate({ id: featureId, status: 'DONE' })}
              disabled={updateStatus.isPending}>
              {updateStatus.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
              Approve & Ship
            </Button>
            <Button className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 h-13 text-base font-semibold rounded-xl transition-all"
              onClick={() => updateStatus.mutate({ id: featureId, status: 'OPEN' })}
              disabled={updateStatus.isPending}>
              <XCircle className="w-5 h-5 mr-2" />Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}