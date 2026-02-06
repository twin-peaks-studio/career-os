'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useUploadDocument } from '@/hooks/use-documents';
import { Upload, FileText, X, AlertCircle, Check } from 'lucide-react';
import type { DocumentType } from '@/types/supabase';

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'baseline_resume', label: 'Baseline Resume' },
  { value: 'tailored_resume', label: 'Tailored Resume (example)' },
  { value: 'tailored_cover_letter', label: 'Tailored Cover Letter (example)' },
  { value: 'job_description', label: 'Job Description' },
  { value: 'story_bank', label: 'Additional Stories / Info' },
];

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt';

interface DocumentUploadProps {
  onClose: () => void;
  defaultPairId?: string;
}

export function DocumentUpload({ onClose, defaultPairId }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>('baseline_resume');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDocument = useUploadDocument();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      await uploadDocument.mutateAsync({
        file,
        type: docType,
        pairId: defaultPairId,
      });
      onClose();
    } catch {
      // Error is handled by the mutation's error state
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card hover={false}>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="font-semibold text-[var(--color-text)]">Upload Document</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)]"
        >
          <X className="w-5 h-5" />
        </button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            id="doc-type"
            label="Document Type"
            options={DOCUMENT_TYPE_OPTIONS}
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType)}
          />

          {/* Drag-and-drop zone */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
              File
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                transition-colors duration-200
                ${dragActive
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-50)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                }
                ${file ? 'bg-[var(--color-primary-50)]' : ''}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-[var(--color-primary)]" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {file.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="p-1 rounded hover:bg-white"
                  >
                    <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Drag & drop or click to browse
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    PDF, DOCX, or TXT (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Type hints */}
          <div className="p-3 rounded-lg bg-[var(--color-bg)] text-xs text-[var(--color-text-muted)]">
            {docType === 'baseline_resume' && (
              <p>Your master resume — the complete, untailored version with all experience.</p>
            )}
            {docType === 'tailored_resume' && (
              <p>A resume you&apos;ve already tailored for a specific job. Pair it with the matching job description to teach the system your style.</p>
            )}
            {docType === 'tailored_cover_letter' && (
              <p>A cover letter you&apos;ve written for a specific job. Pair it with the matching job description.</p>
            )}
            {docType === 'job_description' && (
              <p>A job description to pair with a tailored resume or cover letter as a training example.</p>
            )}
            {docType === 'story_bank' && (
              <p>Additional stories, metrics, achievements, or context not on your resume that could be relevant for future applications.</p>
            )}
          </div>

          {uploadDocument.error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-[var(--color-error)] mt-0.5 shrink-0" />
              <p className="text-sm text-[var(--color-error)]">
                {uploadDocument.error.message}
              </p>
            </div>
          )}

          {uploadDocument.isSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <Check className="w-4 h-4 text-[var(--color-success)]" />
              <p className="text-sm text-[var(--color-success)]">Document uploaded successfully</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={!file || uploadDocument.isPending}
              className="flex-1"
            >
              {uploadDocument.isPending ? 'Uploading...' : 'Upload Document'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
