// @ts-nocheck
'use client';
 
import { use, useState, useRef, useEffect } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, Bot, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
 
export default function ClarifyPage({ params }) {
  const { id: workspaceId, projectId, featureId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
 
  const { data: feature } = trpc.feature.getById.useQuery({ id: featureId });
  const saveClarification = trpc.feature.saveClarification.useMutation({
    onSuccess: () => toast.success('Requirements saved successfully'),
  });
 
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
 
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
 
    const userMessage = { id: Date.now().toString(), role: 'user', content: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
 
    try {
      const response = await fetch('/api/ai/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          featureTitle: feature?.title,
          featureDescription: feature?.description,
        }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
      }]);
    } catch (error) {
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
 
  const isReadyForPRD = messages.some(
    m => m.role === 'assistant' && m.content.includes('Ready to generate PRD')
  );
 
  const handleSave = () => {
    const summary = messages.filter(m => m.role === 'assistant').map(m => m.content).join('\n\n');
    saveClarification.mutate({ id: featureId, aiClarification: summary });
  };
 
  return (
    <div className="flex flex-col h-screen p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link href={'/dashboard/workspaces/' + workspaceId + '/projects/' + projectId + '?org=' + orgId}>
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">AI Requirement Clarification</h1>
          {feature && <p className="text-sm text-muted-foreground">{feature.title}</p>}
        </div>
      </div>
 
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-muted-foreground text-sm mt-10">
              Type a message to start AI clarification...
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-foreground'
              }`}>
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
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
 
        <div className="border-t p-4 space-y-2">
          {isReadyForPRD && (
            <Button onClick={handleSave} disabled={saveClarification.isPending} className="w-full">
              {saveClarification.isPending ? 'Saving...' : 'Save Requirements & Generate PRD'}
            </Button>
          )}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={isLoading || !inputValue.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
 