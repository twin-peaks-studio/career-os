export type Source = 'google' | 'indeed' | 'linkedin';

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'all';

export interface Job {
  id: string;
  dedupHash: string;
  title: string;
  titleNormalized: string;
  company: string | null;
  companyNormalized: string | null;
  location: string | null;
  locationNormalized: string | null;
  isRemote: boolean;
  employmentType: string | null;
  description: string | null;
  salary: string | null;
  postedAt: Date | null;
  firstSeenAt: Date;
  sources: Source[];
  urls: Record<Source, string>;
}

export interface TrackedSearch {
  id: string;
  query: string;
  location: string | null;
  employmentType: EmploymentType;
  isActive: boolean;
  createdAt: Date;
  lastFetchedAt: Date | null;
}

export interface TrackedSearchWithStats extends TrackedSearch {
  totalJobs: number;
  todayJobs: number;
}

export interface SearchParams {
  query: string;
  location?: string;
  employmentType?: EmploymentType;
}

export interface RawJob {
  externalId: string;
  source: Source;
  title: string;
  company: string | null;
  location: string | null;
  isRemote: boolean;
  employmentType: string | null;
  description: string | null;
  salary: string | null;
  url: string;
  postedAt: Date | null;
}

export interface FetchResult {
  jobs: RawJob[];
  source: Source;
  error?: string;
}

export interface AggregatedResult {
  jobs: Job[];
  sources: {
    name: Source;
    count: number;
    error?: string;
  }[];
  fetchedAt: Date;
}
