'use client';

import { useQuery } from '@tanstack/react-query';
import { Job } from '@/types';

type JobWithMeta = Job & { isPostedToday: boolean; isSeen: boolean };

export function useJobs(searchId?: string) {
  return useQuery<JobWithMeta[]>({
    queryKey: ['jobs', searchId],
    queryFn: async () => {
      const url = searchId ? `/api/jobs?searchId=${searchId}` : '/api/jobs';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      // Convert date strings to Date objects
      return data.map((job: any) => ({
        ...job,
        postedAt: job.postedAt ? new Date(job.postedAt) : null,
        firstSeenAt: job.firstSeenAt ? new Date(job.firstSeenAt) : new Date(),
      }));
    },
  });
}

export function useTodayJobs() {
  return useQuery<JobWithMeta[]>({
    queryKey: ['jobs', 'today'],
    queryFn: async () => {
      const response = await fetch('/api/jobs?today=true');
      if (!response.ok) throw new Error('Failed to fetch today jobs');
      const data = await response.json();
      return data.map((job: any) => ({
        ...job,
        postedAt: job.postedAt ? new Date(job.postedAt) : null,
        firstSeenAt: job.firstSeenAt ? new Date(job.firstSeenAt) : new Date(),
      }));
    },
  });
}
