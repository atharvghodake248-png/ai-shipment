'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({ open, onOpenChange }: CreateOrganizationDialogProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);

  const createMutation = trpc.organization.create.useMutation({
    onSuccess: (data) => {
      toast.success('Organization created successfully');
      onOpenChange(false);
      setName('');
      setSlug('');
      router.push(`/dashboard?org=${data.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create organization');
    },
  });

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isCustomSlug) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setIsCustomSlug(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name, slug: slug || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Create Organization</DialogTitle>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Create a new organization to manage your workspaces and collaborate with your team.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name" className="text-zinc-300 text-sm">Organization Name</Label>
              <Input
                id="name"
                placeholder="Acme Corporation"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={createMutation.isPending}
                className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:border-violet-500 focus:ring-violet-500/20"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="slug" className="text-zinc-300 text-sm">Slug</Label>
              <Input
                id="slug"
                placeholder="acme-corporation"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={createMutation.isPending}
                className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl focus:border-violet-500 focus:ring-violet-500/20 font-mono"
              />
              <p className="text-xs text-zinc-500">
                Used in URLs and API integrations. Only lowercase letters, numbers, and hyphens.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
              className="h-10 px-4 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="h-10 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}