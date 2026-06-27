import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { headers } from 'next/headers';

export interface CreateContextOptions {
  session: Awaited<ReturnType<typeof auth.api.getSession>> | null;
}

export const createTRPCContext = async (opts: { headers: Headers }): Promise<CreateContextOptions> => {
  const session = await auth.api.getSession({
    headers: opts.headers,
  });

  return {
    session,
  };
};

export const createContext = async () => {
  const heads = await headers();
  return createTRPCContext({
    headers: heads,
  });
};

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
