'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { trpc } from '@/trpc/client';

interface WorkspaceSwitcherProps {
  currentOrganizationId?: string;
}

export function WorkspaceSwitcher({ currentOrganizationId }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const { data: organizations, isLoading } = trpc.organization.list.useQuery();

  const currentOrg = organizations?.find((org) => org.id === currentOrganizationId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label="Select organization"
          className="w-full justify-between px-3 h-12"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              {currentOrg?.name?.charAt(0)?.toUpperCase() || <Building2 className="h-4 w-4" />}
            </div>
            <div className="flex flex-col items-start overflow-hidden">
              <span className="truncate text-sm font-medium">{currentOrg?.name || 'Select organization'}</span>
              {currentOrg && (
                <span className="text-xs text-muted-foreground">{currentOrg.workspaceCount} workspaces</span>
              )}
            </div>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0">
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Loading...' : 'No organization found.'}
            </CommandEmpty>
            <CommandGroup heading="Organizations">
              {organizations?.map((org) => (
                <CommandItem
                  key={org.id}
                  onSelect={() => {
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Link href={`/dashboard?org=${org.id}`} className="flex items-center gap-2 w-full">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-semibold">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 truncate">{org.name}</span>
                    {org.id === currentOrganizationId && (
                      <Check className="h-4 w-4" />
                    )}
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={() => setOpen(false)}>
                <Link href="/dashboard/new-organization" className="flex items-center gap-2 w-full">
                  <Plus className="h-4 w-4" />
                  <span>Create Organization</span>
                </Link>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
