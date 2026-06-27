'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Loader2 } from 'lucide-react';
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
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to sign in');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-cyan-500 flex-col justify-center items-center px-8">
        <div className="max-w-md text-center text-white">
          <Package className="h-16 w-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">ShipFlow AI</h1>
          <p className="text-xl text-blue-100">
            AI-powered shipping intelligence that transforms your logistics operations.
          </p>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Package className="h-12 w-12 text-primary" />
            <span className="ml-2 text-2xl font-bold">ShipFlow AI</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground mb-6">Sign in to your account to continue</p>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
