import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import crypto from 'crypto';
import Groq from 'groq-sdk';
import { Octokit } from '@octokit/rest';

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
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

    if (!repoFullName || !prNumber) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Find repo and verify webhook secret
    const repo = await db.repository.findFirst({
      where: { fullName: repoFullName },
    });

    if (!repo) {
      return NextResponse.json({ error: 'Repo not found' }, { status: 404 });
    }

    const secret = repo.webhookSecret || process.env.WEBHOOK_SECRET!;
    if (signature && !verifySignature(payload, signature, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Create webhook event
    const webhookEvent = await db.webhookEvent.create({
      data: {
        repoFullName,
        prNumber,
        prTitle: prTitle || `PR #${prNumber}`,
        prUrl: prUrl || '',
        action,
        status: 'PROCESSING',
        workspaceId: repo.workspaceId,
      },
    });

    // Get GitHub connection for this workspace
    const connection = await db.gitHubConnection.findFirst({
      where: { userId: repo.createdById },
    });

    if (!connection) {
      await db.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: 'FAILED' },
      });
      return NextResponse.json({ error: 'No GitHub connection' }, { status: 400 });
    }

    // Fetch PR diff
    const octokit = new Octokit({ auth: connection.accessToken });
    const [owner, repoName] = repoFullName.split('/');

    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo: repoName,
      pull_number: prNumber,
      per_page: 10,
    });

    const diffSummary = files
      .map((f) => `File: ${f.filename}\nStatus: ${f.status}\n+${f.additions} -${f.deletions}\n${f.patch?.slice(0, 1500) || ''}`)
      .join('\n\n---\n\n');

    // Generate AI review
    const completion = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are a senior software engineer doing a thorough code review.

PR Title: ${prTitle}
Repository: ${repoFullName}
Trigger: ${action}

Changed Files and Diffs:
${diffSummary}

Provide a detailed code review covering:
1. **Summary** - What this PR does
2. **Issues Found** - Bugs, security issues, performance problems (if any)
3. **Code Quality** - Readability, maintainability, best practices
4. **Suggestions** - Specific improvements with examples
5. **Verdict** - APPROVE / REQUEST CHANGES / NEEDS DISCUSSION

Be specific, reference actual file names and line changes.`,
      }],
    });

    const reviewContent = completion.choices[0].message.content || '';

    // Save review
    const review = await db.webhookReview.create({
      data: {
        content: reviewContent,
        prNumber,
        repoFullName,
        filesReviewed: files.length,
      },
    });

    // Update webhook event as done
    await db.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        status: 'COMPLETED',
        reviewId: review.id,
      },
    });

    return NextResponse.json({
      message: 'Webhook processed',
      eventId: webhookEvent.id,
      reviewId: review.id,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}