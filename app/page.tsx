'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowRight, GitPullRequest, Sparkles, CheckCircle, Layers, Zap, Shield, Users, ChevronRight, Github, Star } from 'lucide-react';

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
  { icon: Sparkles, title: 'AI-Powered PRD Generation', desc: 'Groq LLaMA 3.3 turns vague feature requests into structured Product Requirements Documents.', color: 'from-violet-600 to-indigo-600' },
  { icon: GitPullRequest, title: 'Automated Code Review', desc: 'Every pull request is reviewed against your PRD. AI checks requirements, security, and code quality.', color: 'from-blue-600 to-cyan-600' },
  { icon: Zap, title: 'GitHub Webhook Auto-Trigger', desc: 'Open a PR and reviews start instantly. No manual steps — webhooks trigger AI review automatically.', color: 'from-amber-600 to-orange-600' },
  { icon: Layers, title: 'Kanban Task Board', desc: 'Engineering tasks auto-generated from PRD and tracked on a visual board — Todo, In Progress, Done.', color: 'from-emerald-600 to-teal-600' },
  { icon: Users, title: 'Multi-Tenant Workspaces', desc: 'Each organization gets isolated workspaces with their own projects, repos, members, and review history.', color: 'from-rose-600 to-pink-600' },
  { icon: Shield, title: 'Human Approval Gate', desc: 'Humans stay in control. Every feature needs final approval before it can be marked as shipped.', color: 'from-purple-600 to-violet-600' },
];

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActiveStep((prev) => (prev + 1) % STEPS.length), 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090B] text-white font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090B]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">ShipFlow AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/signin" className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2">Sign in</Link>
            <Link href="/signup" className="text-sm bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-zinc-200 transition-colors">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-400 text-xs font-medium px-4 py-2 rounded-full mb-8 border border-violet-500/20">
            <Sparkles className="w-3 h-3" />AI-Powered Product Delivery Platform
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Feature request to
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent"> shipped</span>
            <br />in one workflow
          </h1>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            ShipFlow AI turns ideas into PRDs, PRDs into tasks, tasks into reviewed code, and reviewed code into production — with AI at every step.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all shadow-2xl shadow-violet-500/25 hover:-translate-y-0.5">
              Start building free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/signin" className="flex items-center gap-2 text-zinc-300 px-7 py-3.5 rounded-xl font-medium border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 transition-all">
              Sign in to dashboard <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-6 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-12">The complete delivery loop</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === i;
              return (
                <div key={i} onClick={() => setActiveStep(i)} className={`relative p-4 rounded-2xl border transition-all duration-500 cursor-pointer ${isActive ? 'bg-zinc-900 border-violet-500/40 shadow-xl shadow-violet-500/10' : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-all duration-500 ${isActive ? 'bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-500/30' : 'bg-zinc-800'}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                  </div>
                  <p className={`text-xs font-semibold mb-1 ${isActive ? 'text-white' : 'text-zinc-500'}`}>{step.label}</p>
                  <p className={`text-xs leading-relaxed ${isActive ? 'text-zinc-400' : 'text-zinc-600'}`}>{step.desc}</p>
                  {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-blue-500 rounded-b-2xl" />}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Everything a product team needs</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">From the first feature idea to the final production deploy — ShipFlow AI handles the entire loop.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 hover:shadow-xl transition-all duration-300 group">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 bg-gradient-to-br from-violet-600/10 via-indigo-600/5 to-transparent border-y border-zinc-800">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[{ value: '8', label: 'Phases automated' }, { value: 'AI', label: 'Powered reviews' }, { value: '100%', label: 'Type-safe APIs' }, { value: '0', label: 'Manual setup steps' }].map((stat, i) => (
            <div key={i}>
              <div className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent mb-2">{stat.value}</div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-8">Built with modern stack</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Next.js 16', 'tRPC', 'Prisma', 'Supabase', 'BetterAuth', 'Groq AI', 'Octokit', 'Shadcn UI', 'Inngest', 'Vercel'].map((tech) => (
              <span key={tech} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-zinc-400 font-medium hover:border-zinc-700 hover:text-zinc-300 transition-colors">{tech}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Ready to ship faster?</h2>
          <p className="text-zinc-400 mb-10">Create your workspace, connect GitHub, and start turning feature requests into production-ready code — today.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-all shadow-2xl shadow-violet-500/25 hover:-translate-y-0.5 text-lg">
            Get started free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-white">ShipFlow AI</span>
          </div>
          <p className="text-sm text-zinc-600">Built for ChaiCode Hackathon 2026</p>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors">Sign in</Link>
            <Link href="/signup" className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}