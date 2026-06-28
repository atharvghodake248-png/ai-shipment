// @ts-nocheck
'use client';
 
import { use, useState } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, RefreshCw, GitPullRequest, AlertTriangle, Info, CheckCircle2, XCircle, HelpCircle, Sparkles, Clock, FileCode } from 'lucide-react';
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
 
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-5 mb-2 text-violet-400">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-3 mb-1 text-zinc-200">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 list-disc text-sm text-zinc-300">$1</li>')
    .replace(/`(.+?)`/g, '<code class="bg-zinc-800 px-1 rounded text-xs font-mono text-violet-300">$1</code>')
    .replace(/\n\n/g, '<br/>');
}
 
export default function GithubReviewPage({ params }) {
  const { id: workspaceId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [rerunningId, setRerunningId] = useState(null);
  const utils = trpc.useUtils();
 
  // Manual review state
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedPR, setSelectedPR] = useState(null);
  const [selectedPRTitle, setSelectedPRTitle] = useState('');
  const [manualReview, setManualReview] = useState(null);
 
  const { data: events, isLoading } = trpc.webhook.listEvents.useQuery({ workspaceId });
  const { data: features } = trpc.feature.listByWorkspace.useQuery({ workspaceId });
  const { data: connectedRepos } = trpc.github.listConnectedRepos.useQuery({ workspaceId });
 
  const { data: prs, isLoading: prsLoading } = trpc.codeReview.listPRs.useQuery(
    { repoFullName: selectedRepo },
    { enabled: !!selectedRepo }
  );
 
  const { data: diff } = trpc.codeReview.getPRDiff.useQuery(
    { repoFullName: selectedRepo, prNumber: selectedPR },
    { enabled: !!selectedRepo && !!selectedPR }
  );
 
  const reviewPR = trpc.codeReview.reviewPR.useMutation({
    onSuccess: (data) => {
      setManualReview(data);
      toast.success('AI review complete!');
    },
    onError: () => toast.error('Failed to generate review'),
  });
 
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
 
        {/* MANUAL REVIEW SECTION */}
        <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-6 mb-8">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Manual PR Review
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Repository</label>
              <Select value={selectedRepo} onValueChange={(v) => { setSelectedRepo(v); setSelectedPR(null); setManualReview(null); }}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200 rounded-xl">
                  <SelectValue placeholder="Select a connected repository" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  {connectedRepos?.map((repo) => (
                    <SelectItem key={repo.id} value={repo.fullName}>{repo.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Pull Request</label>
              <Select
                value={selectedPR?.toString() || ''}
                onValueChange={(v) => {
                  const pr = prs?.find((p) => p.number === parseInt(v));
                  setSelectedPR(parseInt(v));
                  setSelectedPRTitle(pr?.title || '');
                  setManualReview(null);
                }}
                disabled={!selectedRepo || prsLoading}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200 rounded-xl">
                  <SelectValue placeholder={prsLoading ? 'Loading PRs...' : 'Select a pull request'} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  {prs?.length === 0 && <SelectItem value="none" disabled>No open PRs found</SelectItem>}
                  {prs?.map((pr) => (
                    <SelectItem key={pr.id} value={pr.number.toString()}>#{pr.number} {pr.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
 
          {/* Changed files */}
          {selectedPR && diff && diff.length > 0 && (
            <div className="mb-4 rounded-xl bg-zinc-800/50 border border-zinc-700 p-4">
              <p className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />Changed Files ({diff.length})
              </p>
              <div className="space-y-2">
                {diff.map((file) => (
                  <div key={file.filename} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-zinc-300 truncate">{file.filename}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-emerald-400">+{file.additions}</span>
                      <span className="text-rose-400">-{file.deletions}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
 
          {selectedPR && (
            <Button
              onClick={() => reviewPR.mutate({ repoFullName: selectedRepo, prNumber: selectedPR, prTitle: selectedPRTitle })}
              disabled={reviewPR.isPending}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl font-semibold"
            >
              {reviewPR.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reviewing code...</>
                : <><Sparkles className="w-4 h-4 mr-2" />Generate AI Review</>}
            </Button>
          )}
 
          {/* Manual review result */}
          {manualReview && (
            <div className="mt-4 rounded-xl bg-zinc-800/50 border border-zinc-700 p-5">
              <p className="text-xs text-zinc-400 mb-3">{manualReview.filesReviewed} file(s) reviewed</p>
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(manualReview.review) }}
              />
            </div>
          )}
        </div>
 
        {/* WEBHOOK EVENTS SECTION */}
        <h2 className="text-base font-semibold text-zinc-300 mb-4 flex items-center gap-2">
          <GitPullRequest className="w-4 h-4 text-zinc-500" />
          Auto-triggered Reviews (Webhooks)
        </h2>
 
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
          </div>
        )}
 
        {!isLoading && (!events || events.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl bg-zinc-900/40 border border-zinc-800">
            <GitPullRequest className="w-8 h-8 text-zinc-600" />
            <p className="text-zinc-400 text-sm">No webhook events yet — enable auto-review in Webhooks tab</p>
          </div>
        )}
 
        <div className="space-y-4">
          {events?.map((event) => {
            const blocking = safeParseList(event.review?.blockingIssues);
            const nonBlocking = safeParseList(event.review?.nonBlockingIssues);
            return (
              <div key={event.id} className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl hover:border-violet-500/40 transition-all duration-300 overflow-hidden">
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
                <div className="p-5 space-y-4">
                  {event.status === 'PROCESSING' && (
                    <div className="flex items-center gap-2 text-zinc-300 text-sm bg-zinc-800/50 rounded-xl p-3">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-400" />Review in progress...
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
                  <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
                    <Select value={event.featureId || undefined} onValueChange={(val) => linkFeature.mutate({ eventId: event.id, featureId: val })}>
                      <SelectTrigger className="h-8 text-xs w-[200px] bg-zinc-800 border-zinc-700 text-zinc-200 rounded-lg">
                        <SelectValue placeholder="Link to feature..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                        {features?.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs ml-auto bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-violet-600 hover:border-violet-500 hover:text-white rounded-lg transition-all"
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
 