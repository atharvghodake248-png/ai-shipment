'use client';

import { use, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Webhook, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface WebhooksPageProps {
  params: Promise<{ id: string }>;
}

function renderMarkdown(text: string) {
  return text
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-5 mb-2 text-primary">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 list-disc text-sm">$1</li>')
    .replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\n\n/g, '<br/>');
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-3 h-3" />,
  PROCESSING: <Loader2 className="w-3 h-3 animate-spin" />,
  COMPLETED: <CheckCircle className="w-3 h-3" />,
  FAILED: <XCircle className="w-3 h-3" />,
};

export default function WebhooksPage({ params }: WebhooksPageProps) {
  const { id: workspaceId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [registeringRepo, setRegisteringRepo] = useState<string | null>(null);

  const { data: events, isLoading, refetch } = trpc.webhook.listEvents.useQuery({ workspaceId });
  const { data: connectedRepos } = trpc.github.listConnectedRepos.useQuery({ workspaceId });
  const { data: selectedReview } = trpc.webhook.getReview.useQuery(
    { reviewId: selectedReviewId! },
    { enabled: !!selectedReviewId }
  );

  const registerWebhook = trpc.webhook.register.useMutation({
    onSuccess: () => {
      toast.success('Webhook registered! PRs will now trigger automatic reviews.');
      setRegisteringRepo(null);
    },
    onError: (err) => {
      toast.error('Failed to register webhook: ' + err.message);
      setRegisteringRepo(null);
    },
  });

  const deleteWebhook = trpc.webhook.deleteWebhook.useMutation({
    onSuccess: () => {
      toast.success('Webhook removed');
      refetch();
    },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/workspaces/${workspaceId}/github?org=${orgId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to GitHub
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Webhook className="w-7 h-7 text-primary" />
          GitHub Webhooks
        </h1>
        <p className="text-muted-foreground mt-1">
          Auto-trigger AI code reviews when pull requests are opened
        </p>
      </div>

      {/* Register webhooks for connected repos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Connected Repositories</CardTitle>
        </CardHeader>
        <CardContent>
          {!connectedRepos?.length ? (
            <p className="text-sm text-muted-foreground">No repositories connected yet.</p>
          ) : (
            <div className="space-y-3">
              {connectedRepos.map((repo) => (
                <div key={repo.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{repo.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {repo.webhookId ? '🟢 Webhook active' : '⚪ No webhook'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {repo.webhookId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={() => deleteWebhook.mutate({
                          repoFullName: repo.fullName,
                          workspaceId,
                        })}
                        disabled={deleteWebhook.isPending}
                      >
                        Remove Webhook
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="text-xs"
                        disabled={registeringRepo === repo.fullName || registerWebhook.isPending}
                        onClick={() => {
                          setRegisteringRepo(repo.fullName);
                          registerWebhook.mutate({
                            repoFullName: repo.fullName,
                            workspaceId,
                          });
                        }}
                      >
                        {registeringRepo === repo.fullName ? (
                          <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Registering...</>
                        ) : (
                          'Enable Auto-Review'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Events list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent PR Events</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : !events?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No webhook events yet. Enable auto-review on a repo and open a PR.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{event.prTitle}</p>
                        <p className="text-xs text-muted-foreground">{event.repoFullName} · PR #{event.prNumber}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 flex items-center gap-1 ${STATUS_STYLES[event.status]}`}
                      >
                        {STATUS_ICONS[event.status]}
                        {event.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                      {event.reviewId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={() => setSelectedReviewId(
                            selectedReviewId === event.reviewId ? null : event.reviewId
                          )}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {selectedReviewId === event.reviewId ? 'Hide' : 'View Review'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Review Detail</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedReviewId ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Click "View Review" on an event to see the AI review here
              </div>
            ) : !selectedReview ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-3">
                  {selectedReview.filesReviewed} file(s) reviewed · PR #{selectedReview.prNumber}
                </p>
                <div
                  className="prose prose-sm max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedReview.content) }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}