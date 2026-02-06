import Parser from 'rss-parser';
import { RawJob, SearchParams } from '@/types';

const parser = new Parser();

function extractJobIdFromUrl(url: string): string {
  // LinkedIn job URLs contain the job ID in the path
  const match = url.match(/\/view\/(\d+)/);
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

function mapEmploymentType(type: string | undefined): string | null {
  if (!type) return null;
  const lower = type.toLowerCase();
  if (lower === 'f' || lower.includes('full')) return 'full-time';
  if (lower === 'p' || lower.includes('part')) return 'part-time';
  if (lower === 'c' || lower.includes('contract')) return 'contract';
  return null;
}

export async function fetchLinkedInJobs(params: SearchParams): Promise<RawJob[]> {
  // LinkedIn Jobs RSS feed URL
  // Note: LinkedIn's RSS is limited and may not always work
  // Format: https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search

  // Alternative approach: Use LinkedIn's public job search page RSS
  const keywords = encodeURIComponent(params.query);
  const location = encodeURIComponent(params.location || '');

  // Map employment type to LinkedIn's filter
  let fWT = ''; // f_WT filter for work type
  if (params.location?.toLowerCase() === 'remote') {
    fWT = '2'; // Remote
  }

  let fJT = ''; // f_JT filter for job type
  if (params.employmentType === 'full-time') {
    fJT = 'F';
  } else if (params.employmentType === 'part-time') {
    fJT = 'P';
  } else if (params.employmentType === 'contract') {
    fJT = 'C';
  }

  // LinkedIn doesn't have a straightforward RSS feed for job searches
  // We'll try a few approaches:

  // Approach 1: Try the public jobs API (often blocked but worth trying)
  const searchUrl = new URL('https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search');
  searchUrl.searchParams.set('keywords', params.query);
  if (params.location) {
    searchUrl.searchParams.set('location', params.location);
  }
  searchUrl.searchParams.set('f_TPR', 'r604800'); // Past week
  if (fWT) searchUrl.searchParams.set('f_WT', fWT);
  if (fJT) searchUrl.searchParams.set('f_JT', fJT);
  searchUrl.searchParams.set('start', '0');

  try {
    const response = await fetch(searchUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      console.warn('LinkedIn API returned non-OK status:', response.status);
      return [];
    }

    const html = await response.text();

    // Parse the HTML to extract job listings
    // LinkedIn returns HTML with job cards
    const jobs: RawJob[] = [];

    // Simple regex-based parsing (LinkedIn's HTML structure)
    const jobCardPattern = /<div[^>]*class="[^"]*base-card[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
    const titlePattern = /<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([^<]+)<\/h3>/;
    const companyPattern = /<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/;
    const locationPattern = /<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([^<]+)<\/span>/;
    const linkPattern = /<a[^>]*class="[^"]*base-card__full-link[^"]*"[^>]*href="([^"]+)"/;
    const datePattern = /<time[^>]*datetime="([^"]+)"/;

    let match;
    const cardMatches = html.match(/<li>[\s\S]*?<\/li>/g) || [];

    for (const card of cardMatches.slice(0, 25)) { // Limit to 25 results
      const titleMatch = card.match(titlePattern);
      const companyMatch = card.match(companyPattern);
      const locationMatch = card.match(locationPattern);
      const linkMatch = card.match(linkPattern);
      const dateMatch = card.match(datePattern);

      if (titleMatch && linkMatch) {
        const url = linkMatch[1].split('?')[0]; // Remove tracking params
        const title = titleMatch[1].trim();
        const company = companyMatch ? companyMatch[1].trim() : null;
        const location = locationMatch ? locationMatch[1].trim() : null;
        const postedAt = dateMatch ? new Date(dateMatch[1]) : null;

        jobs.push({
          externalId: extractJobIdFromUrl(url),
          source: 'linkedin',
          title,
          company,
          location,
          isRemote: location?.toLowerCase().includes('remote') ||
                    title.toLowerCase().includes('remote') || false,
          employmentType: mapEmploymentType(fJT) || null,
          description: null, // Not available in listing
          salary: null,
          url: url.startsWith('http') ? url : `https://www.linkedin.com${url}`,
          postedAt,
        });
      }
    }

    return jobs;
  } catch (error) {
    console.error('Error fetching from LinkedIn:', error);
    return [];
  }
}
