'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import { useDeleteTailoringSession } from '@/hooks/use-tailor';
import type { TailoringSession } from '@/types/supabase';
import Link from 'next/link';

const STATUS_CONFIG = {
  pending: { icon: Clock, label: 'Pending', className: 'text-[var(--color-text-muted)]' },
  generating: { icon: Loader2, label: 'Generating...', className: 'text-[var(--color-primary)] animate-spin' },
  complete: { icon: CheckCircle, label: 'Complete', className: 'text-[var(--color-success)]' },
  failed: { icon: XCircle, label: 'Failed', className: 'text-[var(--color-error)]' },
} as const;

interface SessionCardProps {
  session: TailoringSession;
}

export function SessionCard({ session }: SessionCardProps) {
  const deleteSession = useDeleteTailoringSession();
  const config = STATUS_CONFIG[session.status];
  const StatusIcon = config.icon;

  const handleDelete = async () => {
    if (confirm('Delete this tailoring session and all its outputs?')) {
      await deleteSession.mutateAsync(session.id);
    }
  };

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center gap-3">
          {/* Status icon */}
          <StatusIcon className={`w-5 h-5 shrink-0 ${config.className}`} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text)] truncate">
              {session.target_role} at {session.target_company}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[var(--color-text-muted)]">
                {config.label}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {formatRelativeDate(session.created_at)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {session.status === 'complete' && (
              <Link href={`/tailor/${session.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            {(session.status === 'generating' || session.status === 'pending') && (
              <Link href={`/tailor/${session.id}`}>
                <Button variant="ghost" size="sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteSession.isPending}
              className="text-[var(--color-error)] hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
