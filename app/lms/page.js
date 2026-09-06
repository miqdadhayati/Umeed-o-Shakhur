import { redirect } from "next/navigation";

/**
 * /lms is the entry point. Middleware already sends signed-in users to their
 * dashboard, so anyone reaching this page needs to sign in first.
 */
export default function LmsIndexPage() {
  redirect("/lms/login");
}
