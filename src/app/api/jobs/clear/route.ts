import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobs, searchJobs, seenJobs } from '@/lib/db/schema';

// DELETE /api/jobs/clear - Clear all jobs from the database
export async function DELETE() {
  try {
    // Delete in order due to foreign key constraints
    await db.delete(seenJobs);
    await db.delete(searchJobs);
    await db.delete(jobs);

    return NextResponse.json({ success: true, message: 'All jobs cleared' });
  } catch (error) {
    console.error('Error clearing jobs:', error);
    return NextResponse.json(
      { error: 'Failed to clear jobs' },
      { status: 500 }
    );
  }
}
