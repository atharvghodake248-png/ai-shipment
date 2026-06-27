'use client';

import { use, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, GitPullRequest, Sparkles, FileCode } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

function renderMarkdown(text: string) {
  return text
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-5 mb-2 text-primary">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^\*\*(.+?)\*\*$/gm, '<p class="font-semibold mt-3 mb-1">$1</p>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 list-disc text-sm">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 mb-1 list-decimal text-sm">$2</li>')
    .replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\n\n/g, '<br/>');
}

export default function CodeReviewPage({ params }: ReviewPageProps) {
  const { id: workspaceId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');

  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [selectedPR, setSelectedPR] = useState<number | null>(null);
  const [selectedPRTitle, setSelectedPRTitle] = useState<string>('');
  const [reviewResult, setReviewResult] = useState<{ review: string; filesReviewed: number } | null>(null);

  const { data: connectedRepos } = trpc.github.listConnectedRepos.useQuery({ workspaceId });

  const { data: prs, isLoading: prsLoading } = trpc.codeReview.listPRs.useQuery(
    { repoFullName: selectedRepo },
    { enabled: !!selectedRepo }
  );

  const { data: diff } = trpc.codeReview.getPRDiff.useQuery(
    { repoFullName: selectedRepo, prNumber: selectedPR! },
    { enabled: !!selectedRepo && !!selectedPR }
  );

  const reviewPR = trpc.codeReview.reviewPR.useMutation({
    onSuccess: (data) => {
      setReviewResult(data);
      toast.success('Code review complete!');
    },
    onError: () => toast.error('Failed to generate review'),
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

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-primary" />
            AI Code Review
          </h1>
          <p className="text-muted-foreground mt-1">
            Select a repository and pull request to get an AI-powered review
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <label className="text-sm font-medium">Repository</label>
          <Select value={selectedRepo} onValueChange={(v) => { setSelectedRepo(v); setSelectedPR(null); setReviewResult(null); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select a connected repository" />
            </SelectTrigger>
            <SelectContent>
              {connectedRepos?.map((repo) => (
                <SelectItem key={repo.id} value={repo.fullName}>
                  {repo.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Pull Request</label>
          <Select
            value={selectedPR?.toString() || ''}
            onValueChange={(v) => {
              const pr = prs?.find((p) => p.number === parseInt(v));
              setSelectedPR(parseInt(v));
              setSelectedPRTitle(pr?.title || '');
              setReviewResult(null);
            }}
            disabled={!selectedRepo || prsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={prsLoading ? 'Loading PRs...' : 'Select a pull request'} />
            </SelectTrigger>
            <SelectContent>
              {prs?.length === 0 && (
                <SelectItem value="none" disabled>No open PRs found</SelectItem>
              )}
              {prs?.map((pr) => (
                <SelectItem key={pr.id} value={pr.number.toString()}>
                  #{pr.number} {pr.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedPR && diff && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Changed Files ({diff.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {diff.map((file) => (
                <div key={file.filename} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs truncate">{file.filename}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      +{file.additions}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                      -{file.deletions}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {file.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedPR && (
        <div className="mb-6">
          <Button
            onClick={() => reviewPR.mutate({
              repoFullName: selectedRepo,
              prNumber: selectedPR,
              prTitle: selectedPRTitle,
            })}
            disabled={reviewPR.isPending}
            className="w-full"
            size="lg"
          >
            {reviewPR.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Reviewing code...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generate AI Review</>
            )}
          </Button>
        </div>
      )}

      {!selectedRepo && (
        <div className="text-center py-24 border rounded-xl text-muted-foreground">
          <GitPullRequest className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No repository selected</p>
          <p className="text-sm mt-1">
            Select a connected repository and pull request to start the AI review
          </p>
        </div>
      )}

      {reviewResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Review — {reviewResult.filesReviewed} file{reviewResult.filesReviewed !== 1 ? 's' : ''} reviewed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(reviewResult.review) }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}