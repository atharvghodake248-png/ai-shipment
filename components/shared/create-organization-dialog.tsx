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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to manage your workspaces and collaborate with your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                placeholder="Acme Corporation"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="acme-corporation"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={createMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs and API integrations. Only lowercase letters, numbers, and hyphens.
              </p>
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
