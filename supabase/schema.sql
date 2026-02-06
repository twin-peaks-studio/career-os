-- Career OS: Resume Tailoring Schema
-- Run this against your Supabase project via the SQL Editor in the Supabase Dashboard.
--
-- Prerequisites:
--   1. Create a Supabase project at https://supabase.com
--   2. Enable the uuid-ossp extension (usually enabled by default)
--   3. Create a storage bucket called "documents" (see bottom of this file)

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE document_type AS ENUM (
  'baseline_resume',
  'tailored_resume',
  'tailored_cover_letter',
  'job_description',
  'story_bank'
);

CREATE TYPE tailoring_status AS ENUM (
  'pending',
  'generating',
  'complete',
  'failed'
);

CREATE TYPE output_type AS ENUM ('resume', 'cover_letter');
CREATE TYPE output_variant AS ENUM ('user_style', 'ai_optimized');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Documents: stores metadata and parsed text for all user-uploaded files
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  content_parsed TEXT,
  pair_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_type ON documents(user_id, type);
CREATE INDEX idx_documents_pair_id ON documents(pair_id);

-- Tailoring sessions: tracks each tailoring request
CREATE TABLE tailoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID,  -- optional link to job tracker (no FK since jobs are in SQLite)
  job_description_text TEXT NOT NULL,
  target_role TEXT NOT NULL,
  target_company TEXT NOT NULL,
  status tailoring_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tailoring_sessions_user_id ON tailoring_sessions(user_id);

-- Tailoring outputs: the generated resumes and cover letters
CREATE TABLE tailoring_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES tailoring_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type output_type NOT NULL,
  variant output_variant NOT NULL,
  content TEXT NOT NULL,
  citations JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tailoring_outputs_session ON tailoring_outputs(session_id);
CREATE INDEX idx_tailoring_outputs_user ON tailoring_outputs(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailoring_outputs ENABLE ROW LEVEL SECURITY;

-- Documents: users can only access their own documents
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Tailoring sessions: users can only access their own sessions
CREATE POLICY "Users can view their own sessions"
  ON tailoring_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON tailoring_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON tailoring_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON tailoring_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Tailoring outputs: users can only access their own outputs
CREATE POLICY "Users can view their own outputs"
  ON tailoring_outputs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outputs"
  ON tailoring_outputs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outputs"
  ON tailoring_outputs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================
-- Run these in the Supabase SQL Editor after the tables are created:

-- Create the documents storage bucket (private by default)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Storage RLS: users can only access files in their own folder
CREATE POLICY "Users can upload to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
