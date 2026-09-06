"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/lms/lms.module.css";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/lms/login");
    router.refresh();
  }

  return (
    <button className={styles.linkBtn} type="button" onClick={handleSignOut}>
      Sign out
    </button>
  );
}
