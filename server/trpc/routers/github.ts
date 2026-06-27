import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../base';
import { db } from '@/server/db';
import { Octokit } from '@octokit/rest';
import { TRPCError } from '@trpc/server';

export const githubRouter = createTRPCRouter({
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    return db.gitHubConnection.findUnique({
      where: { userId: ctx.user.id },
    });
  }),

  getAuthUrl: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        scope: 'repo read:user',
        state: input.orgId,
      });
      return {
        url: `https://github.com/login/oauth/authorize?${params.toString()}`,
      };
    }),

  listRepos: protectedProcedure.query(async ({ ctx }) => {
    const connection = await db.gitHubConnection.findUnique({
      where: { userId: ctx.user.id },
    });
    if (!connection) throw new TRPCError({ code: 'NOT_FOUND', message: 'GitHub not connected' });

    const octokit = new Octokit({ auth: connection.accessToken });
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 50,
    });

    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      updatedAt: repo.updated_at,
      language: repo.language,
    }));
  }),

  connectRepo: protectedProcedure
    .input(z.object({
      workspaceId: z.string(),
      githubId: z.string(),
      name: z.string(),
      fullName: z.string(),
      description: z.string().optional(),
      private: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.repository.upsert({
        where: {
          workspaceId_githubId: {
            workspaceId: input.workspaceId,
            githubId: input.githubId,
          },
        },
        create: {
          githubId: input.githubId,
          name: input.name,
          fullName: input.fullName,
          description: input.description,
          private: input.private,
          workspaceId: input.workspaceId,
          createdById: ctx.user.id,
        },
        update: {
          name: input.name,
          fullName: input.fullName,
          description: input.description,
        },
      });
    }),

  listConnectedRepos: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return db.repository.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { createdAt: 'desc' },
      });
    }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    return db.gitHubConnection.delete({ where: { userId: ctx.user.id } });
  }),
});