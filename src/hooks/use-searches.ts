'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrackedSearchWithStats, EmploymentType } from '@/types';

export function useSearches() {
  return useQuery<TrackedSearchWithStats[]>({
    queryKey: ['searches'],
    queryFn: async () => {
      const response = await fetch('/api/searches');
      if (!response.ok) throw new Error('Failed to fetch searches');
      return response.json();
    },
  });
}

export function useCreateSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { query: string; location: string; employmentType: EmploymentType }) => {
      const response = await fetch('/api/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create search');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searches'] });
    },
  });
}

export function useDeleteSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/searches?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete search');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searches'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useFetchJobs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (searchId?: string) => {
      const response = await fetch('/api/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchId }),
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searches'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useClearAllJobs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/jobs/clear', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear jobs');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searches'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
