import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  });

  const content = completion.choices[0]?.message?.content || '';

  return new Response(JSON.stringify({ content }), {
    headers: { 'Content-Type': 'application/json' },
  });
}