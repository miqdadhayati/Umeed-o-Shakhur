import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getSessionProfile } from "@/lib/supabase/server";
import SignOutButton from "@/app/lms/SignOutButton";
import styles from "@/app/lms/lms.module.css";

export const metadata = { title: "Your portal" };
export const dynamic = "force-dynamic";

function formatDate(value) {
  if (!value) {
    return null;
  }
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default async function DashboardPage() {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect("/lms/login");
  }

  const supabase = await createClient();

  // RLS decides what comes back — a student only ever sees their own classes'
  // rows, so there is no class filter to write (or forget) here.
  const [announcements, assignments, resources] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("assignments")
      .select("id, title, instructions, due_on")
      .order("due_on", { ascending: true, nullsFirst: false })
      .limit(20),
    supabase
      .from("resources")
      .select("id, title, description, url")
      .order("created_at", { ascending: false })
      .limit(30)
  ]);

  const firstName = profile.full_name.split(" ")[0];

  return (
    <div className={`container ${styles.shell}`}>
      <header className={styles.appBar}>
        <h1 className={styles.greeting}>
          Hello, {firstName}
          <span className={styles.roleChip}>{profile.role}</span>
        </h1>
        <div className={styles.barActions}>
          {profile.role === "teacher" ? (
            <Link className={styles.linkBtn} href="/lms/teacher">
              Teacher console
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      </header>

      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2 className={styles.blockTitle}>Announcements</h2>
        </div>
        {announcements.data?.length ? (
          <ul className={styles.list}>
            {announcements.data.map((item) => (
              <li key={item.id} className={styles.item}>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <p className={styles.itemBody}>{item.body}</p>
                <p className={styles.itemMeta}>{formatDate(item.created_at)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>No announcements yet.</p>
        )}
      </section>

      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2 className={styles.blockTitle}>Assignments</h2>
        </div>
        {assignments.data?.length ? (
          <ul className={styles.list}>
            {assignments.data.map((item) => (
              <li key={item.id} className={`${styles.item} ${styles.itemDue}`}>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                <p className={styles.itemBody}>{item.instructions}</p>
                <p className={styles.itemMeta}>
                  {item.due_on ? `Due ${formatDate(item.due_on)}` : "No due date"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>Nothing due right now.</p>
        )}
      </section>

      <section className={styles.block}>
        <div className={styles.blockHead}>
          <h2 className={styles.blockTitle}>Library</h2>
        </div>
        {resources.data?.length ? (
          <ul className={styles.list}>
            {resources.data.map((item) => (
              <li key={item.id} className={styles.item}>
                <h3 className={styles.itemTitle}>{item.title}</h3>
                {item.description ? <p className={styles.itemBody}>{item.description}</p> : null}
                <a
                  className={styles.itemLink}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open ↗
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>No books or links have been shared yet.</p>
        )}
      </section>
    </div>
  );
}
