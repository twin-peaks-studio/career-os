# Setup Guide

## Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com) account (free tier works)

## 1. Clone and Install

```bash
git clone <repo-url> career-os
cd career-os
npm install
```

## 2. Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New project**
3. Choose a name and region, set a database password
4. Wait for the project to finish provisioning

## 3. Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this repo
3. Copy the entire contents and paste into the SQL Editor
4. Click **Run** — this creates all tables, RLS policies, and the storage bucket

## 4. Get Your API Keys

1. In Supabase, go to **Settings → API**
2. Copy the **Project URL** and **anon/public** key

## 5. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Job aggregation
SERPAPI_KEY=your_serpapi_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 6. Run the App

```bash
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000).

## 7. Create Your Account

1. Go to [http://localhost:3000/signup](http://localhost:3000/signup)
2. Enter your email and password (min 6 characters)
3. You'll be redirected to the Documents page

> **Note:** By default, Supabase requires email confirmation. For local development, you can disable this in your Supabase dashboard under **Authentication → Providers → Email** by turning off "Confirm email".

## 8. Upload Your First Document

1. Navigate to [http://localhost:3000/documents](http://localhost:3000/documents)
2. Click **Upload**
3. Select "Baseline Resume" as the document type
4. Drag & drop or browse for your PDF/DOCX/TXT file
5. The system will parse the text content and store both the original file and the extracted text

## Troubleshooting

### "Unauthorized" errors on the documents page
Make sure you're signed in. Check that your Supabase URL and anon key are correct in `.env.local`.

### Document upload fails with "Storage upload failed"
Ensure the storage bucket was created by running the full `schema.sql`. Check the Supabase dashboard under **Storage** to confirm a `documents` bucket exists.

### Build errors after install
Make sure you're on Node.js 20+:
```bash
node --version
```

### RLS policy errors
If you see "new row violates row-level security policy", ensure:
1. You're authenticated (the API sends the auth token)
2. The `user_id` in your insert matches `auth.uid()`
