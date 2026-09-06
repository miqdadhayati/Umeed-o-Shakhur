import { site } from "@/lib/site";

/**
 * Keep the CMS panel and the student portal out of search results. Neither is
 * public-facing, and /admin in particular should not be discoverable.
 * This is a crawler hint, not access control — the portal's real protection is
 * Supabase Row Level Security.
 */
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/lms/", "/api/"] }],
    sitemap: `${site.url}/sitemap.xml`
  };
}
