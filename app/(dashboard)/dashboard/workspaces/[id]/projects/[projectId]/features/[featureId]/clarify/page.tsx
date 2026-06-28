// @ts-nocheck
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

export default function ClarifyPage({ params }) {
  const { id: workspaceId, projectId, featureId } = use(params);
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const messagesEndRef = useRef(null);
  const [isSaved, setIsSaved] = useState(false);
  const [started, setStarted] = useState(false);
  const { data: feature } = trpc.feature.getById.useQuery({ id: featureId });
  const saveClarification = trpc.feature.saveClarification.useMutation({ onSuccess: () => { setIsSaved(true); toast.success('Requirements saved'); } });
  const { messages, input: inputValue, handleInputChange, handleSubmit, isLoading, append } = useChat({ api: '/api/ai/clarify', body: { featureTitle: feature?.title, featureDescription: feature?.description } });
  useEffect(() => { if (feature && !started && messages.length === 0) { setStarted(true); append({ role: 'user', content: `Please clarify requirements for: "`"`. Description: "`"` }); } }, [feature, started, messages.length]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  const isReadyForPRD = messages.some(m => m.role === 'assistant' && m.content.includes('Ready to generate PRD'));
  const handleSaveAndContinue = () => { saveClarification.mutate({ id: featureId, aiClarification: messages.filter(m => m.role === 'assistant').map(m => m.content).join('\n\n') }); };
  return (<div className="flex flex-col h-screen p-6 max-w-3xl mx-auto"><div className="flex items-center gap-3 mb-4"><Link href={`/dashboard/workspaces/`/projects/`?org=``}><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button></Link><h1 className="text-xl font-bold">AI Requirement Clarification</h1></div><Card className="flex-1 overflow-hidden flex flex-col"><CardContent className="flex-1 overflow-y-auto p-4 space-y-4">{messages.filter(m => m.role === 'assistant').length === 0 && !isLoading && <div className="text-center text-muted-foreground text-sm mt-10">Starting AI clarification...</div>}{messages.map(m => m.role === 'assistant' && (<div key={m.id} className="flex gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="w-4 h-4 text-primary" /></div><div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-slate-100">{m.content}</div></div>))}{messages.map(m => m.role === 'user' && messages.indexOf(m) > 0 && (<div key={m.id+"_u"} className="flex gap-3 justify-end"><div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-primary text-primary-foreground">{m.content}</div></div>))}{isLoading && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="w-4 h-4 text-primary" /></div><div className="bg-slate-100 rounded-2xl px-4 py-3"><Loader2 className="w-4 h-4 animate-spin" /></div></div>}<div ref={messagesEndRef} /></CardContent><div className="border-t p-4"><form onSubmit={handleSubmit} className="flex gap-2"><Input value={inputValue} onChange={handleInputChange} placeholder="Type your answer..." disabled={isLoading} className="flex-1" /><Button type="submit" disabled={isLoading || !inputValue?.trim()} size="icon"><Send className="w-4 h-4" /></Button></form></div></Card></div>);
}