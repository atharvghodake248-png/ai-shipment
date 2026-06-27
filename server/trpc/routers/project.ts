import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../base';
import { db } from '@/server/db';

export const projectRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      workspaceId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.project.create({
        data: {
          name: input.name,
          description: input.description,
          workspaceId: input.workspaceId,
        },
      });
    }),

  list: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return db.project.findMany({
        where: { workspaceId: input.workspaceId },
        include: { _count: { select: { features: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await db.project.findUnique({
        where: { id: input.id },
        include: {
          features: { orderBy: { createdAt: 'desc' } },
          _count: { select: { features: true } },
        },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      return project;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return db.project.delete({ where: { id: input.id } });
    }),
});