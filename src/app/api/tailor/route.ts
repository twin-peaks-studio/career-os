import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runTailoringSession } from '@/lib/tailoring/engine';

// POST /api/tailor — create a new tailoring session and start generation
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    job_description_text,
    target_role,
    target_company,
    generate_resume = true,
    generate_cover_letter = true,
  } = body;

  if (!job_description_text || !target_role || !target_company) {
    return NextResponse.json(
      { error: 'job_description_text, target_role, and target_company are required' },
      { status: 400 }
    );
  }

  // Create the session record
  const { data: session, error: insertError } = await supabase
    .from('tailoring_sessions')
    .insert({
      user_id: user.id,
      job_description_text,
      target_role,
      target_company,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError || !session) {
    return NextResponse.json(
      { error: `Failed to create session: ${insertError?.message}` },
      { status: 500 }
    );
  }

  // Start generation in the background (non-blocking)
  // We don't await this — the client polls for status
  runTailoringSession({
    sessionId: session.id,
    userId: user.id,
    jobDescriptionText: job_description_text,
    targetRole: target_role,
    targetCompany: target_company,
    generateResume: generate_resume,
    generateCoverLetter: generate_cover_letter,
  }).catch((err) => {
    console.error(`Tailoring session ${session.id} failed:`, err);
  });

  return NextResponse.json(session, { status: 201 });
}

// GET /api/tailor — list all sessions for the current user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('tailoring_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
