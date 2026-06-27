import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export const maxDuration = 60;

export async function POST(req: Request) {
  const { featureTitle, featureDescription, aiClarification } = await req.json();

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    prompt: `You are a senior product manager. Generate a comprehensive PRD for this feature.

Feature Title: ${featureTitle}
Feature Description: ${featureDescription}
Clarified Requirements: ${aiClarification || 'None provided'}

Write the PRD in this exact markdown format:

# ${featureTitle}

## Problem Statement
[What problem does this solve and why it matters]

## Goals
- [Goal 1]
- [Goal 2]
- [Goal 3]

## Non-Goals
- [What this feature will NOT do]

## User Stories
- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
- [ ] [Criterion 4]
- [ ] [Criterion 5]

## Edge Cases
- [Edge case 1 and how to handle it]
- [Edge case 2 and how to handle it]

## Success Metrics
- [Metric 1: how to measure success]
- [Metric 2: how to measure success]

## Technical Notes
- [Any technical constraints or implementation notes]`,
  });

  return new Response(result.textStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}