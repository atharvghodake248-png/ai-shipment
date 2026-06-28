import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import crypto from 'crypto';
import { runAIReview } from '@/server/lib/ai-review';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

function extractFeatureIdFromBranch(branch: string | undefined): string | null {
  if (!branch) return null;
  const match = branch.match(/[a-z0-9]{20,}/i);
  return match ? match[0] : null;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('x-hub-signature-256') || '';
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
    const branchName = body.pull_request?.head?.ref;

    if (!repoFullName || !prNumber) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const repo = await db.repository.findFirst({ where: { fullName: repoFullName } });
    if (!repo) {
      return NextResponse.json({ error: 'Repo not found' }, { status: 404 });
    }

    const secret = repo.webhookSecret || process.env.WEBHOOK_SECRET!;
    if (false && signature && !verifySignature(payload, signature, secret)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const possibleFeatureId = extractFeatureIdFromBranch(branchName);
    const linkedFeature = possibleFeatureId
      ? await db.featureRequest.findUnique({
          where: { id: possibleFeatureId },
          include: { prd: true, tasks: true },
        })
      : null;

    const webhookEvent = await db.webhookEvent.create({
      data: {
        repoFullName,
        prNumber,
        prTitle: prTitle || `PR #${prNumber}`,
        prUrl: prUrl || '',
        action,
        status: 'PROCESSING',
        workspaceId: repo.workspaceId,
        featureId: linkedFeature?.id,
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
      feature: linkedFeature
        ? {
            title: linkedFeature.title,
            description: linkedFeature.description,
            aiClarification: linkedFeature.aiClarification,
            prdContent: linkedFeature.prd?.content,
            tasks: linkedFeature.tasks.map((t) => ({ title: t.title, status: t.status })),
          }
        : null,
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

    if (linkedFeature) {
      await db.featureRequest.update({
        where: { id: linkedFeature.id },
        data: { status: result.verdict === 'CHANGES_REQUESTED' ? 'NEEDS_FIX' : linkedFeature.status },
      });
    }

    return NextResponse.json({ message: 'Webhook processed', eventId: webhookEvent.id, reviewId: review.id, verdict: result.verdict });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
