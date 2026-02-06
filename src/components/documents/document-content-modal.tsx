'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { Document } from '@/types/supabase';

interface DocumentContentModalProps {
  document: Document;
  onClose: () => void;
}

export function DocumentContentModal({ document, onClose }: DocumentContentModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (document.content_parsed) {
      await navigator.clipboard.writeText(document.content_parsed);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card hover={false} className="w-full max-w-3xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between shrink-0">
          <div>
            <h2 className="font-semibold text-[var(--color-text)]">{document.file_name}</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Parsed content</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="w-4 h-4 text-[var(--color-success)]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          {document.content_parsed ? (
            <pre className="text-sm text-[var(--color-text)] whitespace-pre-wrap font-[var(--font-mono)] leading-relaxed">
              {document.content_parsed}
            </pre>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] italic">
              No parsed content available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
