'use client';
 
import { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
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
import { CreateOrganizationDialog } from '@/components/shared/create-organization-dialog';
 
interface WorkspaceSwitcherProps {
  currentOrganizationId?: string;
}
 
export function WorkspaceSwitcher({ currentOrganizationId }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const { data: organizations, isLoading, refetch } = trpc.organization.list.useQuery();
 
  const currentOrg = organizations?.find((org) => org.id === currentOrganizationId);
 
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            aria-label="Select organization"
            className="w-full justify-between px-3 h-12 text-white hover:bg-zinc-800/70 rounded-xl"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/20">
                {currentOrg?.name?.charAt(0)?.toUpperCase() || <Building2 className="h-4 w-4" />}
              </div>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="truncate text-sm font-medium text-white">
                  {currentOrg?.name || 'Select organization'}
                </span>
                {currentOrg && (
                  <span className="text-xs text-zinc-400">{currentOrg.workspaceCount} workspaces</span>
                )}
              </div>
            </div>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-zinc-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0 bg-zinc-950 border-zinc-800">
          <Command className="bg-zinc-950">
            <CommandInput
              placeholder="Search organization..."
              className="text-white placeholder-zinc-500 border-b border-zinc-800"
            />
            <CommandList>
              <CommandEmpty className="text-zinc-400 text-sm py-4 text-center">
                {isLoading ? 'Loading...' : 'No organization found.'}
              </CommandEmpty>
              <CommandGroup
                heading="Organizations"
                className="text-zinc-500 [&_[cmdk-group-heading]]:text-zinc-500 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest"
              >
                {organizations?.map((org) => (
                  <CommandItem
                    key={org.id}
                    onSelect={() => setOpen(false)}
                    className="cursor-pointer text-zinc-300 aria-selected:bg-zinc-800 aria-selected:text-white rounded-lg"
                  >
                    <Link href={`/dashboard?org=${org.id}`} className="flex items-center gap-2 w-full">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 truncate">{org.name}</span>
                      {org.id === currentOrganizationId && (
                        <Check className="h-4 w-4 text-violet-400" />
                      )}
                    </Link>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator className="bg-zinc-800" />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setCreateOrgOpen(true);
                  }}
                  className="cursor-pointer text-zinc-300 aria-selected:bg-zinc-800 aria-selected:text-white rounded-lg"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Plus className="h-4 w-4 text-violet-400" />
                    <span>Create Organization</span>
                  </div>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
 
      <CreateOrganizationDialog
        open={createOrgOpen}
        onOpenChange={(val) => {
          setCreateOrgOpen(val);
          if (!val) refetch();
        }}
      />
    </>
  );
}
 