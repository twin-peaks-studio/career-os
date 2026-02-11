# Career OS

An AI-powered job search platform that consolidates postings from Google Jobs, Indeed, and LinkedIn into a single view — with resume tailoring coming soon.

## Features

- **Tracked Searches**: Save search queries that automatically fetch new jobs daily
- **Deduplication**: Same job from multiple sources shows once with merged source badges
- **"Posted Today" Highlighting**: Jobs from the last 24 hours are prominently marked
- **Near-Zero Cost**: Uses free tiers of SerpAPI (100/month) and RSS feeds

## Prerequisites

- Node.js 20+ (use `nvm use 20` if you have nvm installed)
- SerpAPI key (free tier at [serpapi.com](https://serpapi.com))

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```

3. **Add your SerpAPI key to `.env.local`:**
   ```
   SERPAPI_KEY=your_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Usage

1. **Create a Tracked Search**: Click "New Search" and enter your job title, location, and employment type
2. **Fetch Jobs**: Click the refresh button on a search card or "Fetch All" to pull jobs from all sources
3. **View Results**: Jobs appear sorted by date, with "Posted Today" jobs at the top
4. **Browse by Search**: Click "View Jobs" on any search card to see jobs for that specific search

## Data Sources

| Source | Method | Cost |
|--------|--------|------|
| Google Jobs | SerpAPI | Free: 100/month |
| Indeed | RSS Feed | Free |
| LinkedIn | Public API | Free |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS with OKLCH colors
- **State**: React Query

## Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── api/
│   │   ├── searches/       # CRUD for tracked searches
│   │   ├── jobs/           # Get job listings
│   │   └── fetch/          # Trigger job fetching
│   └── page.tsx            # Main dashboard
├── components/             # UI components
├── hooks/                  # React Query hooks
├── lib/
│   ├── api/                # Source fetchers
│   ├── db/                 # Database schema
│   └── jobs/               # Deduplication logic
└── types/                  # TypeScript types
```

## Database

The SQLite database is stored at `data/jobs.db`. Key tables:

- `tracked_searches`: Your saved search queries
- `jobs`: All fetched jobs (deduplicated)
- `search_jobs`: Links searches to their found jobs
- `seen_jobs`: Tracks which jobs you've viewed

## Cost Optimization

With 15 tracked searches fetched once daily:
- SerpAPI: 15 × 30 = 45 calls/month (within free tier of 100)
- RSS feeds: Unlimited, free
- **Total: $0/month**
