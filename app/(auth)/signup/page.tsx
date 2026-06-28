'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, AlertCircle } from 'lucide-react';
import { signUp } from '@/lib/auth-client';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await signUp.email({ email, password, name });
      if (result.error) {
        setError(result.error.message || 'Failed to create account');
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
            Start your free trial and transform feature requests into production code with AI.
          </p>
          <div className="mt-10 space-y-3 text-left">
            {[
              { step: '01', label: 'Submit a feature request' },
              { step: '02', label: 'AI generates PRD & tasks' },
              { step: '03', label: 'GitHub PR gets reviewed' },
              { step: '04', label: 'Approve & ship to production' },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3">
                <span className="text-xs font-bold text-violet-400 font-mono">{s.step}</span>
                <span className="text-sm text-zinc-400">{s.label}</span>
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
            <h2 className="text-3xl font-bold text-white mb-2">Create your account</h2>
            <p className="text-zinc-500">Get started with your free trial</p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-400 text-sm">Full Name</Label>
              <Input id="name" type="text" placeholder="John Smith" required value={name}
                onChange={(e) => setName(e.target.value)} disabled={isLoading}
                className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl h-11 focus:border-violet-500 focus:ring-violet-500/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-400 text-sm">Email</Label>
              <Input id="email" type="email" placeholder="name@company.com" required value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={isLoading}
                className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl h-11 focus:border-violet-500 focus:ring-violet-500/20" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-400 text-sm">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 rounded-xl h-11 focus:border-violet-500 focus:ring-violet-500/20" />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 shadow-xl shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-xs text-zinc-600 text-center">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-zinc-500 hover:text-zinc-400 underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-zinc-500 hover:text-zinc-400 underline">Privacy Policy</Link>.
          </p>

          <p className="mt-5 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link href="/signin" className="text-violet-400 font-medium hover:text-violet-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}