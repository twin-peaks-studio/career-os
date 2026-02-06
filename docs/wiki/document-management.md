# Document Management

## Overview

The document management system lets you upload, organize, and pair documents that the tailoring engine uses to generate personalized resumes and cover letters. Think of it as teaching the system your style by providing examples.

## Document Types

### Baseline Resume
Your master resume — the complete, untailored version with all your experience, skills, and achievements. This is the "source of truth" the AI draws from.

- **Upload one** baseline resume
- This should contain everything, even if it's too long for a single application
- Update it as your experience grows

### Tailored Resume (Example)
A resume you've already manually tailored for a specific job. These examples teach the system **how you tailor** — your preferences for restructuring, emphasis, and tone.

- **Upload as many as you have** — more examples = better mimicry
- **Always pair** with the matching job description (see [Pairing](#pairing-documents) below)

### Tailored Cover Letter (Example)
A cover letter you've written for a specific job. Same concept as tailored resumes — these teach your cover letter style.

- **Pair** with the matching job description
- Include a variety of styles if you adapt your tone for different companies

### Job Description
The job posting that corresponds to a tailored resume or cover letter. The system analyzes these to understand what you emphasized and why.

- Upload these to pair with your tailored examples
- In Phase 2, you'll also provide new job descriptions to tailor against

### Story Bank (Additional Info)
Supplementary material that isn't in your resume but could be relevant:
- Specific metrics and achievements
- Project details and outcomes
- Leadership examples
- Technical depth on specific skills
- Anything the AI should know when crafting your applications

The AI can draw from this material when tailoring, even if you didn't include it in your baseline resume.

## Uploading Documents

1. Navigate to **Documents** in the top navigation
2. Click the **Upload** button
3. Select the document type from the dropdown
4. Drag & drop your file or click to browse
5. Supported formats: **PDF**, **DOCX**, **TXT** (max 10MB)
6. The system automatically extracts and stores the text content

### What Happens During Upload

1. The file is validated (type + size)
2. Text is extracted using specialized parsers:
   - **PDF**: Text layer extraction (scanned PDFs without text layers are not yet supported)
   - **DOCX**: Raw text extraction preserving structure
   - **TXT**: Direct text read
3. The original file is stored securely in Supabase Storage (your private folder)
4. The parsed text and metadata are saved to the database

## Pairing Documents

Pairing links a tailored resume or cover letter with its matching job description. This is how the system learns your tailoring patterns.

### How to Pair

1. Find the document you want to pair in the list
2. Click the **link icon** on the document card
3. Select the matching document from the modal
4. The pairing is bidirectional — both documents show the connection

### What Should Be Paired

| Document | Pair With |
|----------|-----------|
| Tailored Resume | The job description it was tailored for |
| Tailored Cover Letter | The job description it was written for |
| Job Description | The tailored resume and/or cover letter for that job |

> **Tip:** Upload the job description first, then upload the tailored resume/cover letter and pair them together.

## Viewing Parsed Content

Click the **eye icon** on any document card to view the extracted text. This is what the AI will see when generating tailored content. If the parsed text looks wrong or incomplete, try re-uploading the document.

You can also copy the parsed content to your clipboard using the copy button in the viewer.

## Deleting Documents

Click the **trash icon** on a document card to delete it. This removes:
- The database record
- The file from storage
- Any pair references from other documents

**This action cannot be undone.**

## Best Practices

1. **Start with your baseline resume** — this is the foundation
2. **Upload 2-3 tailored examples with paired JDs** — this teaches your style effectively
3. **Add a story bank** with metrics and achievements not on your resume
4. **Keep documents up to date** — delete outdated versions and upload current ones
5. **Use descriptive filenames** — they help you identify documents in the list
