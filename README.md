ShipFlow AI 🚀

An AI-powered product delivery platform that helps software teams move features from idea to production through a structured workflow.

Live Demo: https://ai-shipment.vercel.app

GitHub: https://github.com/atharvghodake248-png/ai-shipment

###
###
###

<---
htttpps;//// aaaaaaaaaaaa
aaaaaa
ahttppppps:::::////
--->


What is ShipFlow AI?

ShipFlow AI manages the entire software delivery lifecycle:

Feature Request → AI Clarification → PRD → Tasks → GitHub → AI Review → Human Approval → Shipped


Tech Stack

LayerTechnologyFrontendNext.js 16 (App Router)APItRPC (type-safe end-to-end)UIShadcn UI + Tailwind CSSAuthBetterAuth (email + GitHub OAuth)DatabasePostgreSQL (Supabase)ORMPrismaAIGroq (llama-3.3-70b) via AI SDKGitHubOctokit + GitHub WebhooksAsync JobsInngestPaymentsRazorpayDeploymentVercel


Architecture

┌─────────────────────────────────────────────┐
│                  Next.js App                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth    │  │Dashboard │  │  GitHub  │  │
│  │(BetterAuth) │  Pages   │  │Integration│  │
│  └──────────┘  └──────────┘  └──────────┘  │
│              tRPC API Layer                  │
│  ┌──────────────────────────────────────┐   │
│  │  Routers: org, workspace, project,   │   │
│  │  feature, task, github, billing      │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Prisma  │  │  Groq AI │  │  Inngest │  │
│  │  ORM     │  │  SDK     │  │  Workers │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
         │              │              │
    PostgreSQL      AI Models     Async Jobs
    (Supabase)    (llama-3.3)   (PRD, Review)


AI Features

1. Requirement Clarification


AI asks smart follow-up questions about feature requests
Identifies missing context: target users, edge cases, success metrics
Conversation-based interface powered by Groq llama-3.3-70b


2. PRD Generation


Auto-generates structured Product Requirements Documents
Includes: Problem Statement, Goals, Non-Goals, User Stories, Acceptance Criteria, Edge Cases, Success Metrics


3. Task Breakdown


Converts PRD into engineering tasks automatically
Tasks organized on a Kanban board (TODO → IN_PROGRESS → DONE)
Drag-and-drop task management


4. AI Code Review


Reviews pull requests against PRD requirements
Checks acceptance criteria, security, performance, edge cases
Categorizes issues as Blocking / Non-blocking
Posts review comments back to GitHub



GitHub Integration


OAuth: Connect GitHub account via Octokit
Webhooks: Receive real-time PR events
PR Tracking: Monitor pull request status
Code Analysis: Fetch diffs and analyze changes
AI Review: Review code against PRD requirements
Review Comments: Post AI feedback directly on PRDs


GitHub Setup


Create a GitHub OAuth App at https://github.com/settings/developers
Set Homepage URL: https://your-domain.vercel.app
Set Callback URL: https://your-domain.vercel.app/api/auth/callback/github
Copy Client ID and Secret to environment variables



Inngest Async Workflows

Inngest handles long-running AI tasks that would timeout in serverless functions:

WorkflowTriggerDescriptionprd.generateFeature clarifiedGenerates full PRD documenttasks.createPRD approvedBreaks PRD into engineering tasksreview.startPR opened/updatedTriggers AI code reviewreview.rerunPR updated after fixesRe-reviews updated code

Workflow progress is visible in the dashboard in real-time.


Setup Instructions

Prerequisites


Node.js 18+
PostgreSQL database (Supabase recommended)
GitHub OAuth App
Groq API key
Inngest account


1. Clone the repo

bashgit clone https://github.com/atharvghodake248-png/ai-shipment.git
cd ai-shipment

2. Install dependencies

bashnpm install --legacy-peer-deps

3. Set up environment variables

bashcp .env.example .env
# Fill in all values (see Environment Variables section)

4. Set up database

bashnpx prisma generate
npx prisma db push

5. Run development server

bashnpm run dev

Open http://localhost:3000


Environment Variables

env# Database
DATABASE_URL=postgresql://user:password@host:5432/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://user:password@host:5432/postgres

# Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://your-domain.vercel.app

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# AI
GROQ_API_KEY=your-groq-api-key
ANTHROPIC_API_KEY=your-anthropic-key

# Payments
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Webhooks
WEBHOOK_SECRET=your-webhook-secret
WEBHOOK_URL=https://your-domain.vercel.app/api/github/webhook

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app


Database Schema

Core Models

Organization
  ├── Members (User[])
  └── Workspaces[]
        └── Projects[]
              └── FeatureRequests[]
                    ├── PRD
                    ├── Tasks[]
                    └── AIReviews[]

Repository (GitHub)
  └── Workspace (connected)
        └── PullRequests[]
              └── ReviewHistory[]

Key Tables


organization — Multi-tenant organizations
workspace — Workspace per organization
projects — Projects within workspaces
feature_requests — Feature requests with status (OPEN/IN_PROGRESS/DONE/CLOSED)
tasks — Engineering tasks with Kanban status
repositories — Connected GitHub repos
subscription — Razorpay billing plans



Workflow

1. FEATURE REQUEST
   └── Customer submits feature idea

2. AI CLARIFICATION  
   └── AI asks follow-up questions to gather requirements

3. PRD GENERATION
   └── AI generates structured Product Requirements Document

4. TASK BREAKDOWN
   └── AI converts PRD into Kanban engineering tasks

5. GITHUB CONNECT
   └── Developer links repo, creates PR with implementation

6. AI CODE REVIEW
   └── AI reviews PR against PRD requirements & acceptance criteria
   └── Issues categorized: Blocking / Non-blocking

7. FIX & RE-REVIEW
   └── Developer fixes issues → AI re-reviews automatically

8. HUMAN APPROVAL
   └── Human reviewer approves or rejects the release

9. SHIPPED ✅
   └── Feature marked as shipped


Pages

PageRouteLanding/Sign In/signinSign Up/signupDashboard/dashboardWorkspaces/dashboard/workspacesProjects/dashboard/workspaces/[id]/projectsFeature Requests/dashboard/workspaces/[id]/projects/[projectId]AI Clarify/dashboard/.../features/[featureId]/clarifyPRD/dashboard/.../features/[featureId]/prdTasks (Kanban)/dashboard/.../features/[featureId]/tasksGitHub/dashboard/workspaces/[id]/githubAI Review/dashboard/workspaces/[id]/github/reviewBilling/dashboard/billingTeam/dashboard/team


Deployment

Deployed on Vercel with:


Automatic deployments from main branch
Environment variables configured in Vercel dashboard
Supabase PostgreSQL with Transaction Pooler for serverless connections
Install command: npm install --legacy-peer-deps



Built for ChaiCode Hackathon

ShipFlow AI: Feature to Production — Jun 20–30, 2026


"Builder Mode On | iPhone Giveaway Hackathon" #chaicode
