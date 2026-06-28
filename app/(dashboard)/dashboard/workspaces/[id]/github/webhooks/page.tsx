'use client';

import { use, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Webhook, CheckCircle, XCircle, Clock, Eye, EyeOff, Zap } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface WebhooksPageProps {
  params: Promise<{ id: string }>;
}

function renderMarkdown(text: string) {
  return text
    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-semibold mt-4 mb-2 text-violet-400">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 list-disc text-zinc-300 text-sm">$1</li>')
    .replace(/`(.+?)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono text-violet-300">$1</code>')
    .replace(/\n\n/g, '<br/>');
}

const STATUS_CONFIG: Record<string, { style: string; icon: React.ReactNode; label: string }> = {
  PENDING: { style: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: <Clock className="w-3 h-3" />, label: 'Pending' },
  PROCESSING: { style: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'Processing' },
  COMPLETED: { style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: <CheckCircle className="w-3 h-3" />, label: 'Completed' },
  FAILED: { style: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: <XCircle className="w-3 h-3" />, label: 'Failed' },
};

export default function WebhooksPage({ params }: WebhooksPageProps) {
  const { id: workspaceId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [registeringRepo, setRegisteringRepo] = useState<string | null>(null);

  const { data: events, isLoading, refetch } = trpc.webhook.listEvents.useQuery({ workspaceId });
  const { data: connectedRepos } = trpc.github.listConnectedRepos.useQuery({ workspaceId });
  const { data: selectedReview } = trpc.webhook.getReview.useQuery({ reviewId: selectedReviewId! }, { enabled: !!selectedReviewId });

  const registerWebhook = trpc.webhook.register.useMutation({
    onSuccess: () => { toast.success('Webhook registered! PRs will now trigger automatic reviews.'); setRegisteringRepo(null); refetch(); },
    onError: (err) => { toast.error('Failed to register webhook: ' + err.message); setRegisteringRepo(null); },
  });

  const deleteWebhook = trpc.webhook.deleteWebhook.useMutation({
    onSuccess: () => { toast.success('Webhook removed'); refetch(); },
  });

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Link href={`/dashboard/workspaces/${workspaceId}/github?org=${orgId}`}>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-1" />Back to GitHub
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
            <Webhook className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">GitHub Webhooks</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Auto-trigger AI code reviews when pull requests are opened</p>
          </div>
        </div>

        {/* Connected Repos */}
        <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl mb-6 overflow-hidden">
          <div className="p-5 border-b border-zinc-800">
            <h2 className="font-semibold text-white">Connected Repositories</h2>
          </div>
          <div className="p-5">
            {!connectedRepos?.length ? (
              <p className="text-sm text-zinc-400 text-center py-4">No repositories connected yet.</p>
            ) : (
              <div className="space-y-3">
                {connectedRepos.map((repo) => (
                  <div key={repo.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                    <div>
                      <p className="text-sm font-medium text-white">{repo.fullName}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className={`w-2 h-2 rounded-full ${repo.webhookId ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                        <p className="text-xs text-zinc-500">{repo.webhookId ? 'Webhook active' : 'No webhook'}</p>
                      </div>
                    </div>
                    {repo.webhookId ? (
                      <Button variant="outline" size="sm" className="text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                        onClick={() => deleteWebhook.mutate({ repoFullName: repo.fullName, workspaceId })}
                        disabled={deleteWebhook.isPending}>
                        Remove Webhook
                      </Button>
                    ) : (
                      <Button size="sm" className="text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-lg font-medium"
                        disabled={registeringRepo === repo.fullName}
                        onClick={() => { setRegisteringRepo(repo.fullName); registerWebhook.mutate({ repoFullName: repo.fullName, workspaceId }); }}>
                        {registeringRepo === repo.fullName ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Registering...</> : <><Zap className="w-3 h-3 mr-1" />Enable Auto-Review</>}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Events & Review */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Events */}
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800">
              <h2 className="font-semibold text-white">Recent PR Events</h2>
            </div>
            <div className="p-5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                  <p className="text-zinc-400 text-sm">Loading events...</p>
                </div>
              ) : !events?.length ? (
                <div className="text-center py-12 text-zinc-400 text-sm leading-relaxed">
                  No webhook events yet.<br />Enable auto-review on a repo and open a PR.
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => {
                    const config = STATUS_CONFIG[event.status] || STATUS_CONFIG.PENDING;
                    return (
                      <div key={event.id} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-all duration-200">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{event.prTitle}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{event.repoFullName} · PR #{event.prNumber}</p>
                          </div>
                          <Badge className={`${config.style} flex items-center gap-1 text-xs shrink-0`}>
                            {config.icon}{config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500">{new Date(event.createdAt).toLocaleString()}</span>
                          {event.reviewId && (
                            <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg"
                              onClick={() => setSelectedReviewId(selectedReviewId === event.reviewId ? null : event.reviewId)}>
                              {selectedReviewId === event.reviewId ? <><EyeOff className="w-3 h-3 mr-1" />Hide</> : <><Eye className="w-3 h-3 mr-1" />View Review</>}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Review Detail */}
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800">
              <h2 className="font-semibold text-white">AI Review Detail</h2>
            </div>
            <div className="p-5">
              {!selectedReviewId ? (
                <div className="text-center py-12 text-zinc-400 text-sm leading-relaxed">
                  Click "View Review" on an event<br />to see the AI review here
                </div>
              ) : !selectedReview ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                </div>
              ) : (
                <div>
                  <p className="text-xs text-zinc-500 mb-4">{selectedReview.filesReviewed} file(s) reviewed · PR #{selectedReview.prNumber}</p>
                  <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedReview.content) }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}