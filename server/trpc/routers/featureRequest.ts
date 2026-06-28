import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../base';
import { db } from '@/server/db';

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const statusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'DONE', 'CLOSED']);

export const featureRequestRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      priority: priorityEnum.default('MEDIUM'),
      status: statusEnum.default('OPEN'),
      customer: z.string().optional(),
      projectId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.featureRequest.create({
        data: {
          title: input.title,
          description: input.description,
          priority: input.priority,
          status: input.status,
          customer: input.customer,
          projectId: input.projectId,
          createdById: ctx.user.id,
        },
      });
    }),
  getById: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const feature = await db.featureRequest.findUnique({
      where: { id: input.id },
    });

    if (!feature) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Feature not found' });
    }

    return feature;
  }),

  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      return db.featureRequest.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: 'desc' },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      priority: priorityEnum.optional(),
      status: statusEnum.optional(),
      customer: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return db.featureRequest.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return db.featureRequest.delete({ where: { id: input.id } });
    }),

    saveClarification: protectedProcedure
  .input(z.object({
    id: z.string(),
    aiClarification: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    return db.featureRequest.update({
      where: { id: input.id },
      data: { aiClarification: input.aiClarification },
    });
  }),
updateStatus: protectedProcedure
  .input(z.object({ id: z.string(), status: z.string() }))
  .mutation(async ({ ctx, input }) => {
    return db.featureRequest.update({
      where: { id: input.id },
      data: { status: input.status },
    });
  }),
});