// @ts-nocheck
'use client';

import { use, useState } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, RefreshCw, GitPullRequest, AlertTriangle, Info, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function VerdictBadge({ verdict }) {
  if (!verdict) return <Badge variant="outline">Pending</Badge>;
  if (verdict === 'APPROVED') return <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
  if (verdict === 'CHANGES_REQUESTED') return <Badge className="bg-red-100 text-red-700 border-red-200" variant="outline"><XCircle className="w-3 h-3 mr-1" />Changes Requested</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200" variant="outline"><HelpCircle className="w-3 h-3 mr-1" />Needs Discussion</Badge>;
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={'/dashboard/workspaces/' + workspaceId + '/github?org=' + orgId}>
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <h1 className="text-2xl font-bold">AI Code Reviews</h1>
      </div>

      {isLoading && <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>}

      {!isLoading && (!events || events.length === 0) && (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No pull request activity yet. Open a PR on a connected repo to trigger an AI review.</CardContent></Card>
      )}

      <div className="space-y-4">
        {events?.map((event) => {
          const blocking = safeParseList(event.review?.blockingIssues);
          const nonBlocking = safeParseList(event.review?.nonBlockingIssues);
          return (
            <Card key={event.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <GitPullRequest className="w-4 h-4 text-muted-foreground shrink-0" />
                    <a href={event.prUrl} target="_blank" rel="noreferrer" className="font-medium text-sm truncate hover:underline">{event.prTitle}</a>
                  </div>
                  <VerdictBadge verdict={event.review?.verdict} />
                </div>
                <p className="text-xs text-muted-foreground">{event.repoFullName} · PR #{event.prNumber} · {event.action}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.status === 'PROCESSING' && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" />Review in progress...</p>}
                {event.status === 'FAILED' && <p className="text-sm text-red-600">Review failed - check GitHub connection.</p>}
                {event.review?.content && <p className="text-sm text-muted-foreground">{event.review.content}</p>}

                {blocking.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Blocking ({blocking.length})</p>
                    <ul className="text-sm text-red-700 list-disc pl-4 space-y-0.5">{blocking.map((issue, i) => <li key={i}>{issue}</li>)}</ul>
                  </div>
                )}

                {nonBlocking.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1"><Info className="w-3 h-3" />Suggestions ({nonBlocking.length})</p>
                    <ul className="text-sm text-slate-600 list-disc pl-4 space-y-0.5">{nonBlocking.map((issue, i) => <li key={i}>{issue}</li>)}</ul>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Select value={event.featureId || undefined} onValueChange={(val) => linkFeature.mutate({ eventId: event.id, featureId: val })}>
                    <SelectTrigger className="h-8 text-xs w-[220px]"><SelectValue placeholder="Link to feature..." /></SelectTrigger>
                    <SelectContent>{features?.map((f) => <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-8 text-xs ml-auto" disabled={rerunningId === event.id}
                    onClick={() => { setRerunningId(event.id); rerunReview.mutate({ eventId: event.id }); }}>
                    {rerunningId === event.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                    Re-run Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}