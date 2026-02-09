# Career-OS — Project Context

## What This App Is Today

A Next.js job search aggregator that consolidates postings from Google Jobs
(SerpAPI), Indeed (RSS), and LinkedIn (RSS) into a single view. Deployed on **Vercel**.

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase PostgreSQL with Drizzle ORM (migrated from SQLite)
- **Styling**: Tailwind CSS 4 with OKLCH colors
- **State**: TanStack React Query
- **DB Driver**: `postgres` (postgres.js) with `prepare: false` for Supabase pooler
- **Tables**: `tracked_searches`, `jobs`, `search_jobs`, `seen_jobs`, `saved_jobs`

### Database Access Pattern
- **Drizzle ORM** for all SQL queries (type-safe, vendor-agnostic, full SQL power)
- **Supabase JS Client** will be added alongside Drizzle for auth, storage, and real-time
- Both coexist: Drizzle for data queries, Supabase client for platform features

### Environment Variables
- `DATABASE_URL` — Supabase PostgreSQL connection string (use transaction pooler, port 6543)
- `SERPAPI_KEY` — Google Jobs API key

### Setup for New Environments
1. Set `DATABASE_URL` and `SERPAPI_KEY` in environment
2. Run `npx drizzle-kit push` to create/sync tables
3. Deploy (Vercel auto-builds from repo)

## Resume Tailoring Feature — Planned

A previous planning session produced the full architecture for a **resume/cover letter
tailoring feature** powered by Claude. The plan evolved significantly during that session.
Below is the final agreed-upon design.

### Core Concept: Context Engineering, Not Training

This is **not** fine-tuning. It's few-shot prompting + retrieval-augmented generation (RAG).

The system needs:
1. A **document ingestion pipeline** that parses, chunks, and stores user documents
2. A **context assembly system** that selects the most relevant examples/information to
   include in each prompt

### User Uploads

| Input | Purpose |
|-------|---------|
| Baseline resume | "Source of truth" for skills, experience, facts |
| Manually tailored resume + its JD | Style exemplar — teaches the system how the user tailors |
| Manually tailored cover letter + its JD | Same, for cover letters |
| Additional stories/metrics (story bank) | Expanded fact bank the AI can draw from |

Each tailored doc paired with its JD becomes a **few-shot example**. More examples = better
style understanding.

### Two-Version Output Design

For each new job description, the system generates two variants:

1. **"Your Style" version**: Mimics how the user would tailor it themselves. Constrained to
   similar restructuring, tone, and emphasis choices. Heavy emphasis on few-shot examples.
2. **"AI Optimized" version**: Unconstrained tailoring maximizing keyword alignment and ATS
   optimization, but still **factually grounded** in the user's provided materials only.

**Hallucination prevention**: Citation-based approach — every bullet point or claim must
reference which source document the information came from. This makes output auditable.

### Key Architecture Decisions (Revised)

The original plan used local SQLite + SQLCipher + AES-256-GCM encryption. After discussion,
the user decided to use **Supabase** and **Claude API** directly, which dramatically
simplified the architecture:

| Concern | Original Plan | Revised Plan |
|---------|--------------|--------------|
| Database | Local SQLite, encryption burden on us | Supabase PostgreSQL with RLS |
| Auth | None (single-user) | Supabase Auth — multi-user from day one |
| File storage | Local disk, manual encryption | Supabase Storage with per-user bucket policies |
| LLM privacy | Complex local/cloud hybrid | Claude API — user accepts Anthropic's data handling |
| Encryption at rest | SQLCipher + AES-256-GCM (our problem) | Supabase handles encryption at rest for DB and Storage |

This removes an entire phase of custom encryption work and gives auth + multi-tenancy for free.

### Data Model (Supabase/PostgreSQL)

Supabase Auth handles users (`auth.users` table). All tables below are RLS-enforced —
users can ONLY read/write their own rows.

