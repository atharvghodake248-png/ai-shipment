// @ts-nocheck
'use client';

import { use, useState } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, RefreshCw, GitPullRequest, AlertTriangle, Info, CheckCircle2, XCircle, HelpCircle, Sparkles, Clock } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function VerdictBadge({ verdict }) {
  if (!verdict) return (
    <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 flex items-center gap-1">
      <Clock className="w-3 h-3" />Pending
    </Badge>
  );
  if (verdict === 'APPROVED') return (
    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3" />Approved
    </Badge>
  );
  if (verdict === 'CHANGES_REQUESTED') return (
    <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 flex items-center gap-1">
      <XCircle className="w-3 h-3" />Changes Requested
    </Badge>
  );
  return (
    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 flex items-center gap-1">
      <HelpCircle className="w-3 h-3" />Needs Discussion
    </Badge>
  );
}

function safeParseList(json) {
  if (!json) return [];
  try { const p = JSON.parse(json); return Array.isArray(p) ? p : []; } catch { return []; }
}

export default function GithubReviewPage({ params }) {
  const { id: workspaceId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [rerunningId, setRerunningId] = useState(null);
  const utils = trpc.useUtils();

  const { data: events, isLoading } = trpc.webhook.listEvents.useQuery({ workspaceId });
  const { data: features } = trpc.feature.listByWorkspace.useQuery({ workspaceId });

  const linkFeature = trpc.webhook.linkFeature.useMutation({
    onSuccess: () => { toast.success('Linked to feature'); utils.webhook.listEvents.invalidate({ workspaceId }); },
  });

  const rerunReview = trpc.webhook.rerunReview.useMutation({
    onSuccess: () => { toast.success('Review re-run complete'); utils.webhook.listEvents.invalidate({ workspaceId }); setRerunningId(null); },
    onError: (err) => { toast.error(err.message || 'Re-review failed'); setRerunningId(null); },
  });

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link href={'/dashboard/workspaces/' + workspaceId + '/github?org=' + orgId}>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-1" />Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Code Reviews</h1>
              <p className="text-zinc-400 text-sm">Automated PR reviews powered by AI</p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
            </div>
            <p className="text-zinc-400 text-sm">Loading reviews...</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!events || events.length === 0) && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <GitPullRequest className="w-9 h-9 text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-medium mb-1">No pull request activity yet</p>
              <p className="text-zinc-500 text-sm">Open a PR on a connected repo to trigger an AI review</p>
            </div>
          </div>
        )}

        {/* Events */}
        <div className="space-y-4">
          {events?.map((event) => {
            const blocking = safeParseList(event.review?.blockingIssues);
            const nonBlocking = safeParseList(event.review?.nonBlockingIssues);
            return (
              <div key={event.id} className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 overflow-hidden">
                {/* Card Header */}
                <div className="p-5 border-b border-zinc-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                        <GitPullRequest className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <a href={event.prUrl} target="_blank" rel="noreferrer" className="font-semibold text-sm text-white truncate hover:text-violet-400 transition-colors block">
                          {event.prTitle}
                        </a>
                        <p className="text-xs text-zinc-400 mt-0.5">{event.repoFullName} · PR #{event.prNumber} · {event.action}</p>
                      </div>
                    </div>
                    <VerdictBadge verdict={event.review?.verdict} />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {event.status === 'PROCESSING' && (
                    <div className="flex items-center gap-2 text-zinc-300 text-sm bg-zinc-800/50 rounded-xl p-3">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                      Review in progress...
                    </div>
                  )}
                  {event.status === 'FAILED' && (
                    <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                      Review failed — check GitHub connection.
                    </div>
                  )}
                  {event.review?.content && (
                    <p className="text-sm text-zinc-300 leading-relaxed">{event.review.content}</p>
                  )}

                  {blocking.length > 0 && (
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 border-l-4 border-l-rose-500">
                      <p className="text-xs font-semibold text-rose-400 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />Blocking Issues ({blocking.length})
                      </p>
                      <ul className="space-y-1.5">
                        {blocking.map((issue, i) => (
                          <li key={i} className="text-sm text-rose-200 leading-relaxed flex items-start gap-2">
                            <span className="text-rose-500 mt-1">•</span>{issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {nonBlocking.length > 0 && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 border-l-4 border-l-blue-500">
                      <p className="text-xs font-semibold text-blue-400 mb-2 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />Suggestions ({nonBlocking.length})
                      </p>
                      <ul className="space-y-1.5">
                        {nonBlocking.map((issue, i) => (
                          <li key={i} className="text-sm text-blue-200 leading-relaxed flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>{issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
                    <Select value={event.featureId || undefined} onValueChange={(val) => linkFeature.mutate({ eventId: event.id, featureId: val })}>
                      <SelectTrigger className="h-8 text-xs w-[200px] bg-zinc-800 border-zinc-700 text-zinc-200 rounded-lg">
                        <SelectValue placeholder="Link to feature..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                        {features?.map((f) => (
                          <SelectItem key={f.id} value={f.id} className="hover:bg-zinc-800">{f.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs ml-auto bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-violet-600 hover:border-violet-500 hover:text-white rounded-lg transition-all duration-200"
                      disabled={rerunningId === event.id}
                      onClick={() => { setRerunningId(event.id); rerunReview.mutate({ eventId: event.id }); }}
                    >
                      {rerunningId === event.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                      Re-run Review
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}