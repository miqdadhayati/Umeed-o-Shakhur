import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client. Bypasses Row Level Security.
 *
 * The `server-only` import above makes the build fail if this module is ever
 * pulled into a Client Component, so the service-role key cannot reach the
 * browser by accident.
 *
 * Only three things are allowed to use this client, and all of them live in
 * app/api/auth/*: creating an account, redeeming a join code, and reading or
 * writing the teacher-signup and rate-limit tables. Everything else must go
 * through the RLS-bound client in server.js.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Signup routes cannot run without it."
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
