'use client';
 
import { use, useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Bot, User, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
 
interface ClarifyPageProps {
  params: Promise<{ id: string; projectId: string; featureId: string }>;
}
 
export default function ClarifyPage({ params }: ClarifyPageProps) {
  const { id: workspaceId, projectId, featureId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(false);
 
  const { data: feature } = trpc.feature.getById.useQuery({ id: featureId });
  const saveClarification = trpc.feature.saveClarification.useMutation({
    onSuccess: () => {
      setIsSaved(true);
      toast.success('Requirements saved successfully');
    },
  });
 
  const { messages, input: inputValue, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/clarify',
    body: {
      featureTitle: feature?.title,
      featureDescription: feature?.description,
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm here to help clarify the requirements for **"${feature?.title || 'this feature'}"**. Let me ask you a few questions so we can write a great PRD.\n\nFirst — who are the primary users of this feature?`,
      },
    ],
  });
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
 
  const isReadyForPRD = messages.some(
    (m) => m.role === 'assistant' && m.content.includes('Ready to generate PRD')
  );
 
  const handleSaveAndContinue = () => {
    const clarificationSummary = messages
      .filter((m) => m.role === 'assistant')
      .map((m) => m.content)
      .join('\n\n');
 
    saveClarification.mutate({
      id: featureId,
      aiClarification: clarificationSummary,
    });
  };
 
  return (
    <div className="flex flex-col h-screen max-h-screen p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}?org=${orgId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">AI Requirement Clarification</h1>
          {feature && (
            <p className="text-sm text-muted-foreground truncate">{feature.title}</p>
          )}
        </div>
        {isReadyForPRD && (
          <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ready for PRD
          </Badge>
        )}
      </div>
 
      {/* Feature Context Card */}
      {feature && (
        <Card className="mb-4 bg-slate-50">
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Feature Request</p>
            <p className="text-sm font-medium">{feature.title}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feature.description}</p>
          </CardContent>
        </Card>
      )}
 
      {/* Chat Messages */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-slate-100 text-foreground rounded-tl-sm'
                }`}
              >
                {message.content}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
 
        {/* Input */}
        <div className="border-t p-4">
          {isReadyForPRD ? (
            <div className="flex gap-3">
              <Button
                onClick={handleSaveAndContinue}
                disabled={saveClarification.isPending || isSaved}
                className="flex-1"
              >
                {saveClarification.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                ) : isSaved ? (
                  <><CheckCircle className="w-4 h-4 mr-2" />Saved</>
                ) : (
                  'Save Requirements & Continue to PRD'
                )}
              </Button>
              {isSaved && (
                <Link
                  href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}/features/${featureId}/prd?org=${orgId}`}
                >
                  <Button variant="default">Generate PRD →</Button>
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type your answer..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !inputValue?.trim()} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
 