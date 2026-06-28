import { Octokit } from '@octokit/rest';
import Groq from 'groq-sdk';

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface AIReviewResult {
  summary: string;
  blockingIssues: string[];
  nonBlockingIssues: string[];
  verdict: 'APPROVED' | 'CHANGES_REQUESTED' | 'NEEDS_DISCUSSION';
  filesReviewed: number;
}

export async function runAIReview(params: {
  accessToken: string;
  repoFullName: string;
  prNumber: number;
  prTitle: string;
  action: string;
  feature?: {
    title: string;
    description: string;
    aiClarification?: string | null;
    prdContent?: string | null;
    tasks?: { title: string; status: string }[];
  } | null;
}): Promise<AIReviewResult> {
  const { accessToken, repoFullName, prNumber, prTitle, action, feature } = params;
  const octokit = new Octokit({ auth: accessToken });
  const [owner, repoName] = repoFullName.split('/');

  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo: repoName,
    pull_number: prNumber,
    per_page: 15,
  });

  const diffSummary = files
    .map((f) => 'File: ' + f.filename + '\nStatus: ' + f.status + '\n+' + f.additions + ' -' + f.deletions + '\n' + (f.patch?.slice(0, 1500) || ''))
    .join('\n\n---\n\n');

  const featureContext = feature
    ? '\nThis PR is linked to a product feature. Judge the implementation against this PRD and acceptance criteria.\n\nFeature: ' + feature.title + '\nDescription: ' + feature.description + '\n' + (feature.aiClarification ? 'Clarified Requirements:\n' + feature.aiClarification + '\n' : '') + (feature.prdContent ? 'PRD:\n' + feature.prdContent + '\n' : '') + (feature.tasks?.length ? 'Engineering Tasks:\n' + feature.tasks.map((t) => '- [' + t.status + '] ' + t.title).join('\n') + '\n' : '')
    : '\nNo linked feature/PRD found - review based on general code quality only.\n';

  const prompt = 'You are a senior QA + engineering reviewer.\n\nPR Title: ' + prTitle + '\nRepository: ' + repoFullName + '\nTrigger: ' + action + '\n' + featureContext + '\nChanged Files and Diffs:\n' + diffSummary + '\n\nRespond with ONLY valid JSON in exactly this shape:\n{\n  "summary": "2-4 sentence summary",\n  "blockingIssues": ["issue that MUST be fixed"],\n  "nonBlockingIssues": ["minor suggestion"],\n  "verdict": "APPROVED"\n}\n\nverdict must be one of: APPROVED, CHANGES_REQUESTED, NEEDS_DISCUSSION\nverdict must be CHANGES_REQUESTED if blockingIssues is non-empty.';

  const completion = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  const raw = completion.choices[0].message.content || '{}';

  let parsed: any = {};
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    parsed = { summary: raw.slice(0, 500), blockingIssues: [], nonBlockingIssues: [], verdict: 'NEEDS_DISCUSSION' };
  }

  const verdict: AIReviewResult['verdict'] = ['APPROVED', 'CHANGES_REQUESTED', 'NEEDS_DISCUSSION'].includes(parsed.verdict)
    ? parsed.verdict
    : Array.isArray(parsed.blockingIssues) && parsed.blockingIssues.length > 0
    ? 'CHANGES_REQUESTED'
    : 'NEEDS_DISCUSSION';

  return {
    summary: parsed.summary || 'No summary returned.',
    blockingIssues: Array.isArray(parsed.blockingIssues) ? parsed.blockingIssues : [],
    nonBlockingIssues: Array.isArray(parsed.nonBlockingIssues) ? parsed.nonBlockingIssues : [],
    verdict,
    filesReviewed: files.length,
  };
}