'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      router.push('/documents');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <Card hover={false} className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-[var(--color-text)] text-center">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] text-center mt-1">
            {mode === 'login'
              ? 'Sign in to manage your documents and tailor your resume'
              : 'Create an account to start tailoring your resume'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-[var(--color-error)]">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </Button>

            <p className="text-sm text-center text-[var(--color-text-muted)]">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="text-[var(--color-primary)] hover:underline">
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <Link href="/login" className="text-[var(--color-primary)] hover:underline">
                    Sign in
                  </Link>
                </>
              )}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
