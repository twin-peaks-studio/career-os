import Parser from 'rss-parser';
import { RawJob, SearchParams } from '@/types';

const parser = new Parser();

function extractJobIdFromUrl(url: string): string {
  // Indeed job URLs often contain "jk=" parameter with the job ID
  const match = url.match(/jk=([a-f0-9]+)/i);
  if (match) return match[1];

  // Fallback: hash the URL
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function extractCompanyFromTitle(title: string): { jobTitle: string; company: string | null } {
  // Indeed RSS titles are often in format: "Job Title - Company Name"
  const parts = title.split(' - ');
  if (parts.length >= 2) {
    return {
      jobTitle: parts.slice(0, -1).join(' - ').trim(),
      company: parts[parts.length - 1].trim(),
    };
  }
  return { jobTitle: title, company: null };
}

function extractLocation(content: string): string | null {
  // Try to extract location from content snippet
  // Often appears as "Location: City, State" or just "City, State"
  const locationMatch = content.match(/(?:Location:\s*)?([A-Za-z\s]+,\s*[A-Z]{2})/);
  if (locationMatch) return locationMatch[1];
  return null;
}

export async function fetchIndeedJobs(params: SearchParams): Promise<RawJob[]> {
  // Build Indeed RSS feed URL
  const queryParams = new URLSearchParams({
    q: params.query,
    l: params.location || '',
    sort: 'date',
    fromage: '7', // Posted within last 7 days
  });

  if (params.employmentType === 'full-time') {
    queryParams.set('jt', 'fulltime');
  } else if (params.employmentType === 'part-time') {
    queryParams.set('jt', 'parttime');
  } else if (params.employmentType === 'contract') {
    queryParams.set('jt', 'contract');
  }

  const feedUrl = `https://www.indeed.com/rss?${queryParams}`;

  try {
    const feed = await parser.parseURL(feedUrl);

    return (feed.items || []).map((item): RawJob => {
      const { jobTitle, company } = extractCompanyFromTitle(item.title || '');
      const location = extractLocation(item.contentSnippet || '') || null;

      return {
        externalId: extractJobIdFromUrl(item.link || ''),
        source: 'indeed',
        title: jobTitle,
        company,
        location,
        isRemote: (item.title || '').toLowerCase().includes('remote') ||
                  (item.contentSnippet || '').toLowerCase().includes('remote'),
        employmentType: null, // Not reliably available in RSS
        description: item.contentSnippet || null,
        salary: null, // Not available in RSS
        url: item.link || '',
        postedAt: item.pubDate ? new Date(item.pubDate) : null,
      };
    });
  } catch (error) {
    console.error('Error fetching from Indeed RSS:', error);
    // Return empty array on error - graceful degradation
    return [];
  }
}
