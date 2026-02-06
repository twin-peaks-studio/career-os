# Career OS Wiki

Technical and user documentation for the Career OS platform — a job search aggregator with AI-powered resume and cover letter tailoring.

## Table of Contents

### Getting Started
- [Setup Guide](./setup-guide.md) — Environment setup, Supabase configuration, and first run

### Features
- [Job Aggregation](./job-aggregation.md) — Multi-source job search and tracking *(coming soon)*
- [Document Management](./document-management.md) — Uploading and organizing resumes, cover letters, and job descriptions
- [Resume Tailoring](./resume-tailoring.md) — AI-powered resume and cover letter generation

### Technical Reference
- [Architecture](./architecture.md) — System design, data model, and security
- [API Reference](./api-reference.md) — REST API endpoints *(coming soon)*

---

## Feature Status

| Feature | Status | Phase |
|---------|--------|-------|
| Job aggregation (Google, Indeed, LinkedIn) | Live | - |
| Job tracking and saving | Live | - |
| Supabase auth + document storage | Live | Phase 1 |
| Document upload (PDF/DOCX/TXT parsing) | Live | Phase 1 |
| Document pairing (resume ↔ job description) | Live | Phase 1 |
| Tailoring engine (Claude API) | Live | Phase 2 |
| Side-by-side output comparison | Live | Phase 2 |
| Citation tracking | Live | Phase 2 |
| Story bank + vector retrieval | Planned | Phase 4 |

---

## Quick Links

- **App**: `http://localhost:3000`
- **Documents**: `http://localhost:3000/documents`
- **Tailor**: `http://localhost:3000/tailor`
- **Supabase Dashboard**: `https://supabase.com/dashboard`
