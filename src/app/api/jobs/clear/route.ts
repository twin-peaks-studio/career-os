import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seenJobs, savedJobs, searchJobs, trackedSearches } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

// DELETE /api/jobs/clear - Clear THIS user's job data only
// Previously this nuked every job in the database. Now it only clears
// the current user's seen markers, saved jobs, and search-job links.
// The shared jobs table is NOT touched.
export async function DELETE() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Clear this user's "seen" markers
    await db.delete(seenJobs).where(eq(seenJobs.userId, user.id));

    // 2. Clear this user's saved jobs
    await db.delete(savedJobs).where(eq(savedJobs.userId, user.id));

    // 3. Clear search-job links for this user's searches
    const userSearches = await db
      .select({ id: trackedSearches.id })
      .from(trackedSearches)
      .where(eq(trackedSearches.userId, user.id));

    const searchIds = userSearches.map(s => s.id);
    if (searchIds.length > 0) {
      await db.delete(searchJobs).where(inArray(searchJobs.searchId, searchIds));
    }

    // We intentionally do NOT delete from the jobs table.
    // Jobs are a shared resource — other users may reference them.

    return NextResponse.json({
      success: true,
      message: 'Your job data has been cleared',
    });
  } catch (error) {
    console.error('Error clearing user jobs:', error);
    return NextResponse.json(
      { error: 'Failed to clear jobs' },
      { status: 500 }
    );
  }
}
