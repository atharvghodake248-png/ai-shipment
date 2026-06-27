import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../base';
import { db } from '@/server/db';
import { Octokit } from '@octokit/rest';
import { TRPCError } from '@trpc/server';
import Groq from 'groq-sdk';

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const codeReviewRouter = createTRPCRouter({
  listPRs: protectedProcedure
    .input(z.object({ repoFullName: z.string() }))
    .query(async ({ ctx, input }) => {
      const connection = await db.gitHubConnection.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!connection) throw new TRPCError({ code: 'NOT_FOUND', message: 'GitHub not connected' });

      const octokit = new Octokit({ auth: connection.accessToken });
      const [owner, repo] = input.repoFullName.split('/');

      const { data } = await octokit.pulls.list({
        owner,
        repo,
        state: 'open',
        per_page: 20,
      });

      return data.map((pr) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        user: pr.user?.login,
        createdAt: pr.created_at,
        url: pr.html_url,
      }));
    }),

  getPRDiff: protectedProcedure
    .input(z.object({
      repoFullName: z.string(),
      prNumber: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const connection = await db.gitHubConnection.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!connection) throw new TRPCError({ code: 'NOT_FOUND', message: 'GitHub not connected' });

      const octokit = new Octokit({ auth: connection.accessToken });
      const [owner, repo] = input.repoFullName.split('/');

      const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: input.prNumber,
        per_page: 10,
      });

      return files.map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch?.slice(0, 3000) || '',
      }));
    }),

  reviewPR: protectedProcedure
    .input(z.object({
      repoFullName: z.string(),
      prNumber: z.number(),
      prTitle: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const connection = await db.gitHubConnection.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!connection) throw new TRPCError({ code: 'NOT_FOUND', message: 'GitHub not connected' });

      const octokit = new Octokit({ auth: connection.accessToken });
      const [owner, repo] = input.repoFullName.split('/');

      const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: input.prNumber,
        per_page: 10,
      });

      const diffSummary = files
        .map((f) => `File: ${f.filename}\nStatus: ${f.status}\n+${f.additions} -${f.deletions}\n${f.patch?.slice(0, 1500) || ''}`)
        .join('\n\n---\n\n');

      const completion = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `You are a senior software engineer doing a thorough code review.

PR Title: ${input.prTitle}
Repository: ${input.repoFullName}

Changed Files and Diffs:
${diffSummary}

Provide a detailed code review covering:
1. **Summary** - What this PR does
2. **Issues Found** - Bugs, security issues, performance problems (if any)
3. **Code Quality** - Readability, maintainability, best practices
4. **Suggestions** - Specific improvements with examples
5. **Verdict** - APPROVE / REQUEST CHANGES / NEEDS DISCUSSION

Be specific, reference actual file names and line changes. Keep it concise but thorough.`,
        }],
      });

      return {
        review: completion.choices[0].message.content || '',
        filesReviewed: files.length,
      };
    }),
});