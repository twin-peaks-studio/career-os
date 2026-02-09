import { createClient } from './server';

/**
 * Call this at the top of any API route to get the logged-in user.
 * Returns the user object, or null if not logged in.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
