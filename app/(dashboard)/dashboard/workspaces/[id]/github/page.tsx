'use client';

import { use, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
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
  const { data: authUrl } = trpc.github.getAuthUrl.useQuery({ orgId: orgId || '' }, { enabled: !!orgId });
  const { data: repos, isLoading: reposLoading } = trpc.github.listRepos.useQuery(undefined, { enabled: !!connection });
  const { data: connectedRepos, refetch: refetchConnected } = trpc.github.listConnectedRepos.useQuery({ workspaceId });

  const connectRepo = trpc.github.connectRepo.useMutation({
    onSuccess: () => { refetchConnected(); setConnecting(null); toast.success('Repository connected!'); },
  });

  const disconnect = trpc.github.disconnect.useMutation({
    onSuccess: () => { refetchConnection(); toast.success('GitHub disconnected'); },
  });

  const isConnected = (githubId: number) => connectedRepos?.some((r) => r.githubId === String(githubId));

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Link href={`/dashboard/workspaces/${workspaceId}?org=${orgId}`}>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-1" />Back
            </Button>
          </Link>
        </div>

        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-700 flex items-center justify-center shadow-xl">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">GitHub Integration</h1>
              <p className="text-zinc-400 text-sm mt-0.5">Connect repositories to enable AI code review</p>
            </div>
          </div>
          {connection && (
            <Link href={`/dashboard/workspaces/${workspaceId}/github/review?org=${orgId}`}>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl px-5 font-semibold shadow-xl shadow-violet-500/20 hover:-translate-y-0.5 transition-all">
                <Sparkles className="w-4 h-4 mr-2" />AI Code Review
              </Button>
            </Link>
          )}
        </div>

        {!connection ? (
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-6">
              <Github className="w-9 h-9 text-zinc-300" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Connect GitHub</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">Connect your GitHub account to browse repositories and enable automated AI code reviews</p>
            <Button onClick={() => authUrl && window.location.assign(authUrl.url)} disabled={!authUrl}
              className="bg-white text-black hover:bg-zinc-200 rounded-xl px-6 py-3 font-semibold transition-all hover:-translate-y-0.5">
              <Github className="w-4 h-4 mr-2" />Connect GitHub Account
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected Banner */}
            <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Connected as {connection.githubLogin}</p>
                  <p className="text-xs text-emerald-400">GitHub account linked successfully</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}
                className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg">
                Disconnect
              </Button>
            </div>

            {/* Repos */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Your Repositories</h2>
              {reposLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
                    <p className="text-zinc-400 text-sm">Loading repositories...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {repos?.map((repo) => (
                    <div key={repo.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all duration-200 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                          {repo.private ? <Lock className="w-3.5 h-3.5 text-zinc-400" /> : <Globe className="w-3.5 h-3.5 text-zinc-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{repo.fullName}</p>
                          {repo.description && <p className="text-xs text-zinc-500 truncate max-w-xs">{repo.description}</p>}
                        </div>
                        {repo.language && (
                          <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-xs shrink-0">{repo.language}</Badge>
                        )}
                      </div>
                      {isConnected(repo.id) ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1 shrink-0">
                          <CheckCircle className="w-3 h-3" />Connected
                        </Badge>
                      ) : (
                        <Button size="sm" disabled={connecting === String(repo.id)}
                          className="bg-zinc-800 hover:bg-violet-600 text-zinc-200 hover:text-white border border-zinc-700 hover:border-violet-500 rounded-lg text-xs transition-all duration-200 shrink-0"
                          onClick={() => {
                            setConnecting(String(repo.id));
                            connectRepo.mutate({ workspaceId, githubId: String(repo.id), name: repo.name, fullName: repo.fullName, description: repo.description || undefined, private: repo.private });
                          }}>
                          {connecting === String(repo.id) ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
                          Connect
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}