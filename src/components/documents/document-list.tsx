'use client';

import { useState, useMemo } from 'react';
import { useDocuments } from '@/hooks/use-documents';
import { DocumentCard } from './document-card';
import { DocumentContentModal } from './document-content-modal';
import { DocumentPairModal } from './document-pair-modal';
import { FileText } from 'lucide-react';
import type { Document, DocumentType } from '@/types/supabase';

const TYPE_FILTERS: Array<{ value: DocumentType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'baseline_resume', label: 'Baseline Resumes' },
  { value: 'tailored_resume', label: 'Tailored Resumes' },
  { value: 'tailored_cover_letter', label: 'Cover Letters' },
  { value: 'job_description', label: 'Job Descriptions' },
  { value: 'story_bank', label: 'Story Bank' },
];

export function DocumentList() {
  const { data: documents = [], isLoading } = useDocuments();
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [pairingDocument, setPairingDocument] = useState<Document | null>(null);

  const filteredDocuments = useMemo(() => {
    if (typeFilter === 'all') return documents;
    return documents.filter((d) => d.type === typeFilter);
  }, [documents, typeFilter]);

  // Build a lookup for paired documents
  const pairedDocMap = useMemo(() => {
    const map = new Map<string, Document>();
    for (const doc of documents) {
      if (doc.pair_id) {
        const paired = documents.find((d) => d.id === doc.pair_id);
        if (paired) map.set(doc.id, paired);
      }
    }
    return map;
  }, [documents]);

  // Count by type for filter badges
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    for (const doc of documents) {
      counts[doc.type] = (counts[doc.type] || 0) + 1;
    }
    return counts;
  }, [documents]);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)]">
        Loading documents...
      </div>
    );
  }

  return (
    <div>
      {/* Type filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {TYPE_FILTERS.map((filter) => {
          const count = typeCounts[filter.value] || 0;
          if (filter.value !== 'all' && count === 0) return null;
          return (
            <button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === filter.value
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
              }`}
            >
              {filter.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Document list */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3 opacity-50" />
          <p className="text-[var(--color-text-muted)]">
            {typeFilter === 'all'
              ? 'No documents uploaded yet. Start by uploading your baseline resume.'
              : `No ${typeFilter.replace(/_/g, ' ')} documents uploaded yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              pairedDocument={pairedDocMap.get(doc.id)}
              onViewContent={setViewingDocument}
              onPair={setPairingDocument}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {viewingDocument && (
        <DocumentContentModal
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}

      {pairingDocument && (
        <DocumentPairModal
          document={pairingDocument}
          onClose={() => setPairingDocument(null)}
        />
      )}
    </div>
  );
}
