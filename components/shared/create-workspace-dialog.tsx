'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    onSuccess: (data) => {
      toast.success('Workspace created successfully');
      onOpenChange(false);
      setName('');
      setSlug('');
      setDescription('');
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create workspace');
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
    createMutation.mutate({
      organizationId,
      name,
      slug: slug || undefined,
      description: description || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace for your organization to organize shipments and projects.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                placeholder="Production"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="production"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={createMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs. Only lowercase letters, numbers, and hyphens.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Description of this workspace..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={createMutation.isPending}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}