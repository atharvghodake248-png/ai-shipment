'use client';
 
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  GitPullRequest,
  Sparkles,
  CheckCircle,
  Layers,
  Zap,
  Shield,
  Users,
  ChevronRight,
  Github,
  Star,
} from 'lucide-react';
 
const STEPS = [
  { icon: Layers, label: 'Feature Request', desc: 'Submit any idea — email, ticket, or message' },
  { icon: Sparkles, label: 'AI Clarification', desc: 'Agent asks smart follow-up questions' },
  { icon: CheckCircle, label: 'PRD Generation', desc: 'Structured product requirements in seconds' },
  { icon: Zap, label: 'Task Breakdown', desc: 'Engineering tasks auto-created on Kanban' },
  { icon: Github, label: 'GitHub Connect', desc: 'Link your repo and track pull requests' },
  { icon: GitPullRequest, label: 'AI Code Review', desc: 'Review PRs against PRD requirements' },
  { icon: Shield, label: 'Human Approval', desc: 'Final sign-off before production' },
  { icon: Star, label: 'Ship it', desc: 'Feature marked shipped — celebrate!' },
];
 
const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered PRD Generation',
    desc: 'Groq LLaMA 3.3 turns vague feature requests into structured Product Requirements Documents with goals, user stories, and acceptance criteria.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: GitPullRequest,
    title: 'Automated Code Review',
    desc: 'Every pull request is reviewed against your PRD. The AI checks requirements, edge cases, security, and code quality — not just syntax.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Zap,
    title: 'GitHub Webhook Auto-Trigger',
    desc: 'Open a PR and reviews start instantly. No manual steps. Webhook events trigger AI review automatically.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Layers,
    title: 'Kanban Task Board',
    desc: 'Engineering tasks are auto-generated from the PRD and tracked on a visual Kanban board — Todo, In Progress, Done.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Users,
    title: 'Multi-Tenant Workspaces',
    desc: 'Each organization gets isolated workspaces with their own projects, repos, members, and review history.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Shield,
    title: 'Human Approval Gate',
    desc: 'Humans stay in control. Every feature needs final approval before it can be marked as shipped to production.',
    color: 'bg-slate-50 text-slate-600',
  },
];
 
export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
 
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);
 
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">ShipFlow AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>
 
      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-violet-100">
            <Sparkles className="w-3 h-3" />
            AI-Powered Product Delivery Platform
          </div>
 
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Feature request to
            <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent"> shipped</span>
            <br />in one workflow
          </h1>
 
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            ShipFlow AI turns ideas into PRDs, PRDs into tasks, tasks into reviewed code, and reviewed code into production — with AI at every step and humans in control of the final call.
          </p>
 
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-violet-200"
            >
              Start building free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signin"
              className="flex items-center gap-2 text-slate-600 px-6 py-3 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Sign in to dashboard
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
 
      {/* Animated workflow */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-10">
            The complete delivery loop
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === i;
              return (
                <div
                  key={i}
                  className={`relative p-4 rounded-xl border transition-all duration-500 cursor-pointer ${
                    isActive
                      ? 'bg-white border-violet-200 shadow-md shadow-violet-100'
                      : 'bg-white/50 border-slate-100'
                  }`}
                  onClick={() => setActiveStep(i)}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-all duration-500 ${
                      isActive ? 'bg-gradient-to-br from-violet-600 to-blue-500' : 'bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                  <p className={`text-xs font-semibold mb-1 ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs leading-relaxed ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                    {step.desc}
                  </p>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-blue-400 rounded-b-xl" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
 
      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Everything a product team needs
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              From the first feature idea to the final production deploy — ShipFlow AI handles the entire loop.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
 
      {/* Stats */}
      <section className="py-16 px-6 bg-gradient-to-br from-violet-600 to-blue-500">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: '8', label: 'Phases automated' },
              { value: 'AI', label: 'Powered reviews' },
              { value: '100%', label: 'Type-safe APIs' },
              { value: '0', label: 'Manual setup steps' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-violet-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* Tech stack */}
      <section className="py-16 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8">
            Built with modern stack
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Next.js 16', 'tRPC', 'Prisma', 'Supabase', 'BetterAuth', 'Groq AI', 'Octokit', 'Shadcn UI', 'Inngest', 'Vercel'].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>
 
      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to ship faster?
          </h2>
          <p className="text-slate-500 mb-8">
            Create your workspace, connect GitHub, and start turning feature requests into production-ready code — today.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-violet-200 text-lg"
          >
            Get started free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
 
      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-slate-800">ShipFlow AI</span>
          </div>
          <p className="text-sm text-slate-400">
            Built for ChaiCode Hackathon 2026
          </p>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-slate-400 hover:text-slate-600">Sign in</Link>
            <Link href="/signup" className="text-sm text-slate-400 hover:text-slate-600">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
 