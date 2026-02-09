import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Runs on every request before it reaches your pages/API routes.
 * Two jobs:
 *   1. Refresh the auth session (keeps you logged in)
 *   2. Redirect unauthenticated users to /login
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update cookies on the request (so downstream server code sees them)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Recreate the response with updated cookies
          supabaseResponse = NextResponse.next({ request });
          // Set cookies on the response (so the browser receives them)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check who's logged in. getUser() talks to Supabase's server (secure).
  // getSession() only reads the cookie (can be faked). Always use getUser().
  const { data: { user } } = await supabase.auth.getUser();

  // Only redirect page requests, not API calls (API routes return 401 themselves)
  if (!request.nextUrl.pathname.startsWith('/api')) {
    const isAuthPage =
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup') ||
      request.nextUrl.pathname.startsWith('/auth');

    if (!user && !isAuthPage) {
      // Not logged in + trying to access a protected page → go to login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    if (user && (request.nextUrl.pathname.startsWith('/login') ||
                 request.nextUrl.pathname.startsWith('/signup'))) {
      // Already logged in + on login page → go to dashboard
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
