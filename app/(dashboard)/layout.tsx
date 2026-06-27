'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  Package,
  LayoutDashboard,
  FolderKanban,
  FolderOpen,
  Building2,
  Settings,
  LogOut,
  Loader2,
  Plus,
  ChevronRight,
  Users,
  Github,
  Webhook,
  Crown,
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

  const { data: organizations } = trpc.organization.list.useQuery(undefined, {
    enabled: !!session,
  });

  const currentOrg = organizations?.find((org) => org.id === currentOrgId);
  const defaultOrgId = currentOrgId || organizations?.[0]?.id;

  const { data: workspaces } = trpc.workspace.list.useQuery(
    { organizationId: defaultOrgId! },
    { enabled: !!defaultOrgId }
  );

  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200 w-64">
      {/* Workspace Switcher */}
      <div className="border-b border-slate-200 p-3">
        <WorkspaceSwitcher currentOrganizationId={currentOrgId} />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-auto px-3 py-4 space-y-1">
        {mainNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={defaultOrgId ? `${item.href}?org=${defaultOrgId}` : item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}

        {/* Workspaces Section */}
        {defaultOrgId && workspaces && workspaces.length > 0 && (
          <Collapsible open={workspacesOpen} onOpenChange={setWorkspacesOpen} className="mt-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground">
              <span>Workspaces</span>
              <ChevronRight
                className={`h-4 w-4 transition-transform ${workspacesOpen ? 'rotate-90' : ''}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {workspaces.map((ws) => (
                <div key={ws.id}>
                  <Link
                    href={`/dashboard/workspaces/${ws.id}?org=${defaultOrgId}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      pathname === `/dashboard/workspaces/${ws.id}`
                        ? 'bg-slate-100 text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
                    }`}
                  >
                    <FolderKanban className="h-4 w-4" />
                    <span className="truncate">{ws.name}</span>
                  </Link>
                  <Link
                    href={`/dashboard/workspaces/${ws.id}/projects?org=${defaultOrgId}`}
                    className={`flex items-center gap-3 pl-9 pr-3 py-2 rounded-lg text-sm transition-colors ${
                      pathname.includes(`/workspaces/${ws.id}/projects`)
                        ? 'bg-slate-100 text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
                    }`}
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span>Projects</span>
                  </Link>
                  <Link
                    href={`/dashboard/workspaces/${ws.id}/github?org=${defaultOrgId}`}
                    className={`flex items-center gap-3 pl-9 pr-3 py-2 rounded-lg text-sm transition-colors ${
                      pathname.includes(`/workspaces/${ws.id}/github`)
                        ? 'bg-slate-100 text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
                    }`}
                  >
                    <Github className="h-4 w-4" />
                    <span>GitHub</span>
                  </Link>
                  <Link
                    href={`/dashboard/workspaces/${ws.id}/github/webhooks?org=${defaultOrgId}`}
                    className={`flex items-center gap-3 pl-9 pr-3 py-2 rounded-lg text-sm transition-colors ${
                      pathname.includes(`/workspaces/${ws.id}/github/webhooks`)
                        ? 'bg-slate-100 text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-slate-50 hover:text-foreground'
                    }`}
            
>
                    <Webhook className="h-4 w-4" />
                    <span>Webhooks</span>
                  </Link>
                </div>
              ))}
              <button
                onClick={() => setCreateWorkspaceOpen(true)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add workspace</span>
              </button>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Settings Link */}
        <div className="pt-4 border-t border-slate-200 mt-4">
          <Link
  href={defaultOrgId ? `/dashboard/billing?org=${defaultOrgId}` : '/dashboard/billing'}
  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    pathname.includes('/billing')
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
  }`}
>
  <Crown className="h-5 w-5" />
  Billing
</Link>
          <Link
            href={defaultOrgId ? `/dashboard/settings?org=${defaultOrgId}` : '/dashboard/settings'}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.includes('/settings')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
            }`}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-200 p-4">
        {isPending ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : session ? (
          <div className="space-y-3">
            <div className="px-3">
              <p className="text-sm font-medium text-foreground truncate">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        ) : null}
      </div>

      {/* Dialogs */}
      <CreateOrganizationDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
      {defaultOrgId && (
        <CreateWorkspaceDialog
          open={createWorkspaceOpen}
          onOpenChange={setCreateWorkspaceOpen}
          organizationId={defaultOrgId}
        />
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to access the dashboard</p>
          <Button asChild>
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}