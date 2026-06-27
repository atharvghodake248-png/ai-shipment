import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../base';
import { db } from '@/server/db';
import Groq from 'groq-sdk';

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const taskRouter = createTRPCRouter({
  generate: protectedProcedure
    .input(z.object({ featureId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const feature = await db.featureRequest.findUnique({
        where: { id: input.featureId },
        include: { prd: true },
      });

      if (!feature) throw new Error('Feature not found');

      const completion = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `You are a senior engineering manager. Break this feature into engineering tasks.

Feature: ${feature.title}
Description: ${feature.description}
PRD: ${feature.prd?.content || 'Not generated yet'}

Generate 5-8 specific engineering tasks. Respond ONLY with a JSON array, no markdown, no explanation:
[
  {"title": "Task title", "description": "What needs to be done"},
  ...
]`,
        }],
      });

      const text = completion.choices[0].message.content || '[]';
      const clean = text.replace(/```json|```/g, '').trim();
      const taskList = JSON.parse(clean);

      await db.task.deleteMany({ where: { featureId: input.featureId } });

      const tasks = await Promise.all(
        taskList.map((task: { title: string; description: string }, index: number) =>
          db.task.create({
            data: {
              title: task.title,
              description: task.description,
              status: 'TODO',
              order: index,
              featureId: input.featureId,
              createdById: ctx.user.id,
            },
          })
        )
      );

      return tasks;
    }),

  list: protectedProcedure
    .input(z.object({ featureId: z.string() }))
    .query(async ({ ctx, input }) => {
      return db.task.findMany({
        where: { featureId: input.featureId },
        orderBy: { order: 'asc' },
      });
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.task.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return db.task.delete({ where: { id: input.id } });
    }),
});