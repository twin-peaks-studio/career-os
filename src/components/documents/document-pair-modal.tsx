'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Link as LinkIcon, Unlink } from 'lucide-react';
import { useDocuments, useUpdateDocument } from '@/hooks/use-documents';
import type { Document } from '@/types/supabase';

interface DocumentPairModalProps {
  document: Document;
  onClose: () => void;
}

export function DocumentPairModal({ document, onClose }: DocumentPairModalProps) {
  const { data: allDocuments = [] } = useDocuments();
  const updateDocument = useUpdateDocument();

  // Determine what types can be paired with this document
  const getPairableTypes = () => {
    if (document.type === 'job_description') {
      return ['tailored_resume', 'tailored_cover_letter'];
    }
    return ['job_description'];
  };

  const pairableTypes = getPairableTypes();
  const candidates = allDocuments.filter(
    (d) => d.id !== document.id && pairableTypes.includes(d.type)
  );

  const handlePair = async (targetId: string) => {
    // Set pair_id on both documents to reference each other
    await updateDocument.mutateAsync({
      id: document.id,
      updates: { pair_id: targetId },
    });
    await updateDocument.mutateAsync({
      id: targetId,
      updates: { pair_id: document.id },
    });
    onClose();
  };

  const handleUnpair = async () => {
    if (document.pair_id) {
      // Remove pair reference from both sides
      await updateDocument.mutateAsync({
        id: document.pair_id,
        updates: { pair_id: null },
      });
      await updateDocument.mutateAsync({
        id: document.id,
        updates: { pair_id: null },
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card hover={false} className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="font-semibold text-[var(--color-text)]">Pair Document</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Link &quot;{document.file_name}&quot; with a{' '}
              {document.type === 'job_description' ? 'tailored resume or cover letter' : 'job description'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)]"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          {document.pair_id && (
            <div className="mb-4">
              <Button
                variant="secondary"
                onClick={handleUnpair}
                disabled={updateDocument.isPending}
                className="w-full"
              >
                <Unlink className="w-4 h-4 mr-2" />
                Remove Current Pairing
              </Button>
            </div>
          )}

          {candidates.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
              No {document.type === 'job_description' ? 'tailored resumes or cover letters' : 'job descriptions'} uploaded yet.
              Upload one first, then come back to pair them.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  onClick={() => handlePair(candidate.id)}
                  disabled={updateDocument.isPending}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)]
                    hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-50)]
                    transition-colors text-left disabled:opacity-50"
                >
                  <LinkIcon className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {candidate.file_name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {candidate.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
