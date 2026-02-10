'use client';

import { useState, FormEvent } from 'react';

// ─── SVG Icons (inline to avoid external dependencies) ───────────────────────

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// ─── Landing Page ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <div className="landing-page min-h-screen bg-[#0c1018] text-white">
      {/* ─── Nav ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-[#0c1018]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
              <span className="text-sm font-bold text-white">C</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Career OS</span>
          </div>
          <a
            href="/login"
            className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/25 hover:text-white"
          >
            Sign in
          </a>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-20%] left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/[0.1] blur-[120px]" />
          <div className="absolute top-[10%] left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/[0.07] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.1] px-4 py-1.5 text-sm text-violet-300">
            <SparklesIcon className="h-4 w-4" />
            <span>AI-powered job search platform</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-6xl sm:leading-[1.1]">
            Stop searching.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-300 bg-clip-text text-transparent">
              Start landing.
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/55 sm:text-xl">
            Career OS is the operating system for your job search. It finds the right roles,
            tailors your resume to each one, and gives you the confidence to apply &mdash;
            all in one place.
          </p>

          {/* Hero CTA */}
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
              placeholder="Enter your email"
              className="flex-1 rounded-xl border border-white/[0.12] bg-white/[0.06] px-5 py-3.5 text-white placeholder-white/35 outline-none transition-colors focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30"
              required
            />
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/25 disabled:opacity-60 disabled:shadow-none"
            >
              {status === 'success' ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  You&apos;re in!
                </>
              ) : status === 'loading' ? (
                'Joining...'
              ) : (
                <>
                  Join waitlist
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
          {status === 'error' && (
            <p className="mt-3 text-sm text-red-400">{errorMsg}</p>
          )}
          {status === 'success' && (
            <p className="mt-3 text-sm text-violet-300">We&apos;ll be in touch soon.</p>
          )}
          <p className="mt-4 text-xs text-white/35">Free early access. No spam.</p>
        </div>
      </section>

      {/* ─── Pain Points ─────────────────────────────────────── */}
      <section className="relative border-t border-white/[0.08] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-400">The problem</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Job searching is broken
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              You&apos;re spending hours every day refreshing job boards, copy-pasting your resume,
              and wondering if anyone even reads your application.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <ClockIcon className="h-5 w-5" />,
                title: 'Hours lost to manual search',
                description: 'Toggling between LinkedIn, Indeed, Google Jobs, and company pages. The same listings. Different formats. No single view.',
              },
              {
                icon: <FileTextIcon className="h-5 w-5" />,
                title: 'One resume for every role',
                description: "Generic resumes get ignored. But tailoring each one takes 30+ minutes you don't have when you're applying to dozens of jobs.",
              },
              {
                icon: <TargetIcon className="h-5 w-5" />,
                title: 'No idea what\'s working',
                description: "You apply and wait. No feedback, no score, no way to know if your resume even matched the job description.",
              },
            ].map((pain, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-colors hover:border-white/[0.14] hover:bg-white/[0.05]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/[0.12] text-orange-400">
                  {pain.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{pain.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{pain.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Solution / Benefits ─────────────────────────────── */}
      <section className="relative border-t border-white/[0.08] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[600px] rounded-full bg-violet-600/[0.06] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-400">The solution</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              One place for everything
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-white/50">
              Career OS brings together job discovery, resume tailoring, and application
              tracking into a single workflow.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <SearchIcon className="h-5 w-5" />,
                title: 'Aggregated job search',
                description: 'Google Jobs, Indeed, and LinkedIn in one feed. Set your criteria once, and Career OS checks every source for you.',
              },
              {
                icon: <SparklesIcon className="h-5 w-5" />,
                title: 'AI resume tailoring',
                description: 'Two modes: "Your Style" preserves how you write. "AI Optimized" maximizes ATS keyword matching. Both grounded in your real experience.',
              },
              {
                icon: <FileTextIcon className="h-5 w-5" />,
                title: 'Cover letters that fit',
                description: 'Auto-generated cover letters that reference the specific role, company, and your most relevant accomplishments.',
              },
              {
                icon: <TargetIcon className="h-5 w-5" />,
                title: 'Match scoring',
                description: 'See how well your resume aligns with each job description before you apply. Know your strengths and gaps up front.',
              },
              {
                icon: <ShieldIcon className="h-5 w-5" />,
                title: 'Grounded in your facts',
                description: "Every AI-generated bullet cites which of your documents it came from. No hallucinated skills. No made-up metrics.",
              },
              {
                icon: <ZapIcon className="h-5 w-5" />,
                title: 'Auto-apply (coming soon)',
                description: 'Once you approve a tailored resume, Career OS can submit it for you. Review once, apply everywhere.',
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-colors hover:border-violet-400/20 hover:bg-white/[0.05]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/[0.12] text-violet-400">
                  {benefit.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────── */}
      <section className="relative border-t border-white/[0.08] py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-400">How it works</p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to a better application
            </h2>
          </div>

          <div className="space-y-12">
            {[
              {
                step: '01',
                title: 'Upload your materials',
                description: 'Add your baseline resume, any tailored examples you\'re proud of (paired with their job descriptions), and a story bank of achievements. The more context Career OS has, the better it writes.',
                detail: 'Supports PDF and DOCX. Your documents are stored securely in your private workspace.',
              },
              {
                step: '02',
                title: 'Find roles that match',
                description: 'Set up tracked searches with your target title, location, and preferences. Career OS pulls from Google Jobs, Indeed, and LinkedIn simultaneously, deduplicates listings, and surfaces what\'s new each day.',
                detail: 'No more toggling between tabs. One feed, every source, updated automatically.',
              },
              {
                step: '03',
                title: 'Tailor and apply',
                description: 'Click "Tailor" on any saved job. Career OS generates two resume variants: one that matches your personal writing style, and one optimized for ATS systems. Every claim is cited back to your source documents.',
                detail: 'Review both side by side, pick the one you prefer, and export or auto-submit.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/[0.1] font-mono text-sm font-bold text-violet-400">
                    {item.step}
                  </div>
                  {i < 2 && (
                    <div className="mt-3 h-full w-px bg-gradient-to-b from-violet-500/25 to-transparent" />
                  )}
                </div>
                <div className="pb-2">
                  <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                  <p className="mb-2 leading-relaxed text-white/55">{item.description}</p>
                  <p className="text-sm text-white/35">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA / Waitlist ──────────────────────────────────── */}
      <section className="relative border-t border-white/[0.08] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.08] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Get early access
          </h2>
          <p className="mb-8 text-lg text-white/50">
            Career OS is currently in development. Join the waitlist to be first in line
            when we launch.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
              placeholder="Enter your email"
              className="flex-1 rounded-xl border border-white/[0.12] bg-white/[0.06] px-5 py-3.5 text-white placeholder-white/35 outline-none transition-colors focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30"
              required
            />
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 font-medium text-white shadow-lg shadow-violet-600/20 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/25 disabled:opacity-60 disabled:shadow-none"
            >
              {status === 'success' ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  You&apos;re in!
                </>
              ) : status === 'loading' ? (
                'Joining...'
              ) : (
                <>
                  Join waitlist
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
          {status === 'error' && (
            <p className="mt-3 text-sm text-red-400">{errorMsg}</p>
          )}
          {status === 'success' && (
            <p className="mt-3 text-sm text-violet-300">We&apos;ll be in touch soon.</p>
          )}
          <p className="mt-4 text-xs text-white/35">Free early access. No spam.</p>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-500">
              <span className="text-xs font-bold text-white">C</span>
            </div>
            <span className="text-sm text-white/45">Career OS</span>
          </div>
          <p className="text-sm text-white/25">&copy; {new Date().getFullYear()} Career OS</p>
        </div>
      </footer>
    </div>
  );
}
