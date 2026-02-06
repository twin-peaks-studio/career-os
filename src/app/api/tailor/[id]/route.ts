import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/tailor/[id] — get session details + outputs
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the session
  const { data: session, error: sessionError } = await supabase
    .from('tailoring_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Fetch outputs for this session
  const { data: outputs, error: outputsError } = await supabase
    .from('tailoring_outputs')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  if (outputsError) {
    return NextResponse.json({ error: outputsError.message }, { status: 500 });
  }

  return NextResponse.json({
    session,
    outputs: outputs ?? [],
  });
}

// DELETE /api/tailor/[id] — delete a session and its outputs
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('tailoring_sessions')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
