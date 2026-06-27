import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/routers/_app';
import { createContext } from '@/server/trpc/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(),
    onError: ({ error, path }) => {
      console.error(`[tRPC Error] ${path}:`, error);
    },
  });

export { handler as GET, handler as POST };
