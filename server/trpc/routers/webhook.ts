import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../base';
import { db } from '@/server/db';
import { Octokit } from '@octokit/rest';
import crypto from 'crypto';

export const webhookRouter = createTRPCRouter({
  register: protectedProcedure
    .input(z.object({
      repoFullName: z.string(),
      workspaceId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const connection = await db.gitHubConnection.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!connection) throw new Error('GitHub not connected');

      const [owner, repo] = input.repoFullName.split('/');
      const octokit = new Octokit({ auth: connection.accessToken });

      const secret = crypto.randomBytes(20).toString('hex');
      const webhookUrl = `${process.env.WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL}/api/github/webhook`;

      const { data: hook } = await octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret,
        },
        events: ['pull_request'],
        active: true,
      });

      await db.repository.update({
        where: {
          workspaceId_githubId: {
            workspaceId: input.workspaceId,
            githubId: (await db.repository.findFirst({
              where: { fullName: input.repoFullName, workspaceId: input.workspaceId },
            }))?.githubId || '',
          },
        },
        data: {
          webhookSecret: secret,
          webhookId: String(hook.id),
        },
      });

      return { success: true, hookId: hook.id };
    }),

  listEvents: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return db.webhookEvent.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { review: true },
      });
    }),

  getReview: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .query(async ({ ctx, input }) => {
      return db.webhookReview.findUnique({
        where: { id: input.reviewId },
      });
    }),

  deleteWebhook: protectedProcedure
    .input(z.object({ repoFullName: z.string(), workspaceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const connection = await db.gitHubConnection.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!connection) throw new Error('GitHub not connected');

      const repo = await db.repository.findFirst({
        where: { fullName: input.repoFullName, workspaceId: input.workspaceId },
      });

      if (repo?.webhookId) {
        const [owner, repoName] = input.repoFullName.split('/');
        const octokit = new Octokit({ auth: connection.accessToken });
        try {
          await octokit.repos.deleteWebhook({
            owner,
            repo: repoName,
            hook_id: parseInt(repo.webhookId),
          });
        } catch {}
      }

      await db.repository.updateMany({
        where: { fullName: input.repoFullName, workspaceId: input.workspaceId },
        data: { webhookSecret: null, webhookId: null },
      });

      return { success: true };
    }),
});