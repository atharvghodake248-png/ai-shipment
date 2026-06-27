import { appRouter } from './routers/_app';
import { createTRPCRouter, publicProcedure, protectedProcedure } from './base';

export { appRouter, createTRPCRouter, publicProcedure, protectedProcedure };
export type AppRouter = typeof appRouter;
