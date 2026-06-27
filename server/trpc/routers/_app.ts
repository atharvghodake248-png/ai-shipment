import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../base';
import { organizationRouter } from './organization';
import { workspaceRouter } from './workspace';
import { projectRouter } from './project';
import { featureRequestRouter } from './featureRequest';
import { prdRouter } from './prd';
import { taskRouter } from './task';
import { githubRouter } from './github';
import { codeReviewRouter } from './codeReview';
import { webhookRouter } from './webhook';
import { billingRouter } from './billing';


export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
  updateName: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      return { success: true, name: input.name };
    }),
});

export const appRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string().optional() }))
    .query(({ input }) => {
      return { greeting: `Hello, ${input.text ?? 'World'}!` };
    }),
  user: userRouter,
  organization: organizationRouter,
  workspace: workspaceRouter,
  project: projectRouter,
  github: githubRouter,
  feature: featureRequestRouter,
  prd: prdRouter,
  task: taskRouter,
  codeReview: codeReviewRouter,
  webhook: webhookRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;