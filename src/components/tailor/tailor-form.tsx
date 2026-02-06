'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useCreateTailoringSession } from '@/hooks/use-tailor';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function TailorForm() {
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [generateResume, setGenerateResume] = useState(true);
  const [generateCoverLetter, setGenerateCoverLetter] = useState(true);
  const createSession = useCreateTailoringSession();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim() || !targetRole.trim() || !targetCompany.trim()) return;

    try {
      const session = await createSession.mutateAsync({
        job_description_text: jobDescription,
        target_role: targetRole,
        target_company: targetCompany,
        generate_resume: generateResume,
        generate_cover_letter: generateCoverLetter,
      });
      router.push(`/tailor/${session.id}`);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <Card hover={false}>
      <CardHeader>
        <h2 className="font-semibold text-[var(--color-text)]">New Tailoring Session</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Paste a job description and we&apos;ll generate tailored versions of your resume and cover letter.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="target-role"
              label="Job Title / Role"
              placeholder="e.g. Senior Product Manager"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              required
            />
            <Input
              id="target-company"
              label="Company"
              placeholder="e.g. Stripe"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="job-description"
              className="block text-sm font-medium text-[var(--color-text)] mb-1.5"
            >
              Job Description
            </label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              required
              rows={12}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)]
                text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]
                focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-100)]
                transition-all duration-200 resize-y text-sm"
            />
          </div>

          {/* Output toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateResume}
                onChange={(e) => setGenerateResume(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text)]">Generate Resume</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={generateCoverLetter}
                onChange={(e) => setGenerateCoverLetter(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text)]">Generate Cover Letter</span>
            </label>
          </div>

          {!generateResume && !generateCoverLetter && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-[var(--color-warning)] shrink-0" />
              <p className="text-sm text-[var(--color-warning)]">
                Select at least one output type.
              </p>
            </div>
          )}

          {createSession.error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-[var(--color-error)] mt-0.5 shrink-0" />
              <p className="text-sm text-[var(--color-error)]">
                {createSession.error.message}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={
              createSession.isPending ||
              (!generateResume && !generateCoverLetter) ||
              !jobDescription.trim() ||
              !targetRole.trim() ||
              !targetCompany.trim()
            }
            className="w-full"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {createSession.isPending ? 'Starting...' : 'Generate Tailored Versions'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
