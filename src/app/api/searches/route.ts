import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { trackedSearches, searchJobs, jobs } from '@/lib/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TrackedSearchWithStats, EmploymentType } from '@/types';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

// GET /api/searches - List this user's tracked searches with stats
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Only fetch THIS user's searches
    const searches = await db
      .select()
      .from(trackedSearches)
      .where(eq(trackedSearches.userId, user.id))
      .orderBy(trackedSearches.createdAt);

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const searchesWithStats: TrackedSearchWithStats[] = await Promise.all(
      searches.map(async (search) => {
        const totalResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(searchJobs)
          .where(eq(searchJobs.searchId, search.id));

        const todayResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(searchJobs)
          .innerJoin(jobs, eq(searchJobs.jobId, jobs.id))
          .where(
            and(
              eq(searchJobs.searchId, search.id),
              gte(jobs.postedAt, twentyFourHoursAgo)
            )
          );

        return {
          id: search.id,
          query: search.query,
          location: search.location,
          employmentType: (search.employmentType || 'all') as EmploymentType,
          isActive: search.isActive ?? true,
          createdAt: search.createdAt,
          lastFetchedAt: search.lastFetchedAt,
          totalJobs: totalResult[0]?.count || 0,
          todayJobs: todayResult[0]?.count || 0,
        };
      })
    );

    return NextResponse.json(searchesWithStats);
  } catch (error) {
    console.error('Error fetching searches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch searches' },
      { status: 500 }
    );
  }
}

// POST /api/searches - Create a new tracked search for this user
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { query, location, employmentType } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const now = new Date();

    await db.insert(trackedSearches).values({
      id,
      userId: user.id,
      query: query.trim(),
      location: location?.trim() || null,
      employmentType: employmentType || 'all',
      isActive: true,
      createdAt: now,
      lastFetchedAt: null,
    });

    const newSearch = {
      id,
      query: query.trim(),
      location: location?.trim() || null,
      employmentType: employmentType || 'all',
      isActive: true,
      createdAt: now,
      lastFetchedAt: null,
      totalJobs: 0,
      todayJobs: 0,
    };

    return NextResponse.json(newSearch, { status: 201 });
  } catch (error) {
    console.error('Error creating search:', error);
    return NextResponse.json(
      { error: 'Failed to create search' },
      { status: 500 }
    );
  }
}

// DELETE /api/searches - Delete a tracked search (only if it belongs to this user)
export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      );
    }

    // Only delete if this search belongs to the current user
    await db
      .delete(trackedSearches)
      .where(and(eq(trackedSearches.id, id), eq(trackedSearches.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting search:', error);
    return NextResponse.json(
      { error: 'Failed to delete search' },
      { status: 500 }
    );
  }
}
