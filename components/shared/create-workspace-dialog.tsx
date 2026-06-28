'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export function CreateWorkspaceDialog({ open, onOpenChange, organizationId }: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);

  const createMutation = trpc.workspace.create.useMutation({
    onSuccess: () => {
      toast.success('Workspace created!');
      onOpenChange(false);
      setName(''); setSlug(''); setDescription('');
      router.refresh();
    },
    onError: (e) => toast.error(e.message || 'Failed to create workspace'),
  });

  const handleNameChange = (v: string) => {
    setName(v);
    if (!isCustomSlug) setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ organizationId, name, slug: slug || undefined, description: description || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Create Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-sm">Workspace Name</Label>
            <Input value={name} onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Production" disabled={createMutation.isPending}
              className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:border-violet-500" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-sm">Slug</Label>
            <Input value={slug} onChange={(e) => { setSlug(e.target.value); setIsCustomSlug(true); }}
              placeholder="production" disabled={createMutation.isPending}
              className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:border-violet-500 font-mono" />
            <p className="text-xs text-zinc-600">Only lowercase letters, numbers, and hyphens.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-sm">Description <span className="text-zinc-600">(optional)</span></Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of this workspace..." disabled={createMutation.isPending} rows={3}
              className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:border-violet-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => onOpenChange(false)}
              className="flex-1 h-10 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-all">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending || !name.trim()}
              className="flex-1 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}