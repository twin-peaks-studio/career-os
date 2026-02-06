'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SourceBadges } from './source-badge';
import { formatRelativeDate } from '@/lib/utils';
import { Job, Source } from '@/types';
import { MapPin, Building2, Clock, DollarSign, ExternalLink, Sparkles } from 'lucide-react';

interface JobCardProps {
  job: Job & { isPostedToday?: boolean; isSeen?: boolean };
}

export function JobCard({ job }: JobCardProps) {
  // Get the first available URL
  const jobUrl = Object.values(job.urls)[0] || '#';

  return (
    <Card className={job.isPostedToday ? 'border-l-4 border-l-[var(--color-new-today)]' : ''}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {job.isPostedToday && (
                <Badge variant="new-today" className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  NEW TODAY
                </Badge>
              )}
              <SourceBadges sources={job.sources} />
              {job.isRemote && (
                <Badge variant="remote">Remote</Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-[var(--color-text)] text-lg leading-tight group-hover:text-[var(--color-primary)] transition-colors">
              {job.title}
            </h3>
          </div>

          {/* External link */}
          <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary)] transition-colors"
            title="View job posting"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        {/* Meta info */}
        <div className="mt-3 space-y-1.5">
          {job.company && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{job.company}</span>
            </div>
          )}

          {job.location && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{job.location}</span>
            </div>
          )}

          {job.salary && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-success)]">
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <span>{job.salary}</span>
            </div>
          )}
        </div>

        {/* Description preview */}
        {job.description && (
          <p className="mt-3 text-sm text-[var(--color-text-muted)] line-clamp-2">
            {job.description}
          </p>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatRelativeDate(job.postedAt)}</span>
          </div>

          {/* Source links */}
          <div className="flex items-center gap-2">
            {Object.entries(job.urls).map(([source, url]) => (
              <a
                key={source}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
              >
                View on {source.charAt(0).toUpperCase() + source.slice(1)}
              </a>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
