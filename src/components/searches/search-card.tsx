'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrackedSearchWithStats } from '@/types';
import { Search, MapPin, Briefcase, Trash2, RefreshCw, Clock, Sparkles } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';

interface SearchCardProps {
  search: TrackedSearchWithStats;
  onDelete: (id: string) => void;
  onFetch: (id: string) => void;
  onView: (id: string) => void;
  isFetching?: boolean;
}

const employmentLabels: Record<string, string> = {
  'all': 'All Types',
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  'contract': 'Contract',
};

export function SearchCard({ search, onDelete, onFetch, onView, isFetching }: SearchCardProps) {
  return (
    <Card className="group">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-4 h-4 text-[var(--color-primary)]" />
              <h3 className="font-semibold text-[var(--color-text)] truncate">
                {search.query}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
              {search.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {search.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {employmentLabels[search.employmentType] || search.employmentType}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[var(--color-text)]">
              {search.totalJobs}
            </span>
            <span className="text-sm text-[var(--color-text-muted)]">
              jobs
            </span>
          </div>

          {search.todayJobs > 0 && (
            <Badge variant="new-today" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {search.todayJobs} today
            </Badge>
          )}
        </div>

        {/* Last fetched */}
        {search.lastFetchedAt && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <Clock className="w-3.5 h-3.5" />
            <span>Last updated {formatRelativeDate(search.lastFetchedAt)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onView(search.id)}
            className="flex-1"
          >
            View Jobs
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onFetch(search.id)}
            disabled={isFetching}
            title="Fetch new jobs"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(search.id)}
            className="text-[var(--color-error)] hover:bg-red-50"
            title="Delete search"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
