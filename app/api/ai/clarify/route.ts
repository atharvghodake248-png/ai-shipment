import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { messages, featureTitle, featureDescription } = await req.json();

  const systemPrompt = `You are a senior product manager helping clarify feature requests before writing a PRD.
Title: "${featureTitle}"
Description: "${featureDescription}"
Ask ONE question at a time. After 4-5 exchanges say "Requirements are now clear. Ready to generate PRD."`;

  const cleanMessages = messages.map(({ role, content }) => ({ role, content }));

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'system', content: systemPrompt }, ...cleanMessages],
  });

  return Response.json({ content: completion.choices[0]?.message?.content || '' });
}