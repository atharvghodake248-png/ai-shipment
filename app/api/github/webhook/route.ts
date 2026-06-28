import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { runAIReview } from '@/server/lib/ai-review';

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

    const webhookEvent = await db.webhookEvent.create({
      data: {
        repoFullName,
        prNumber,
        prTitle: prTitle || 'PR #' + prNumber,
        prUrl: prUrl || '',
        action,
        status: 'PROCESSING',
        workspaceId: repo.workspaceId,
      },
    });

    const connection = await db.gitHubConnection.findFirst({
      where: { userId: repo.createdById },
    });

    if (!connection) {
      await db.webhookEvent.update({ where: { id: webhookEvent.id }, data: { status: 'FAILED' } });
      return NextResponse.json({ error: 'No GitHub connection' }, { status: 400 });
    }

    const result = await runAIReview({
      accessToken: connection.accessToken,
      repoFullName,
      prNumber,
      prTitle,
      action,
      feature: null,
    });

    const review = await db.webhookReview.create({
      data: {
        content: result.summary,
        verdict: result.verdict,
        blockingIssues: JSON.stringify(result.blockingIssues),
        nonBlockingIssues: JSON.stringify(result.nonBlockingIssues),
        prNumber,
        repoFullName,
        filesReviewed: result.filesReviewed,
      },
    });

    await db.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: 'COMPLETED', reviewId: review.id },
    });

    return NextResponse.json({ message: 'OK', verdict: result.verdict });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}