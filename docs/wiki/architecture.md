# Architecture

## Overview

Career OS is a Next.js application with two data backends:

1. **SQLite (local)** — Job aggregation data (searches, jobs, deduplication)
2. **Supabase (cloud)** — User accounts, documents, and tailoring sessions

This hybrid approach keeps the existing job aggregation working locally while enabling multi-user document management and AI tailoring via Supabase.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Local DB | SQLite via Drizzle ORM |
| Cloud DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| State | TanStack React Query |
| Styling | Tailwind CSS 4 |
| AI (Phase 2) | Anthropic Claude API |

## Directory Structure

```
career-os/
├── src/
│   ├── app/                    # Next.js App Router pages + API routes
│   │   ├── api/
│   │   │   ├── searches/       # Job search CRUD
│   │   │   ├── jobs/           # Job listing + management
│   │   │   ├── fetch/          # Job aggregation trigger
│   │   │   └── documents/      # Document CRUD + upload
│   │   ├── (auth)/             # Login/signup pages (route group)
│   │   ├── documents/          # Document management page
│   │   └── page.tsx            # Job hunt dashboard
│   ├── components/
│   │   ├── ui/                 # Reusable primitives (Button, Card, etc.)
│   │   ├── layout/             # Shared layout (AppNav)
│   │   ├── auth/               # Auth form component
│   │   ├── documents/          # Document upload, list, cards, modals
│   │   ├── searches/           # Job search components
│   │   └── jobs/               # Job display components
│   ├── hooks/                  # React Query hooks
│   ├── lib/
│   │   ├── supabase/           # Supabase client (browser + server + middleware)
│   │   ├── db/                 # SQLite schema + connection
│   │   ├── documents/          # Document parsing (PDF, DOCX, TXT)
│   │   ├── api/                # Job fetching from external sources
│   │   └── jobs/               # Deduplication + normalization
│   └── types/                  # TypeScript type definitions
├── supabase/
│   └── schema.sql              # Database schema with RLS policies
├── docs/wiki/                  # Documentation
└── data/                       # Local SQLite database (git-ignored)
```

## Data Model

### Supabase (PostgreSQL)

#### `documents`
Stores metadata and parsed text for user-uploaded files.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner (FK → auth.users) |
| type | enum | baseline_resume, tailored_resume, tailored_cover_letter, job_description, story_bank |
| file_name | text | Original filename |
| mime_type | text | MIME type (application/pdf, etc.) |
| storage_path | text | Path in Supabase Storage |
| content_parsed | text | Extracted plain text |
| pair_id | UUID | Links tailored doc ↔ job description |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### `tailoring_sessions` (Phase 2)
Tracks each tailoring request.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| job_description_text | text | The JD to tailor against |
| target_role | text | Job title |
| target_company | text | Company name |
| status | enum | pending, generating, complete, failed |

#### `tailoring_outputs` (Phase 2)
Generated resumes and cover letters.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | FK → tailoring_sessions |
| user_id | UUID | Owner |
| type | enum | resume, cover_letter |
| variant | enum | user_style, ai_optimized |
| content | text | Generated content |
| citations | jsonb | Maps claims → source documents |

### SQLite (local)
Existing job aggregation tables: `tracked_searches`, `jobs`, `search_jobs`, `seen_jobs`, `saved_jobs`. See `src/lib/db/schema.ts`.

## Security Model

### Authentication
- Supabase Auth with email/password
- Next.js middleware refreshes tokens on every request
- Protected routes (`/documents`, `/tailor`) redirect unauthenticated users to `/login`

### Row Level Security (RLS)
Every Supabase table has RLS enabled with policies that enforce `auth.uid() = user_id`. Users can only read, insert, update, and delete their own rows. There is zero cross-user data access at the database level.

### Storage Security
- The `documents` storage bucket is private (not publicly accessible)
- Storage RLS policies enforce that users can only upload/read/delete files in their own folder (`{user_id}/...`)
- Files are named with a UUID prefix to prevent enumeration

### API Security
- All document API routes verify authentication via `supabase.auth.getUser()`
- Unauthenticated requests receive 401 responses
- File uploads are validated for type (PDF/DOCX/TXT) and size (10MB max)
- Parsed content is sanitized (null bytes, control characters removed)

## Request Flow

```
Browser → Next.js Middleware (token refresh) → API Route → Supabase (RLS enforced) → Response
```

For document uploads:
```
Browser → FormData POST → API Route → Parse file → Upload to Storage → Insert DB record → Response
```
