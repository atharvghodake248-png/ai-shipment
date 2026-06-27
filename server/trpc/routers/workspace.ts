import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../base';
import { db } from '@/server/db';

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

export const workspaceRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await db.membership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.user.id,
        },
      });

      if (!membership) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
      }

      const workspaces = await db.workspace.findMany({
        where: { organizationId: input.organizationId },
        orderBy: { createdAt: 'asc' },
      });

      return workspaces;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspace = await db.workspace.findUnique({
        where: { id: input.id },
        include: {
          organization: {
            include: {
              memberships: {
                where: { userId: ctx.user.id },
              },
            },
          },
        },
      });

      if (!workspace) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found' });
      }

      if (workspace.organization.memberships.length === 0) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this workspace' });
      }

      return {
        ...workspace,
        role: workspace.organization.memberships[0].role,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.membership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to create workspaces' });
      }

      const slug = input.slug || generateSlug(input.name);

      const existingWorkspace = await db.workspace.findFirst({
        where: {
          organizationId: input.organizationId,
          slug,
        },
      });

      if (existingWorkspace) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'A workspace with this slug already exists' });
      }

      const workspace = await db.workspace.create({
        data: {
          organizationId: input.organizationId,
          name: input.name,
          slug,
          description: input.description,
        },
      });

      return workspace;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workspace = await db.workspace.findUnique({
        where: { id: input.id },
        include: {
          organization: {
            include: {
              memberships: {
                where: { userId: ctx.user.id },
              },
            },
          },
        },
      });

      if (!workspace) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found' });
      }

      const membership = workspace.organization.memberships[0];

      if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to update this workspace' });
      }

      const updated = await db.workspace.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
        },
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workspace = await db.workspace.findUnique({
        where: { id: input.id },
        include: {
          organization: {
            include: {
              memberships: {
                where: { userId: ctx.user.id },
              },
            },
          },
        },
      });

      if (!workspace) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found' });
      }

      const membership = workspace.organization.memberships[0];

      if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to delete this workspace' });
      }

      // Prevent deleting the last workspace
      const workspaceCount = await db.workspace.count({
        where: { organizationId: workspace.organizationId },
      });

      if (workspaceCount === 1) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot delete the last workspace' });
      }

      await db.workspace.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
