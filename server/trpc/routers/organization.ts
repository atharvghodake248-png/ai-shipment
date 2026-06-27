import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../base';
import { db } from '@/server/db';
import { nanoid } from 'nanoid';

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

export const organizationRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await db.membership.findMany({
      where: { userId: ctx.user.id },
      include: {
        organization: {
          include: {
            workspaces: true,
            _count: {
              select: { memberships: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
      memberCount: m.organization._count.memberships,
      workspaceCount: m.organization.workspaces.length,
    }));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await db.membership.findFirst({
        where: {
          organizationId: input.id,
          userId: ctx.user.id,
        },
        include: {
          organization: {
            include: {
              workspaces: true,
              memberships: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true, image: true },
                  },
                },
              },
              _count: {
                select: { memberships: true },
              },
            },
          },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
      }

      return {
        ...membership.organization,
        role: membership.role,
        memberCount: membership.organization._count.memberships,
        workspaceCount: membership.organization.workspaces.length,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = input.slug || generateSlug(input.name);

      const existingSlug = await db.organization.findUnique({
        where: { slug },
      });

      if (existingSlug) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This slug is already taken' });
      }

      const organization = await db.organization.create({
        data: {
          name: input.name,
          slug,
          memberships: {
            create: {
              userId: ctx.user.id,
              role: 'OWNER',
            },
          },
          workspaces: {
            create: {
              name: 'Default',
              slug: 'default',
            },
          },
        },
        include: {
          workspaces: true,
        },
      });

      return organization;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        logo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.membership.findFirst({
        where: {
          organizationId: input.id,
          userId: ctx.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to update this organization' });
      }

      const organization = await db.organization.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.logo !== undefined && { logo: input.logo }),
        },
      });

      return organization;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await db.membership.findFirst({
        where: {
          organizationId: input.id,
          userId: ctx.user.id,
          role: 'OWNER',
        },
      });

      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the owner can delete an organization' });
      }

      await db.organization.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  invite: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.string().email(),
        role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).default('MEMBER'),
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
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to invite members' });
      }

      const existingMember = await db.membership.findFirst({
        where: {
          organizationId: input.organizationId,
          user: { email: input.email },
        },
      });

      if (existingMember) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'User is already a member' });
      }

      const existingInvite = await db.invitation.findFirst({
        where: {
          organizationId: input.organizationId,
          email: input.email,
        },
      });

      if (existingInvite) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invitation already sent' });
      }

      const token = nanoid(32);

      const invitation = await db.invitation.create({
        data: {
          organizationId: input.organizationId,
          email: input.email,
          role: input.role,
          token,
          invitedBy: ctx.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return invitation;
    }),

  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await db.invitation.findUnique({
        where: { token: input.token },
      });

      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found' });
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invitation has expired' });
      }

      const user = await db.user.findUnique({
        where: { email: invitation.email },
      });

      if (!user || user.id !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'This invitation is not for you' });
      }

      await db.membership.create({
        data: {
          organizationId: invitation.organizationId,
          userId: ctx.user.id,
          role: invitation.role,
        },
      });

      await db.invitation.delete({
        where: { id: invitation.id },
      });

      return { success: true, organizationId: invitation.organizationId };
    }),

  getPendingInvitations: protectedProcedure.query(async ({ ctx }) => {
    const invitations = await db.invitation.findMany({
      where: { email: ctx.user.email },
      include: {
        organization: {
          select: { id: true, name: true, logo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations;
  }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
        role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminMembership = await db.membership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!adminMembership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to update member roles' });
      }

      const targetMembership = await db.membership.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: input.userId,
          },
        },
      });

      if (!targetMembership) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Membership not found' });
      }

      // Only owner can change roles to/from owner
      if (
        (input.role === 'OWNER' || targetMembership.role === 'OWNER') &&
        adminMembership.role !== 'OWNER'
      ) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the owner can manage owner role changes' });
      }

      const updated = await db.membership.update({
        where: { id: targetMembership.id },
        data: { role: input.role },
      });

      return updated;
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminMembership = await db.membership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.user.id,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!adminMembership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to remove members' });
      }

      const targetMembership = await db.membership.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: input.userId,
          },
        },
      });

      if (!targetMembership) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Membership not found' });
      }

      // Cannot remove owner unless you're the owner
      if (targetMembership.role === 'OWNER' && adminMembership.role !== 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot remove the owner' });
      }

      // Cannot remove yourself if you're the owner
      if (input.userId === ctx.user.id && targetMembership.role === 'OWNER') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Owner cannot remove themselves. Transfer ownership first.' });
      }

      await db.membership.delete({
        where: { id: targetMembership.id },
      });

      return { success: true };
    }),
});
