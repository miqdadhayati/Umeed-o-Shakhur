import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Request-scoped Supabase client for Server Components and route handlers.
 *
 * Uses the anon key, so every query it runs is still subject to Row Level
 * Security under the signed-in user's identity. This is the client to reach
 * for by default — see admin.js for the (rare) privileged path.
 */
/** True once both public Supabase env vars are present. */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Session refresh is handled in middleware instead.
          }
        }
      }
    }
  );
}

/** The signed-in user's profile (id, name, role), or null. */
export async function getSessionProfile() {
  // Before the project is connected there is no session to read. Returning
  // null lets callers redirect to the login page, which explains the state,
  // instead of throwing a 500 at the visitor.
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();

  // getUser() re-validates against Supabase; getSession() would trust a cookie
  // the browser could have tampered with.
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return { ...profile, email: user.email };
}
