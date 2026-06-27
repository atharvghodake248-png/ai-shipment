'use client';

import { TRPCProvider } from '@/trpc/provider';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TRPCProvider>{children}</TRPCProvider>;
}