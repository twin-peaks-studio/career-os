export type DocumentType =
  | 'baseline_resume'
  | 'tailored_resume'
  | 'tailored_cover_letter'
  | 'job_description'
  | 'story_bank';

export type TailoringStatus = 'pending' | 'generating' | 'complete' | 'failed';
export type OutputType = 'resume' | 'cover_letter';
export type OutputVariant = 'user_style' | 'ai_optimized';

export interface Document {
  id: string;
  user_id: string;
  type: DocumentType;
  file_name: string;
  mime_type: string;
  storage_path: string;
  content_parsed: string | null;
  pair_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TailoringSession {
  id: string;
  user_id: string;
  job_id: string | null;
  job_description_text: string;
  target_role: string;
  target_company: string;
  status: TailoringStatus;
  created_at: string;
}

export interface TailoringOutput {
  id: string;
  session_id: string;
  user_id: string;
  type: OutputType;
  variant: OutputVariant;
  content: string;
  citations: Record<string, string>;
  created_at: string;
}

// Supabase Database type for client typing
// Insert/Update types use explicit fields with optional auto-generated columns
export interface Database {
  public: {
    Tables: {
      documents: {
        Row: Document;
        Insert: {
          id?: string;
          user_id: string;
          type: DocumentType;
          file_name: string;
          mime_type: string;
          storage_path: string;
          content_parsed?: string | null;
          pair_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: DocumentType;
          file_name?: string;
          mime_type?: string;
          storage_path?: string;
          content_parsed?: string | null;
          pair_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_pair_id_fkey';
            columns: ['pair_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          },
        ];
      };
      tailoring_sessions: {
        Row: TailoringSession;
        Insert: {
          id?: string;
          user_id: string;
          job_id?: string | null;
          job_description_text: string;
          target_role: string;
          target_company: string;
          status?: TailoringStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string | null;
          job_description_text?: string;
          target_role?: string;
          target_company?: string;
          status?: TailoringStatus;
        };
        Relationships: [];
      };
      tailoring_outputs: {
        Row: TailoringOutput;
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          type: OutputType;
          variant: OutputVariant;
          content: string;
          citations?: Record<string, string>;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          type?: OutputType;
          variant?: OutputVariant;
          content?: string;
          citations?: Record<string, string>;
        };
        Relationships: [
          {
            foreignKeyName: 'tailoring_outputs_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'tailoring_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      document_type: DocumentType;
      tailoring_status: TailoringStatus;
      output_type: OutputType;
      output_variant: OutputVariant;
    };
  };
}
