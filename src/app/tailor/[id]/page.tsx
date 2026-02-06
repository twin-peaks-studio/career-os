'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useTailoringSession } from '@/hooks/use-tailor';
import { AppNav } from '@/components/layout/app-nav';
import { TailorOutput } from '@/components/tailor/tailor-output';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import type { TailoringOutput } from '@/types/supabase';

export default function TailoringSessionPage() {
  const params = useParams();
  const id = params.id as string;
  const { loading: authLoading } = useAuth();
  const { data, isLoading } = useTailoringSession(id);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <AppNav />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <AppNav />
        <div className="flex items-center justify-center py-24">
          <p className="text-[var(--color-text-muted)]">Session not found.</p>
        </div>
      </div>
    );
  }

  const { session, outputs } = data;

  // Group outputs by type for side-by-side display
  const resumeOutputs = outputs.filter((o: TailoringOutput) => o.type === 'resume');
  const coverLetterOutputs = outputs.filter((o: TailoringOutput) => o.type === 'cover_letter');
  const userStyleResume = resumeOutputs.find((o: TailoringOutput) => o.variant === 'user_style');
  const aiOptimizedResume = resumeOutputs.find((o: TailoringOutput) => o.variant === 'ai_optimized');
  const userStyleCoverLetter = coverLetterOutputs.find((o: TailoringOutput) => o.variant === 'user_style');
  const aiOptimizedCoverLetter = coverLetterOutputs.find((o: TailoringOutput) => o.variant === 'ai_optimized');

  const isGenerating = session.status === 'pending' || session.status === 'generating';

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AppNav />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back link + header */}
        <div className="mb-6">
          <Link href="/tailor">
            <Button variant="ghost" size="sm" className="mb-3">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Tailor
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)]">
                {session.target_role} at {session.target_company}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {isGenerating && (
                  <span className="flex items-center gap-1 text-sm text-[var(--color-primary)]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating...
                  </span>
                )}
                {session.status === 'complete' && (
                  <span className="flex items-center gap-1 text-sm text-[var(--color-success)]">
                    <CheckCircle className="w-3 h-3" />
                    Complete
                  </span>
                )}
                {session.status === 'failed' && (
                  <span className="flex items-center gap-1 text-sm text-[var(--color-error)]">
                    <XCircle className="w-3 h-3" />
                    Failed — check your documents and try again
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Generating state */}
        {isGenerating && outputs.length === 0 && (
          <Card hover={false} className="mb-8">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)] mx-auto mb-3" />
              <p className="text-[var(--color-text)] font-medium">
                Tailoring your documents...
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                This typically takes 30-60 seconds. The page will update automatically.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Resume outputs — side by side */}
        {(userStyleResume || aiOptimizedResume) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              Resume
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userStyleResume && <TailorOutput output={userStyleResume} />}
              {aiOptimizedResume && <TailorOutput output={aiOptimizedResume} />}
            </div>
          </div>
        )}

        {/* Cover letter outputs — side by side */}
        {(userStyleCoverLetter || aiOptimizedCoverLetter) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              Cover Letter
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userStyleCoverLetter && <TailorOutput output={userStyleCoverLetter} />}
              {aiOptimizedCoverLetter && <TailorOutput output={aiOptimizedCoverLetter} />}
            </div>
          </div>
        )}

        {/* Job description reference */}
        {session.status === 'complete' && (
          <details className="mb-8">
            <summary className="text-sm text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text)]">
              View original job description
            </summary>
            <Card hover={false} className="mt-2">
              <CardContent>
                <pre className="text-sm text-[var(--color-text)] whitespace-pre-wrap font-[family-name:var(--font-geist-sans)] leading-relaxed">
                  {session.job_description_text}
                </pre>
              </CardContent>
            </Card>
          </details>
        )}
      </main>
    </div>
  );
}
