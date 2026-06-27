import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from './context';

export const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

import { TRPCError } from '@trpc/server';
