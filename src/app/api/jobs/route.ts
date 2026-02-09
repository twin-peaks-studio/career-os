import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs, searchJobs, seenJobs } from '@/lib/db/schema';
import { eq, desc, gte, sql, inArray } from 'drizzle-orm';
import { Job, Source } from '@/types';
import { isPostedToday } from '@/lib/jobs/deduplicator';

function dbJobToJob(row: typeof jobs.$inferSelect): Job {
  return {
    id: row.id,
    dedupHash: row.dedupHash,
    title: row.title,
    titleNormalized: row.titleNormalized || '',
    company: row.company,
    companyNormalized: row.companyNormalized || '',
    location: row.location,
    locationNormalized: row.locationNormalized || '',
    isRemote: row.isRemote ?? false,
    employmentType: row.employmentType,
    description: row.description,
    salary: row.salary,
    postedAt: row.postedAt,
    firstSeenAt: row.firstSeenAt,
    sources: row.sources as Source[],
    urls: row.urls as Record<Source, string>,
  };
}

// GET /api/jobs?searchId=xxx - Get jobs for a tracked search
// GET /api/jobs?today=true - Get all jobs posted today
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get('searchId');
    const today = searchParams.get('today') === 'true';

    let jobRows: (typeof jobs.$inferSelect)[];

    if (today) {
      // Get all jobs posted in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      jobRows = await db
        .select()
        .from(jobs)
        .where(gte(jobs.postedAt, twentyFourHoursAgo))
        .orderBy(desc(jobs.postedAt))
        .limit(30);
    } else if (searchId) {
      // Get jobs linked to a specific search
      const linkedJobIds = await db
        .select({ jobId: searchJobs.jobId })
        .from(searchJobs)
        .where(eq(searchJobs.searchId, searchId));

      if (linkedJobIds.length === 0) {
        return NextResponse.json([]);
      }

      const ids = linkedJobIds.map(row => row.jobId);

      jobRows = await db
        .select()
        .from(jobs)
        .where(inArray(jobs.id, ids))
        .orderBy(desc(jobs.postedAt))
        .limit(30);
    } else {
      // Get all jobs (most recent first)
      jobRows = await db
        .select()
        .from(jobs)
        .orderBy(desc(jobs.postedAt))
        .limit(30);
    }

    // Get seen status for all jobs
    const seenJobIds = await db.select({ jobId: seenJobs.jobId }).from(seenJobs);
    const seenSet = new Set(seenJobIds.map(row => row.jobId));

    const jobsWithMeta = jobRows.map(row => {
      const job = dbJobToJob(row);
      return {
        ...job,
        isPostedToday: isPostedToday(job.postedAt),
        isSeen: seenSet.has(job.id),
      };
    });

    // Sort: posted today first, then by date
    jobsWithMeta.sort((a, b) => {
      if (a.isPostedToday && !b.isPostedToday) return -1;
      if (!a.isPostedToday && b.isPostedToday) return 1;
      if (!a.postedAt && !b.postedAt) return 0;
      if (!a.postedAt) return 1;
      if (!b.postedAt) return -1;
      return b.postedAt.getTime() - a.postedAt.getTime();
    });

    return NextResponse.json(jobsWithMeta);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST /api/jobs/seen - Mark a job as seen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, action } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (action === 'mark_seen') {
      // Insert or ignore if already exists
      await db.insert(seenJobs).values({
        jobId,
        seenAt: new Date(),
      }).onConflictDoNothing();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}
