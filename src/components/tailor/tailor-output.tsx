'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, FileText, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import type { TailoringOutput } from '@/types/supabase';

interface TailorOutputProps {
  output: TailoringOutput;
}

export function TailorOutput({ output }: TailorOutputProps) {
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(false);

  const isUserStyle = output.variant === 'user_style';
  const isResume = output.type === 'resume';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const citations = output.citations as Record<string, string>;
  const citationEntries = Object.entries(citations);

  return (
    <Card hover={false}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {isUserStyle ? (
            <FileText className="w-4 h-4 text-[var(--color-primary)]" />
          ) : (
            <Zap className="w-4 h-4 text-amber-500" />
          )}
          <div>
            <h3 className="font-semibold text-[var(--color-text)] text-sm">
              {isUserStyle ? 'Your Style' : 'AI Optimized'}
              {' — '}
              {isResume ? 'Resume' : 'Cover Letter'}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {isUserStyle
                ? 'Mimics how you would tailor it yourself'
                : 'Maximized for impact and ATS optimization'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="w-4 h-4 text-[var(--color-success)]" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Content */}
        <pre className="text-sm text-[var(--color-text)] whitespace-pre-wrap font-[family-name:var(--font-geist-sans)] leading-relaxed mb-4">
          {output.content}
        </pre>

        {/* Citations toggle */}
        {citationEntries.length > 0 && (
          <div className="border-t border-[var(--color-border)] pt-3">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              {showCitations ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              {citationEntries.length} citation{citationEntries.length !== 1 ? 's' : ''}
            </button>

            {showCitations && (
              <div className="mt-2 space-y-1">
                {citationEntries.map(([claim, source], i) => (
                  <div
                    key={i}
                    className="text-xs text-[var(--color-text-muted)] pl-3 border-l-2 border-[var(--color-border)]"
                  >
                    <span className="text-[var(--color-text)]">{claim}</span>
                    {' → '}
                    <span className="italic">{source}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
