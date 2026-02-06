import { RawJob, SearchParams } from '@/types';

const SERPAPI_BASE = 'https://serpapi.com/search';

interface SerpApiJob {
  job_id: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  share_link?: string;
  related_links?: Array<{ link: string }>;
  detected_extensions?: {
    posted_at?: string;
    salary?: string;
    schedule_type?: string;
  };
}

interface SerpApiResponse {
  jobs_results?: SerpApiJob[];
  error?: string;
}

function parseRelativeDate(relativeDate: string | undefined): Date | null {
  if (!relativeDate) return null;

  const now = new Date();
  const lower = relativeDate.toLowerCase();

  // Handle "X hours ago"
  const hoursMatch = lower.match(/(\d+)\s*hours?\s*ago/);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1], 10);
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }

  // Handle "X days ago"
  const daysMatch = lower.match(/(\d+)\s*days?\s*ago/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // Handle "today" or "just posted"
  if (lower.includes('today') || lower.includes('just posted') || lower.includes('just now')) {
    return now;
  }

  // Handle "yesterday"
  if (lower.includes('yesterday')) {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  // Handle "X weeks ago"
  const weeksMatch = lower.match(/(\d+)\s*weeks?\s*ago/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1], 10);
    return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
  }

  return null;
}

function normalizeEmploymentType(extensions: SerpApiJob['detected_extensions']): string | null {
  if (!extensions?.schedule_type) return null;

  const type = extensions.schedule_type.toLowerCase();
  if (type.includes('full')) return 'full-time';
  if (type.includes('part')) return 'part-time';
  if (type.includes('contract')) return 'contract';
  return type;
}

export async function fetchGoogleJobs(params: SearchParams): Promise<RawJob[]> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    console.warn('SERPAPI_KEY not set, skipping Google Jobs fetch');
    return [];
  }

  const chips: string[] = ['date_posted:week']; // Always filter to past week

  if (params.employmentType === 'full-time') {
    chips.push('employment_type:FULLTIME');
  } else if (params.employmentType === 'part-time') {
    chips.push('employment_type:PARTTIME');
  } else if (params.employmentType === 'contract') {
    chips.push('employment_type:CONTRACTOR');
  }

  const searchParams = new URLSearchParams({
    api_key: apiKey,
    engine: 'google_jobs',
    q: params.query,
    location: params.location || 'United States',
    chips: chips.join(','),
  });

  try {
    const response = await fetch(`${SERPAPI_BASE}?${searchParams}`);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded for Google Jobs (SerpAPI)');
      }
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data: SerpApiResponse = await response.json();

    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    return (data.jobs_results || []).map((job): RawJob => ({
      externalId: job.job_id,
      source: 'google',
      title: job.title,
      company: job.company_name || null,
      location: job.location || null,
      isRemote: job.location?.toLowerCase().includes('remote') ||
                job.title?.toLowerCase().includes('remote') || false,
      employmentType: normalizeEmploymentType(job.detected_extensions),
      description: job.description || null,
      salary: job.detected_extensions?.salary || null,
      url: job.share_link || job.related_links?.[0]?.link || '',
      postedAt: parseRelativeDate(job.detected_extensions?.posted_at),
    }));
  } catch (error) {
    console.error('Error fetching from Google Jobs:', error);
    throw error;
  }
}
