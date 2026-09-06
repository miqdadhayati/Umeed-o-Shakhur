// LMS route segment.
//
// This boundary isolates the future Learning Management System from the public
// static site. Public marketing routes (/, /about, /programs, /blog, /donate,
// /contact) stay statically generated and cacheable; everything dynamic and
// authenticated lives under /lms and will not affect them.
//
// In the LMS phase, wrap children here with the auth/session provider
// (e.g. Supabase) and add role-scoped folders alongside coming-soon:
//   app/lms/(auth)/login
//   app/lms/admin
//   app/lms/teacher
//   app/lms/student
// Adding those routes requires no change to the public pages above.

export default function LmsLayout({ children }) {
  return children;
}
