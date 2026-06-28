'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2, Settings, Mail, Clock, Crown, Shield, User } from 'lucide-react';
import { trpc } from '@/trpc/client';

const ROLE_CONFIG: Record<string, { style: string; icon: React.ReactNode }> = {
  OWNER: { style: 'bg-violet-500/10 text-violet-400 border-violet-500/30', icon: <Crown className="w-3 h-3" /> },
  ADMIN: { style: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: <Shield className="w-3 h-3" /> },
  MEMBER: { style: 'bg-zinc-800 text-zinc-400 border-zinc-700', icon: <User className="w-3 h-3" /> },
};

export default function TeamPage() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');

  const { data: organization, isLoading } = trpc.organization.getById.useQuery(
    { id: orgId! }, { enabled: !!orgId }
  );
  const { data: pendingInvites } = trpc.organization.getPendingInvitations.useQuery(undefined, { enabled: !!orgId });

  if (!orgId) return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-zinc-600" />
        </div>
        <p className="text-zinc-400 font-medium">No Organization Selected</p>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
    </div>
  );

  const canManage = organization?.role === 'OWNER' || organization?.role === 'ADMIN';
  const orgInvites = pendingInvites?.filter((i) => i.organizationId === orgId) || [];

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team</h1>
            <p className="text-zinc-500 mt-1">{organization?.name} team members</p>
          </div>
          {canManage && (
            <Link href={`/dashboard/settings?org=${orgId}`}
              className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
              <Settings className="w-4 h-4" />Manage Team
            </Link>
          )}
        </div>

        {/* Pending Invites */}
        {orgInvites.length > 0 && canManage && (
          <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-amber-500/10 flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-white text-sm">Pending Invitations</h2>
              <span className="ml-auto text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5">{orgInvites.length}</span>
            </div>
            <div className="p-4 space-y-2">
              {orgInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-white">{invite.email}</p>
                    <p className="text-xs text-zinc-500">Invited as {invite.role}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <Clock className="w-3 h-3" />
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members */}
        <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-400" />
            <h2 className="font-semibold text-white text-sm">Members ({organization?.memberships.length})</h2>
          </div>
          <div className="p-4 space-y-2">
            {organization?.memberships.map((m) => {
              const roleConf = ROLE_CONFIG[m.role] || ROLE_CONFIG.MEMBER;
              return (
                <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/30 border border-zinc-800/50 hover:border-zinc-700 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">
                      {m.user.name?.[0]?.toUpperCase() || m.user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{m.user.name || 'No name'}</p>
                      <p className="text-xs text-zinc-500">{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${roleConf.style} flex items-center gap-1 text-xs border`}>
                      {roleConf.icon}{m.role}
                    </Badge>
                    <span className="text-xs text-zinc-600">Joined {new Date(m.joinedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}