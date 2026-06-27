import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { headers } from 'next/headers';
import { db } from '@/server/db';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const orgId = req.nextUrl.searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?error=no_code', req.url));
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return NextResponse.redirect(new URL('/dashboard?error=no_token', req.url));
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const githubUser = await userRes.json();

  await db.gitHubConnection.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      accessToken,
      githubLogin: githubUser.login,
      githubId: String(githubUser.id),
    },
    update: {
      accessToken,
      githubLogin: githubUser.login,
      githubId: String(githubUser.id),
    },
  });

  return NextResponse.redirect(
    new URL(`/dashboard?org=${orgId}&github=connected`, req.url)
  );
}