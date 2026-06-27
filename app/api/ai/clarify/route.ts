import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, featureTitle, featureDescription } = await req.json();

  const systemPrompt = `You are a senior product manager helping clarify feature requests before writing a PRD.

The user submitted this feature request:
Title: "${featureTitle}"
Description: "${featureDescription}"

Your job is to ask smart follow-up questions to clarify requirements. Ask ONE question at a time.
Focus on: target users, platforms, edge cases, priority, success metrics, and constraints.
Keep responses short and conversational.
After 4-5 exchanges, summarize the clarified requirements and say "Requirements are now clear. Ready to generate PRD."`;

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}