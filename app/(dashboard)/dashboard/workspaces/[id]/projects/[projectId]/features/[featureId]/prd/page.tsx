'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save, CheckCircle, Edit3, Eye, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface PRDPageProps {
  params: Promise<{ id: string; projectId: string; featureId: string }>;
}

function renderMarkdown(text: string) {
  return text
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3 text-white">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-5 mb-2 text-violet-400">$1</h2>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="flex items-start gap-2 mb-1.5"><span class="mt-1 h-4 w-4 border border-zinc-500 rounded shrink-0 inline-block"></span><span class="text-zinc-300">$1</span></li>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 list-disc text-zinc-300">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>');
}

export default function PRDPage({ params }: PRDPageProps) {
  const { id: workspaceId, projectId, featureId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');

  const [prdContent, setPrdContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { data: feature } = trpc.feature.getById.useQuery(
    { id: featureId },
    { enabled: !!featureId }
  );
  const { data: existingPrd, refetch } = trpc.prd.getByFeature.useQuery(
    { featureId },
    { enabled: !!featureId }
  );
  const savePrd = trpc.prd.save.useMutation({
    onSuccess: () => { setIsSaved(true); toast.success('PRD saved'); refetch(); },
  });

  useEffect(() => {
    if (existingPrd?.content) { setPrdContent(existingPrd.content); setIsSaved(true); }
  }, [existingPrd]);

  const generatePRD = async () => {
    if (!feature) return;
    setIsGenerating(true);
    setPrdContent('');
    setIsSaved(false);
    abortRef.current = new AbortController();
    try {
      const response = await fetch('/api/ai/prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureTitle: feature.title, featureDescription: feature.description, aiClarification: feature.aiClarification }),
        signal: abortRef.current.signal,
      });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setPrdContent(accumulated);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') toast.error('Failed to generate PRD');
    } finally { setIsGenerating(false); }
  };

  const handleSave = () => {
    if (!prdContent.trim()) return;
    savePrd.mutate({ featureId, content: prdContent });
  };

  if (!featureId) return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}?org=${orgId}`}>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-1" />Back to Project
            </Button>
          </Link>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Product Requirements</h1>
              {feature && <p className="text-zinc-400 text-sm mt-0.5">{feature.title}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            {prdContent && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}
                  className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl">
                  {isEditing ? <><Eye className="w-4 h-4 mr-1" />Preview</> : <><Edit3 className="w-4 h-4 mr-1" />Edit</>}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={savePrd.isPending || isSaved}
                  className={`rounded-xl font-medium ${isSaved ? 'bg-emerald-600 hover:bg-emerald-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'}`}>
                  {savePrd.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving...</> : isSaved ? <><CheckCircle className="w-4 h-4 mr-1" />Saved</> : <><Save className="w-4 h-4 mr-1" />Save</>}
                </Button>
              </>
            )}
            <Button onClick={generatePRD} disabled={isGenerating || !feature}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl font-semibold shadow-xl shadow-violet-500/20 hover:-translate-y-0.5 transition-all">
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />{existingPrd ? 'Regenerate' : 'Generate PRD'}</>}
            </Button>
          </div>
        </div>

        {feature?.aiClarification && (
          <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-4 mb-6">
            <p className="text-xs font-semibold text-blue-400 mb-1">AI Clarification Summary</p>
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{feature.aiClarification.slice(0, 300)}...</p>
          </div>
        )}

        {!prdContent && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <FileText className="w-9 h-9 text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-semibold text-lg mb-2">No PRD yet</p>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-sm">
                {feature?.aiClarification ? 'Requirements clarified. Generate your PRD document.' : 'Generate a structured PRD from your feature description.'}
              </p>
              <Button onClick={generatePRD} disabled={!feature}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl px-6 font-semibold shadow-xl shadow-violet-500/20 hover:-translate-y-0.5 transition-all">
                <Sparkles className="w-4 h-4 mr-2" />Generate PRD
              </Button>
            </div>
          </div>
        )}

        {(prdContent || isGenerating) && (
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl overflow-hidden">
            <div className="p-6">
              {isEditing ? (
                <Textarea value={prdContent} onChange={(e) => { setPrdContent(e.target.value); setIsSaved(false); }}
                  className="min-h-[600px] font-mono text-sm bg-zinc-800 border-zinc-700 text-zinc-200 rounded-xl focus:border-violet-500" />
              ) : (
                <div className="prose prose-sm max-w-none text-zinc-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(prdContent) }} />
              )}
              {isGenerating && (
                <div className="flex items-center gap-2 mt-6 text-sm text-zinc-400 border-t border-zinc-800 pt-4">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />Generating PRD...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}