'use client';

import { useAuth } from '@/hooks/use-auth';
import { useTailoringSessions } from '@/hooks/use-tailor';
import { useDocuments } from '@/hooks/use-documents';
import { AppNav } from '@/components/layout/app-nav';
import { TailorForm } from '@/components/tailor/tailor-form';
import { SessionCard } from '@/components/tailor/session-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertTriangle, FileText } from 'lucide-react';
import Link from 'next/link';

export default function TailorPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: sessions = [], isLoading: sessionsLoading } = useTailoringSessions();
  const { data: documents = [] } = useDocuments();

  const hasBaseline = documents.some((d) => d.type === 'baseline_resume');
  const hasPairedExamples = documents.some(
    (d) =>
      (d.type === 'tailored_resume' || d.type === 'tailored_cover_letter') &&
      d.pair_id
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <AppNav />
        <div className="flex items-center justify-center py-24">
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <AppNav />
        <div className="flex items-center justify-center py-24">
          <p className="text-[var(--color-text-muted)]">Please sign in to use the tailoring engine.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AppNav />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Tailor</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Generate tailored resumes and cover letters with AI
            </p>
          </div>
        </div>

        {/* Readiness checks */}
        {!hasBaseline && (
          <Card hover={false} className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="py-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[var(--color-warning)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    Baseline resume required
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Upload your master resume before tailoring. The AI needs this as the source of truth for your experience.
                  </p>
                  <Link href="/documents">
                    <Button variant="secondary" size="sm" className="mt-2">
                      <FileText className="w-3 h-3 mr-1" />
                      Go to Documents
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {hasBaseline && !hasPairedExamples && (
          <Card hover={false} className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="py-3">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    Tip: Add tailoring examples for better results
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Upload a resume you&apos;ve already tailored + its matching job description.
                    This teaches the AI your personal tailoring style.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tailoring form */}
        <div className="mb-8">
          <TailorForm />
        </div>

        {/* Past sessions */}
        {sessionsLoading ? (
          <div className="text-center py-8 text-[var(--color-text-muted)]">
            Loading sessions...
          </div>
        ) : sessions.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              Past Sessions
            </h2>
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
