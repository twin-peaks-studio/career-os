/**
 * Normalizes text for consistent matching/deduplication
 */

export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ');    // Normalize whitespace
}

export function normalizeCompany(company: string | null | undefined): string {
  if (!company) return '';

  let normalized = normalizeText(company);

  // Remove common suffixes
  const suffixes = [
    'inc', 'llc', 'ltd', 'corp', 'corporation', 'company', 'co',
    'incorporated', 'limited', 'group', 'holdings', 'plc'
  ];

  for (const suffix of suffixes) {
    const pattern = new RegExp(`\\s+${suffix}$`, 'i');
    normalized = normalized.replace(pattern, '');
  }

  return normalized.trim();
}

export function normalizeTitle(title: string | null | undefined): string {
  if (!title) return '';

  let normalized = normalizeText(title);

  // Normalize seniority levels
  normalized = normalized
    .replace(/\bsr\b/g, 'senior')
    .replace(/\bjr\b/g, 'junior')
    .replace(/\blead\b/g, 'lead')
    .replace(/\bprincipal\b/g, 'principal')
    .replace(/\bstaff\b/g, 'staff');

  // Normalize common abbreviations
  normalized = normalized
    .replace(/\bswe\b/g, 'software engineer')
    .replace(/\bsde\b/g, 'software development engineer')
    .replace(/\bpm\b/g, 'product manager')
    .replace(/\bux\b/g, 'user experience')
    .replace(/\bui\b/g, 'user interface');

  return normalized;
}

export function normalizeLocation(location: string | null | undefined): string {
  if (!location) return '';

  let normalized = normalizeText(location);

  // Remove common location descriptors
  normalized = normalized
    .replace(/\bunited states\b/g, 'us')
    .replace(/\busa\b/g, 'us')
    .replace(/\bremote\b/g, '')
    .replace(/\bhybrid\b/g, '')
    .replace(/\bon-site\b/g, '')
    .replace(/\bonsite\b/g, '');

  // Normalize state abbreviations to full names or vice versa
  // (keeping it simple - just normalize whitespace)
  return normalized.trim();
}

export function isRemoteJob(
  title: string | null | undefined,
  location: string | null | undefined,
  description: string | null | undefined
): boolean {
  const textToCheck = [title, location, description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return textToCheck.includes('remote') ||
         textToCheck.includes('work from home') ||
         textToCheck.includes('wfh') ||
         textToCheck.includes('anywhere');
}
