"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Carries only the anon key, which is safe to ship
 * publicly *because* every table has Row Level Security enabled — the key
 * identifies the project, it does not grant access.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
