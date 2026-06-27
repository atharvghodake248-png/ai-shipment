'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, CheckCircle, Edit3, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface PRDPageProps {
  params: Promise<{ id: string; projectId: string; featureId: string }>;
}

function renderMarkdown(text: string) {
  return text
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-2 text-primary">$1</h2>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="flex items-start gap-2 mb-1"><span class="mt-1 h-4 w-4 border rounded shrink-0 inline-block"></span><span>$1</span></li>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 list-disc">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
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

  const { data: feature } = trpc.feature.getById.useQuery({ id: featureId });
  const { data: existingPrd, refetch } = trpc.prd.getByFeature.useQuery({ featureId });
  const savePrd = trpc.prd.save.useMutation({
    onSuccess: () => {
      setIsSaved(true);
      toast.success('PRD saved');
      refetch();
    },
  });

  useEffect(() => {
    if (existingPrd?.content) {
      setPrdContent(existingPrd.content);
      setIsSaved(true);
    }
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
      body: JSON.stringify({
        featureTitle: feature.title,
        featureDescription: feature.description,
        aiClarification: feature.aiClarification,
      }),
      signal: abortRef.current.signal,
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setPrdContent(accumulated);
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      toast.error('Failed to generate PRD');
    }
  } finally {
    setIsGenerating(false);
  }
};

  const handleSave = () => {
    if (!prdContent.trim()) return;
    savePrd.mutate({ featureId, content: prdContent });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}?org=${orgId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Project
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Product Requirements Document</h1>
          {feature && (
            <p className="text-muted-foreground mt-1">{feature.title}</p>
          )}
        </div>
        <div className="flex gap-2">
          {prdContent && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <><Eye className="w-4 h-4 mr-1" />Preview</>
                ) : (
                  <><Edit3 className="w-4 h-4 mr-1" />Edit</>
                )}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={savePrd.isPending || isSaved}
              >
                {savePrd.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Saving...</>
                ) : isSaved ? (
                  <><CheckCircle className="w-4 h-4 mr-1" />Saved</>
                ) : (
                  <><Save className="w-4 h-4 mr-1" />Save PRD</>
                )}
              </Button>
            </>
          )}
          <Button onClick={generatePRD} disabled={isGenerating || !feature}>
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
            ) : existingPrd ? (
              'Regenerate PRD'
            ) : (
              '✨ Generate PRD'
            )}
          </Button>
        </div>
      </div>

      {feature?.aiClarification && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm text-blue-700">AI Clarification Summary</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xs text-blue-600 line-clamp-3">{feature.aiClarification.slice(0, 300)}...</p>
          </CardContent>
        </Card>
      )}

      {!prdContent && !isGenerating && (
        <div className="text-center py-24 border rounded-xl text-muted-foreground">
          <p className="text-lg font-medium">No PRD yet</p>
          <p className="text-sm mt-1 mb-4">
            {feature?.aiClarification
              ? 'Requirements clarified. Click Generate PRD to create your document.'
              : 'Click Generate PRD to create your document. For best results, clarify requirements first.'}
          </p>
          <Button onClick={generatePRD} disabled={!feature}>
            ✨ Generate PRD
          </Button>
        </div>
      )}

      {(prdContent || isGenerating) && (
        <Card>
          <CardContent className="p-6">
            {isEditing ? (
              <Textarea
                value={prdContent}
                onChange={(e) => { setPrdContent(e.target.value); setIsSaved(false); }}
                className="min-h-[600px] font-mono text-sm"
              />
            ) : (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(prdContent) }}
              />
            )}
            {isGenerating && (
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating PRD...
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}