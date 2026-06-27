'use client';

import { use, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Github, Link2, Loader2, Lock, Globe, CheckCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface GitHubPageProps {
  params: Promise<{ id: string }>;
}

export default function GitHubPage({ params }: GitHubPageProps) {
  const { id: workspaceId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [connecting, setConnecting] = useState<string | null>(null);

  const { data: connection, refetch: refetchConnection } = trpc.github.getConnection.useQuery();
  const { data: authUrl } = trpc.github.getAuthUrl.useQuery(
    { orgId: orgId || '' },
    { enabled: !!orgId }
  );
  const { data: repos, isLoading: reposLoading } = trpc.github.listRepos.useQuery(
    undefined,
    { enabled: !!connection }
  );
  const { data: connectedRepos, refetch: refetchConnected } = trpc.github.listConnectedRepos.useQuery(
    { workspaceId }
  );

  const connectRepo = trpc.github.connectRepo.useMutation({
    onSuccess: () => {
      refetchConnected();
      setConnecting(null);
      toast.success('Repository connected!');
    },
  });

  const disconnect = trpc.github.disconnect.useMutation({
    onSuccess: () => {
      refetchConnection();
      toast.success('GitHub disconnected');
    },
  });

  const isConnected = (githubId: number) =>
    connectedRepos?.some((r) => r.githubId === String(githubId));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/workspaces/${workspaceId}?org=${orgId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Github className="w-8 h-8" />
            GitHub Integration
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect your GitHub repositories to enable AI code review
          </p>
        </div>
        {connection && (
          <Link href={`/dashboard/workspaces/${workspaceId}/github/review?org=${orgId}`}>
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Code Review
            </Button>
          </Link>
        )}
      </div>

      {!connection ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Github className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <h2 className="text-lg font-semibold mb-2">Connect GitHub</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Connect your GitHub account to browse and connect repositories
            </p>
            <Button
              onClick={() => authUrl && window.location.assign(authUrl.url)}
              disabled={!authUrl}
            >
              <Github className="w-4 h-4 mr-2" />
              Connect GitHub Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Connected as {connection.githubLogin}</p>
                  <p className="text-xs text-green-600">GitHub account linked successfully</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
              >
                Disconnect
              </Button>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-semibold mb-4">Your Repositories</h2>
            {reposLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {repos?.map((repo) => (
                  <Card key={repo.id}>
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {repo.private ? (
                          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{repo.fullName}</p>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {repo.description}
                            </p>
                          )}
                        </div>
                        {repo.language && (
                          <Badge variant="outline" className="text-xs">
                            {repo.language}
                          </Badge>
                        )}
                      </div>
                      {isConnected(repo.id) ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={connecting === String(repo.id)}
                          onClick={() => {
                            setConnecting(String(repo.id));
                            connectRepo.mutate({
                              workspaceId,
                              githubId: String(repo.id),
                              name: repo.name,
                              fullName: repo.fullName,
                              description: repo.description || undefined,
                              private: repo.private,
                            });
                          }}
                        >
                          {connecting === String(repo.id) ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <><Link2 className="w-3 h-3 mr-1" />Connect</>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}