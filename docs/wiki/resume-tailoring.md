# Resume Tailoring

## Overview

The tailoring engine generates personalized resumes and cover letters for specific job descriptions using Claude AI. It produces two versions of each:

- **Your Style** — mimics how you would tailor it yourself, learned from your uploaded examples
- **AI Optimized** — maximized for impact and ATS keyword matching, while remaining 100% factually accurate

Every claim in the output is cited back to a source document (your baseline resume, story bank, or tailoring examples). The AI never fabricates information.

## How It Works

### 1. Context Assembly

When you start a tailoring session, the engine gathers all your uploaded documents:

| Document Type | How It's Used |
|---------------|---------------|
| Baseline Resume | Source of truth for all skills, experience, and achievements |
| Tailored Resume + paired JD | Few-shot example teaching your personal tailoring style |
| Tailored Cover Letter + paired JD | Few-shot example for your cover letter voice |
| Story Bank | Additional facts, metrics, and stories the AI can draw from |

These are assembled into a structured prompt with XML tags so the LLM can reason about each source independently.

### 2. Dual-Prompt Generation

The engine sends two separate requests to Claude (in parallel):

**Your Style prompt** emphasizes:
- Matching your demonstrated restructuring patterns
- Matching your tone and voice
- Matching how aggressively you keyword-optimize
- Conservative adjustments if no examples are provided

**AI Optimized prompt** emphasizes:
- ATS keyword extraction from the job description
- Restructuring sections for maximum relevance
- Quantified impact metrics front-loaded
- Industry-standard terminology from the JD
- Drawing from story bank for additional compelling content

### 3. Citation Tracking

Both prompts require the model to cite every factual claim with `[source: document_name]`. The citations are parsed and stored as structured JSON alongside each output, making every claim auditable.

### 4. Output Storage

Generated content is saved in the `tailoring_outputs` table with:
- The output type (resume or cover letter)
- The variant (user_style or ai_optimized)
- The full generated text
- A JSON citations map

## Using the Tailor

### Prerequisites

Before your first tailoring session:

1. **Upload a baseline resume** (required) — your master resume
2. **Upload tailoring examples** (recommended) — previously tailored resumes/cover letters paired with their job descriptions
3. **Add a story bank** (optional) — extra achievements and context

### Starting a Session

1. Navigate to **Tailor** in the top navigation
2. Enter the **job title** and **company name**
3. Paste the **full job description**
4. Choose whether to generate a resume, cover letter, or both
5. Click **Generate Tailored Versions**

### Viewing Results

After generation (typically 30-60 seconds):

- Resumes appear side-by-side: Your Style on the left, AI Optimized on the right
- Cover letters appear the same way below the resumes
- Click the **copy button** to copy any output to your clipboard
- Expand **citations** to see which source document backs each claim
- Click **View original job description** at the bottom to compare

### Past Sessions

All previous sessions are listed on the Tailor page with their status:
- **Pending** — queued for generation
- **Generating** — Claude is working on it (page auto-refreshes)
- **Complete** — outputs ready to view
- **Failed** — something went wrong (check that you have a baseline resume uploaded)

## Technical Details

### Model

The engine uses `claude-sonnet-4-5-20250929` with a 4096-token max output per generation. Each session makes 2-4 API calls (2 per output type selected).

### Prompt Architecture

Prompts use XML-tagged sections for structured context:

```
<baseline_resume>...</baseline_resume>
<tailoring_examples>
  <example_1>
    <type>resume</type>
    <job_description>...</job_description>
    <tailored_output>...</tailored_output>
  </example_1>
</tailoring_examples>
<story_bank>
  <story source="metrics.txt">...</story>
</story_bank>
<target_job_description>
  <role>Senior PM</role>
  <company>Stripe</company>
  <description>...</description>
</target_job_description>
```

### Security

- API keys are server-side only (`ANTHROPIC_API_KEY` is not exposed to the browser)
- All API routes verify authentication
- RLS ensures users can only access their own sessions and outputs
- Job description text is stored for session reference but never shared across users

## Best Practices

1. **More examples = better "Your Style" output.** Start with 2-3 paired examples and add more over time.
2. **Keep your story bank updated.** Add new achievements, metrics, and projects as they happen.
3. **Use both versions.** Sometimes "Your Style" nails the tone while "AI Optimized" surfaces a keyword you missed. Mix and match.
4. **Review citations.** If a citation references the wrong source, it may indicate the AI is connecting dots between documents — verify the claim.
5. **Iterate.** If the first output isn't perfect, update your baseline resume or add another example and try again.
