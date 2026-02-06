'use client';

import { JobCard } from './job-card';
import { Job } from '@/types';
import { Loader2, SearchX } from 'lucide-react';

interface JobListProps {
  jobs: Array<Job & { isPostedToday?: boolean; isSeen?: boolean }>;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function JobList({ jobs, isLoading, emptyMessage = 'No jobs found' }: JobListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>Loading jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
        <SearchX className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-lg font-medium">{emptyMessage}</p>
        <p className="text-sm mt-1">Try creating a tracked search to fetch jobs</p>
      </div>
    );
  }

  const todayJobs = jobs.filter(job => job.isPostedToday);
  const olderJobs = jobs.filter(job => !job.isPostedToday);

  return (
    <div className="space-y-6">
      {todayJobs.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-new-today)]"></span>
            Posted Today ({todayJobs.length})
          </h3>
          <div className="space-y-4">
            {todayJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {olderJobs.length > 0 && (
        <div>
          {todayJobs.length > 0 && (
            <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3">
              Earlier This Week ({olderJobs.length})
            </h3>
          )}
          <div className="space-y-4">
            {olderJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