```sql
documents
  id: uuid (PK, default gen_random_uuid())
  user_id: uuid (FK → auth.users, RLS-enforced)
  type: enum ('baseline_resume', 'tailored_resume', 'tailored_cover_letter',
              'job_description', 'story_bank')
  file_name: text
  mime_type: text
  storage_path: text          -- path in Supabase Storage bucket
  content_parsed: text        -- extracted plain text from the document
  pair_id: uuid (nullable)    -- links tailored doc ↔ its job description
  created_at: timestamptz
  updated_at: timestamptz

tailoring_sessions
  id: uuid (PK)
  user_id: uuid (FK → auth.users, RLS-enforced)
  job_id: uuid (nullable)     -- link to existing job if from the tracker
  job_description_text: text
  target_role: text
  target_company: text
  status: enum ('pending', 'generating', 'complete', 'failed')
  created_at: timestamptz

tailoring_outputs
  id: uuid (PK)
  session_id: uuid (FK → tailoring_sessions)
  user_id: uuid (FK → auth.users, RLS-enforced)
  type: enum ('resume', 'cover_letter')
  variant: enum ('user_style', 'ai_optimized')
  content: text               -- generated markdown/structured content
  citations: jsonb            -- maps claims → source document IDs
  created_at: timestamptz
```

**No `document_chunks` or `encryption_metadata` tables for v1.** Supabase handles encryption.
Context assembled from full parsed documents rather than embeddings initially. Vector search
(`pgvector`) deferred until the story bank grows large enough to need it.

### System Architecture

```
Next.js Frontend
├── Document Upload & Management
├── Tailor Session Launcher
└── Side-by-Side Output Comparison
        │
    Supabase JS Client (auth + db + storage)
        │
Next.js API Routes
├── /api/documents    → Document Parser (pdf-parse, mammoth)
├── /api/tailor       → Tailoring Engine
│                       ├── Context Assembly (RAG)
│                       ├── Claude API
│                       └── Citation Validator
└── /api/outputs
        │
Supabase
├── Auth (users)
├── PostgreSQL (+ RLS)
└── Storage (doc buckets)
```

### Implementation Phases

#### Phase 1 — Supabase Foundation + Document Upload (START HERE)
First buildable milestone: Supabase setup + document upload + basic auth.

1. Install Supabase client libraries
2. Set up schema (documents, tailoring_sessions, tailoring_outputs) with RLS
3. Build document upload + parsing pipeline (upload file → parse text → store both in Supabase)
4. Basic auth (Supabase email/password or magic link)
5. Simple UI page for managing uploaded documents (list, view parsed content, delete, pair docs)

Once documents are flowing in, Phase 2 has everything it needs.

#### Phase 2 — Core Tailoring Engine
- Job description parser (extract skills, requirements, keywords)
- Context assembler: pull user's baseline resume + few-shot examples + story bank
- Two prompt templates: "user style" (constrained) and "AI optimized" (unconstrained but factual)
- Claude API integration with citation tracking
- Tailoring session API (create session → generate → poll for results)

#### Phase 3 — Output UI + Comparison
- Side-by-side diff view (user-style vs AI-optimized)
- Highlight what changed from baseline
- Section-level accept/reject editing
- Export to PDF/DOCX
- Integration with existing job tracker ("Tailor" button on saved jobs)

#### Phase 4 — Intelligence Layer
- `pgvector` embeddings for story bank retrieval (match stories to job requirements)
- Feedback loop: user ratings improve future prompts
- Cross-session learning (patterns from past tailoring inform new ones)
- Aggregate anonymized insights across users (longer-term, requires consent model)

## Development Notes

- Document parsing libraries: `pdf-parse` for PDFs, `mammoth` for DOCX
- Quality depends entirely on how well prompts are structured with the user's materials
- The "smallest useful loop" (for validating core value): upload baseline resume + one JD →
  parse both → send to Claude with two different prompts → display results side-by-side
