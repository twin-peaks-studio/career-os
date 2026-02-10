import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Handles the redirect from Supabase after email confirmation or OAuth.
 * When a user clicks the link in their confirmation email, Supabase
 * redirects them here with a code. We exchange that code for a login session.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send them back to login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
