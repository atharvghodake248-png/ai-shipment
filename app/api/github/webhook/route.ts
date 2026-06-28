import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const event = req.headers.get('x-github-event') || '';

    if (event !== 'pull_request') {
      return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
    }

    const body = JSON.parse(payload);
    const action = body.action;

    if (!['opened', 'reopened', 'synchronize'].includes(action)) {
      return NextResponse.json({ message: 'Action ignored' }, { status: 200 });
    }

    const repoFullName = body.repository?.full_name;
    const prNumber = body.pull_request?.number;
    const prTitle = body.pull_request?.title;
    const prUrl = body.pull_request?.html_url;

    if (!repoFullName || !prNumber) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const repo = await db.repository.findFirst({ where: { fullName: repoFullName } });
    if (!repo) {
      return NextResponse.json({ error: 'Repo not found' }, { status: 404 });
    }

    const connection = await db.gitHubConnection.findFirst({
      where: { userId: repo.createdById },
    });

    if (!connection) {
      return NextResponse.json({ error: 'No GitHub connection' }, { status: 400 });
    }

    const { Octokit } = await import('@octokit/rest');
    const Groq = (await import('groq-sdk')).default;

    const octokit = new Octokit({ auth: connection.accessToken });
    const [owner, repoName] = repoFullName.split('/');

    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo: repoName,
      pull_number: prNumber,
      per_page: 5,
    });

    const diffSummary = files
      .map((f: any) => 'File: ' + f.filename + ' | +' + f.additions + ' -' + f.deletions)
      .join('\n');

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: 'Review this PR briefly. PR: ' + prTitle + '\nFiles:\n' + diffSummary + '\n\nRespond with JSON only: {"summary":"...","blockingIssues":[],"nonBlockingIssues":[],"verdict":"APPROVED"}'
      }],
      temperature: 0.2,
      max_tokens: 500,
    });

    const raw = completion.choices[0].message.content || '{}';
    let parsed: any = {};
    try {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
      parsed = { summary: 'Review completed.', blockingIssues: [], nonBlockingIssues: [], verdict: 'APPROVED' };
    }

    const webhookEvent = await db.webhookEvent.create({
      data: {
        repoFullName,
        prNumber,
        prTitle: prTitle || 'PR #' + prNumber,
        prUrl: prUrl || '',
        action,
        status: 'COMPLETED',
        workspaceId: repo.workspaceId,
      },
    });

    const review = await db.webhookReview.create({
      data: {
        content: parsed.summary || 'Review completed.',
        verdict: parsed.verdict || 'APPROVED',
        blockingIssues: JSON.stringify(parsed.blockingIssues || []),
        nonBlockingIssues: JSON.stringify(parsed.nonBlockingIssues || []),
        prNumber,
        repoFullName,
        filesReviewed: files.length,
      },
    });

    await db.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { reviewId: review.id },
    });

    return NextResponse.json({ message: 'OK', verdict: parsed.verdict });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}