'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Loader2 } from 'lucide-react';
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
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to create account');
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
            Start your free trial and transform your shipping operations with AI.
          </p>
        </div>
      </div>

      {/* Right Panel - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Package className="h-12 w-12 text-primary" />
            <span className="ml-2 text-2xl font-bold">ShipFlow AI</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Create your account</h2>
            <p className="text-muted-foreground mb-6">Get started with your free trial</p>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

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
                  placeholder="Create a password (min. 8 characters)"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>

            <p className="mt-4 text-xs text-muted-foreground text-center">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
            </p>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/signin" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
