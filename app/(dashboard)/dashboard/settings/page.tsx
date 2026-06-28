'use client';

import { useSession } from '@/lib/auth-client';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Building2, Crown, Shield } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/trpc/client';

export default function SettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');

  const { data: org } = trpc.organization.getById.useQuery(
    { id: orgId! }, { enabled: !!orgId }
  );

  const roleIcon = org?.role === 'OWNER' ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />;

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-700 flex items-center justify-center">
            <Settings className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-zinc-500 text-sm">Manage your account and organization</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Profile */}
          <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-400" />
              <h2 className="font-semibold text-white text-sm">Profile</h2>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Name', value: session?.user.name },
                { label: 'Email', value: session?.user.email },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                  <span className="text-sm text-zinc-500">{row.label}</span>
                  <span className="text-sm font-medium text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Organization */}
          {org && (
            <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-zinc-400" />
                <h2 className="font-semibold text-white text-sm">Organization</h2>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: 'Name', value: <span className="text-sm font-medium text-white">{org.name}</span> },
                  { label: 'Slug', value: <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 font-mono text-xs">/{org.slug}</Badge> },
                  { label: 'Members', value: <span className="text-sm font-medium text-white">{org.memberCount}</span> },
                  { label: 'Your Role', value: (
                    <Badge className={`flex items-center gap-1 text-xs border ${org.role === 'OWNER' ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                      {roleIcon}{org.role}
                    </Badge>
                  )},
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                    <span className="text-sm text-zinc-500">{row.label}</span>
                    {row.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}