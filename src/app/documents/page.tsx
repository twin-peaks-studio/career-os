'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { DocumentList } from '@/components/documents/document-list';
import { DocumentUpload } from '@/components/documents/document-upload';
import { AppNav } from '@/components/layout/app-nav';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

export default function DocumentsPage() {
  const [showUpload, setShowUpload] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <AppNav />
        <div className="flex items-center justify-center py-24">
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <AppNav />
        <div className="flex items-center justify-center py-24">
          <p className="text-[var(--color-text-muted)]">Please sign in to manage documents.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AppNav />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text)]">Documents</h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                Upload resumes, cover letters, and job descriptions to train your tailoring engine
              </p>
            </div>
          </div>
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>

        {/* Upload form */}
        {showUpload && (
          <div className="mb-8">
            <DocumentUpload onClose={() => setShowUpload(false)} />
          </div>
        )}

        {/* Onboarding checklist */}
        <DocumentList />
      </main>
    </div>
  );
}
