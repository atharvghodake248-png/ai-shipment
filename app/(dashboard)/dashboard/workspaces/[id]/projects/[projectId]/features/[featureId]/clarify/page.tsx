// @ts-nocheck
'use client';

import { use, useState, useRef, useEffect } from 'react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
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

  const { data: feature } = trpc.feature.getById.useQuery(
    { id: featureId },
    { enabled: !!featureId }
  );
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
        body: JSON.stringify({ messages: newMessages, featureTitle: feature?.title, featureDescription: feature?.description }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.content }]);
    } catch { toast.error('Failed to get AI response'); }
    finally { setIsLoading(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isReadyForPRD = messages.some(m => m.role === 'assistant' && m.content.includes('Ready to generate PRD'));

  const handleSave = () => {
    const summary = messages.filter(m => m.role === 'assistant').map(m => m.content).join('\n\n');
    saveClarification.mutate({ id: featureId, aiClarification: summary });
  };

  if (!featureId) return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#09090B] text-white">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800 shrink-0">
        <Link href={`/dashboard/workspaces/${workspaceId}/projects/${projectId}?org=${orgId}`}>
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1" />Back
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold">AI Requirement Clarification</h1>
            {feature && <p className="text-xs text-zinc-400">{feature.title}</p>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Bot className="w-7 h-7 text-zinc-500" />
            </div>
            <div>
              <p className="text-zinc-300 font-semibold mb-1">Start the conversation</p>
              <p className="text-zinc-500 text-sm">Describe your feature and I'll ask the right questions</p>
            </div>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
              m.role === 'user'
                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-lg shadow-violet-500/20'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
            }`}>
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-zinc-300" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-zinc-800 px-6 py-4 shrink-0 space-y-3">
        {isReadyForPRD && (
          <Button onClick={handleSave} disabled={saveClarification.isPending}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl py-3 font-semibold shadow-xl shadow-violet-500/20 hover:-translate-y-0.5 transition-all">
            {saveClarification.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Sparkles className="w-4 h-4 mr-2" />Save Requirements & Generate PRD</>}
          </Button>
        )}
        <div className="flex gap-3">
          <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Describe your feature or answer the AI's questions..."
            disabled={isLoading}
            className="flex-1 bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500 rounded-xl focus:border-violet-500 focus:ring-violet-500/20 h-11" />
          <Button onClick={sendMessage} disabled={isLoading || !inputValue.trim()} size="icon"
            className="w-11 h-11 bg-gradient-to-br from-violet-600 to-indigo-600 hover:opacity-90 rounded-xl shadow-lg shadow-violet-500/20 shrink-0 hover:-translate-y-0.5 transition-all">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}