'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Document, DocumentType } from '@/types/supabase';

// Fetch all documents
export function useDocuments(type?: DocumentType) {
  return useQuery<Document[]>({
    queryKey: ['documents', type],
    queryFn: async () => {
      const params = type ? `?type=${type}` : '';
      const res = await fetch(`/api/documents${params}`);
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error('Failed to fetch documents');
      }
      return res.json();
    },
  });
}

// Fetch a single document
export function useDocument(id: string | undefined) {
  return useQuery<Document>({
    queryKey: ['documents', id],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${id}`);
      if (!res.ok) throw new Error('Failed to fetch document');
      return res.json();
    },
    enabled: !!id,
  });
}

// Upload a new document
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      type,
      pairId,
    }: {
      file: File;
      type: DocumentType;
      pairId?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (pairId) formData.append('pair_id', pairId);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      return res.json() as Promise<Document>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// Delete a document
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// Update a document (pair, type)
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { pair_id?: string | null; type?: DocumentType };
    }) => {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Update failed');
      }

      return res.json() as Promise<Document>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
