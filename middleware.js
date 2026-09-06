import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session cookie on every /lms request and keeps
 * signed-out visitors away from the app pages.
 *
 * This is a convenience redirect, not the security boundary — Row Level
 * Security is. Even if this middleware were bypassed entirely, a signed-out
 * browser still could not read a single row.
 */

const PUBLIC_PATHS = ["/lms", "/lms/login", "/lms/signup", "/lms/signup/teacher"];

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Before Supabase is configured, let the pages render their own setup notice
  // rather than redirect-looping.
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!user && !isPublic) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/lms/login";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && (pathname === "/lms/login" || pathname === "/lms")) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/lms/dashboard";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/lms/:path*"]
};
