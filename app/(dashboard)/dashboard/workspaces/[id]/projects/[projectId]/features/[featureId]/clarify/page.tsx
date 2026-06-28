// @ts-nocheck
'use client';
 
import { use, useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, Bot, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
 
export default function ClarifyPage({ params }) {
  const { id: workspaceId, projectId, featureId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
 
  const { data: feature } = trpc.feature.getById.useQuery({ id: featureId });
  const saveClarification = trpc.feature.saveClarification.useMutation({
    onSuccess: () => {
      toast.success('Requirements saved successfully');
    },
  });
 
  const { messages, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/ai/clarify',
    body: { featureTitle: feature?.title, featureDescription: feature?.description },
    onFinish: () => {
      setInputValue('');
    },
  });
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
 
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const currentInput = inputValue;
    setInputValue('');
    await handleSubmit(e, {
      data: { input: currentInput },
    });
  };
 
  const isReadyForPRD = messages.some(
    m => m.role === 'assistant' && m.content.includes('Ready to generate PRD')
  );
 
  return (
    <div className="flex flex-col h-screen p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link href={'/dashboard/workspaces/' + workspaceId + '/projects/' + projectId + '?org=' + orgId}>
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <h1 className="text-xl font-bold">AI Requirement Clarification</h1>
        {feature && <p className="text-sm text-muted-foreground">{feature.title}</p>}
      </div>
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-muted-foreground text-sm mt-10">
              Type your first message to start AI clarification...
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-slate-100 text-foreground'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-slate-100 rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!inputValue.trim() || isLoading) return;
              handleSubmit(e);
            }}
            className="flex gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
 