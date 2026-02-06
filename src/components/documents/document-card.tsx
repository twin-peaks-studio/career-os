'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDeleteDocument } from '@/hooks/use-documents';
import {
  FileText,
  Trash2,
  Link as LinkIcon,
  Eye,
  FileCheck,
  BookOpen,
  Briefcase,
  MessageSquare,
} from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import type { Document, DocumentType } from '@/types/supabase';

const TYPE_CONFIG: Record<DocumentType, { label: string; icon: typeof FileText; colorClass: string }> = {
  baseline_resume: {
    label: 'Baseline Resume',
    icon: FileCheck,
    colorClass: 'bg-blue-50 text-blue-700',
  },
  tailored_resume: {
    label: 'Tailored Resume',
    icon: FileText,
    colorClass: 'bg-purple-50 text-purple-700',
  },
  tailored_cover_letter: {
    label: 'Cover Letter',
    icon: MessageSquare,
    colorClass: 'bg-indigo-50 text-indigo-700',
  },
  job_description: {
    label: 'Job Description',
    icon: Briefcase,
    colorClass: 'bg-green-50 text-green-700',
  },
  story_bank: {
    label: 'Story Bank',
    icon: BookOpen,
    colorClass: 'bg-amber-50 text-amber-700',
  },
};

interface DocumentCardProps {
  document: Document;
  pairedDocument?: Document;
  onViewContent: (doc: Document) => void;
  onPair: (doc: Document) => void;
}

export function DocumentCard({
  document,
  pairedDocument,
  onViewContent,
  onPair,
}: DocumentCardProps) {
  const deleteDocument = useDeleteDocument();
  const config = TYPE_CONFIG[document.type];
  const Icon = config.icon;

  const handleDelete = async () => {
    if (confirm(`Delete "${document.file_name}"? This cannot be undone.`)) {
      await deleteDocument.mutateAsync(document.id);
    }
  };

  const isPairable =
    document.type === 'tailored_resume' ||
    document.type === 'tailored_cover_letter' ||
    document.type === 'job_description';

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`p-2 rounded-lg shrink-0 ${config.colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text)] truncate">
              {document.file_name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.colorClass}`}>
                {config.label}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {formatRelativeDate(document.created_at)}
              </span>
            </div>

            {/* Pair info */}
            {pairedDocument && (
              <div className="flex items-center gap-1.5 mt-2 p-2 rounded bg-[var(--color-bg)]">
                <LinkIcon className="w-3 h-3 text-[var(--color-text-muted)]" />
                <span className="text-xs text-[var(--color-text-muted)]">
                  Paired with:
                </span>
                <span className="text-xs font-medium text-[var(--color-text)] truncate">
                  {pairedDocument.file_name}
                </span>
              </div>
            )}

            {/* Parse preview */}
            {document.content_parsed && (
              <p className="text-xs text-[var(--color-text-muted)] mt-2 line-clamp-2">
                {document.content_parsed.slice(0, 150)}...
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewContent(document)}
              title="View parsed content"
            >
              <Eye className="w-4 h-4" />
            </Button>
            {isPairable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPair(document)}
                title="Pair with job description"
              >
                <LinkIcon className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteDocument.isPending}
              className="text-[var(--color-error)] hover:bg-red-50"
              title="Delete document"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
