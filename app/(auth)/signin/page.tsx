'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, AlertCircle } from 'lucide-react';
import { signIn } from '@/lib/auth-client';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || 'Failed to sign in');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-[#09090B]">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="relative max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-500/30">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">ShipFlow AI</h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            AI-powered product delivery platform that transforms feature requests into production-ready code.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 text-left">
            {['PRD Generation', 'AI Code Review', 'GitHub Webhooks', 'Human Approval'].map((f) => (
              <div key={f} className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span className="text-sm text-zinc-400">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">ShipFlow AI</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-zinc-500">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-400 text-sm">Email</Label>
              <Input id="email" type="email" placeholder="name@company.com" required value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
                className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl h-11 focus:border-violet-500 focus:ring-violet-500/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-400 text-sm">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" required value={password}
                onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl h-11 focus:border-violet-500 focus:ring-violet-500/20" />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 shadow-xl shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Dont have an account?{' '}
            <Link href="/signup" className="text-violet-400 font-medium hover:text-violet-300 transition-colors">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}