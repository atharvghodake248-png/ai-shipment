'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import {
  Zap, LayoutDashboard, FolderKanban, FolderOpen, Settings, LogOut,
  Loader2, Plus, ChevronRight, Users, Github, Webhook, Crown,
} from 'lucide-react';
import { WorkspaceSwitcher } from '@/components/shared/workspace-switcher';
import { CreateOrganizationDialog } from '@/components/shared/create-organization-dialog';
import { CreateWorkspaceDialog } from '@/components/shared/create-workspace-dialog';
import { trpc } from '@/trpc/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const mainNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workspaces', href: '/dashboard/workspaces', icon: FolderKanban },
  { name: 'Team', href: '/dashboard/team', icon: Users },
];

function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentOrgId = searchParams.get('org') || undefined;
  const { data: session, isPending } = useSession();
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [workspacesOpen, setWorkspacesOpen] = useState(true);

  const { data: organizations } = trpc.organization.list.useQuery(undefined, { enabled: !!session });
  const defaultOrgId = currentOrgId || organizations?.[0]?.id;
  const { data: workspaces } = trpc.workspace.list.useQuery(
    { organizationId: defaultOrgId! }, { enabled: !!defaultOrgId }
  );

  const navLink = (href: string) => defaultOrgId ? `${href}?org=${defaultOrgId}` : href;
  const isActive = (href: string) => pathname === href;
  const isActivePartial = (seg: string) => pathname.includes(seg);

  return (
    <div className="flex h-full flex-col bg-zinc-950 border-r border-zinc-800/50 w-64">
      {/* Logo */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">ShipFlow AI</span>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className="p-3 border-b border-zinc-800/50">
        <WorkspaceSwitcher currentOrganizationId={currentOrgId} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto px-3 py-4 space-y-1">
        {mainNav.map((item) => (
          <Link key={item.name} href={navLink(item.href)}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive(item.href)
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
            }`}>
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        ))}

        {/* Workspaces */}
        {defaultOrgId && workspaces && workspaces.length > 0 && (
          <Collapsible open={workspacesOpen} onOpenChange={setWorkspacesOpen} className="mt-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-zinc-600 uppercase tracking-widest hover:text-zinc-400 transition-colors">
              <span>Workspaces</span>
              <ChevronRight className={`h-3 w-3 transition-transform ${workspacesOpen ? 'rotate-90' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-1">
              {workspaces.map((ws) => (
                <div key={ws.id} className="space-y-0.5">
                  <Link href={`/dashboard/workspaces/${ws.id}?org=${defaultOrgId}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                      pathname === `/dashboard/workspaces/${ws.id}`
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                    }`}>
                    <FolderKanban className="h-4 w-4 shrink-0" />
                    <span className="truncate">{ws.name}</span>
                  </Link>
                  {[
                    { href: `/dashboard/workspaces/${ws.id}/projects`, icon: FolderOpen, label: 'Projects', seg: `/workspaces/${ws.id}/projects` },
                    { href: `/dashboard/workspaces/${ws.id}/github`, icon: Github, label: 'GitHub', seg: `/workspaces/${ws.id}/github` },
                    { href: `/dashboard/workspaces/${ws.id}/github/webhooks`, icon: Webhook, label: 'Webhooks', seg: `/workspaces/${ws.id}/github/webhooks` },
                  ].map((sub) => (
                    <Link key={sub.label} href={`${sub.href}?org=${defaultOrgId}`}
                      className={`flex items-center gap-3 pl-9 pr-3 py-1.5 rounded-xl text-sm transition-all ${
                        isActivePartial(sub.seg)
                          ? 'text-violet-400 bg-violet-600/10'
                          : 'text-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-400'
                      }`}>
                      <sub.icon className="h-3.5 w-3.5" />
                      <span>{sub.label}</span>
                    </Link>
                  ))}
                </div>
              ))}
              <button onClick={() => setCreateWorkspaceOpen(true)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-400 transition-all">
                <Plus className="h-4 w-4" /><span>Add workspace</span>
              </button>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Bottom nav */}
        <div className="pt-4 border-t border-zinc-800/50 mt-4 space-y-0.5">
          {[
            { href: '/dashboard/billing', icon: Crown, label: 'Billing', seg: '/billing' },
            { href: '/dashboard/settings', icon: Settings, label: 'Settings', seg: '/settings' },
          ].map((item) => (
            <Link key={item.label} href={navLink(item.href)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isActivePartial(item.seg)
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
              }`}>
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-zinc-800/50 p-4">
        {isPending ? (
          <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-zinc-600" /></div>
        ) : session ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {session.user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
                <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
              </div>
            </div>
            <button onClick={() => signOut()}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 transition-all">
              <LogOut className="h-4 w-4" />Sign Out
            </button>
          </div>
        ) : null}
      </div>

      <CreateOrganizationDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
      {defaultOrgId && (
        <CreateWorkspaceDialog open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} organizationId={defaultOrgId} />
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
      </div>
    </div>
  );

  if (!session) return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B]">
      <div className="text-center">
        <p className="text-zinc-400 mb-4">Please sign in to access the dashboard</p>
        <Link href="/signin" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-all">
          Sign In
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#09090B]">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}