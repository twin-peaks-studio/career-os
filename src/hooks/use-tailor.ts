'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TailoringSession, TailoringOutput } from '@/types/supabase';

interface SessionWithOutputs {
  session: TailoringSession;
  outputs: TailoringOutput[];
}

// List all tailoring sessions
export function useTailoringSessions() {
  return useQuery<TailoringSession[]>({
    queryKey: ['tailoring-sessions'],
    queryFn: async () => {
      const res = await fetch('/api/tailor');
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch sessions');
      }
      return res.json();
    },
  });
}

// Get a single session with its outputs — polls while generating
export function useTailoringSession(id: string | undefined) {
  return useQuery<SessionWithOutputs>({
    queryKey: ['tailoring-session', id],
    queryFn: async () => {
      const res = await fetch(`/api/tailor/${id}`);
      if (!res.ok) throw new Error('Failed to fetch session');
      return res.json();
    },
    enabled: !!id,
    // Poll every 2 seconds while status is pending/generating
    refetchInterval: (query) => {
      const status = query.state.data?.session?.status;
      if (status === 'pending' || status === 'generating') return 2000;
      return false;
    },
  });
}

// Create a new tailoring session
export function useCreateTailoringSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      job_description_text: string;
      target_role: string;
      target_company: string;
      generate_resume?: boolean;
      generate_cover_letter?: boolean;
    }) => {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to create session');
      }

      return res.json() as Promise<TailoringSession>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tailoring-sessions'] });
    },
  });
}

// Delete a tailoring session
export function useDeleteTailoringSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tailor/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to delete session');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tailoring-sessions'] });
    },
  });
}
