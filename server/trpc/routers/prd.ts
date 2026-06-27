import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../base';
import { db } from '@/server/db';

export const prdRouter = createTRPCRouter({
  save: protectedProcedure
    .input(z.object({
      featureId: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.pRD.upsert({
        where: { featureId: input.featureId },
        create: {
          content: input.content,
          featureId: input.featureId,
          createdById: ctx.user.id,
        },
        update: {
          content: input.content,
        },
      });
    }),

  getByFeature: protectedProcedure
    .input(z.object({ featureId: z.string() }))
    .query(async ({ ctx, input }) => {
      return db.pRD.findUnique({
        where: { featureId: input.featureId },
      });
    }),
});