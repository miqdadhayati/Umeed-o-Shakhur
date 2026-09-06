import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getSessionProfile } from "@/lib/supabase/server";
import SignOutButton from "@/app/lms/SignOutButton";
import ActionForm from "@/app/lms/teacher/ActionForm";
import {
  createClassAction,
  postAnnouncementAction,
  postAssignmentAction,
  postResourceAction,
  rotateCodeAction,
  toggleClassAction
} from "@/app/lms/teacher/actions";
import styles from "@/app/lms/lms.module.css";

export const metadata = { title: "Teacher console" };
export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect("/lms/login");
  }
  // Belt-and-braces: RLS already blocks every write below for a student, but
  // there is no reason to render a console they cannot use.
  if (profile.role !== "teacher") {
    redirect("/lms/dashboard");
  }

  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("class_overview")
    .select("id, name, join_code, active, uses, max_uses, expires_at, member_count")
    .order("created_at", { ascending: false });

  const classOptions = classes || [];

  const audiencePicker = (
    <label className={styles.field}>
      <span className={styles.label}>Who sees this?</span>
      <select className={styles.select} name="classId" defaultValue="all">
        <option value="all">Everyone</option>
        {classOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className={`container ${styles.shell}`}>
      <header className={styles.appBar}>
        <h1 className={styles.greeting}>
          Teacher console
          <span className={styles.roleChip}>teacher</span>
        </h1>
        <div className={styles.barActions}>
          <Link className={styles.linkBtn} href="/lms/dashboard">
            Student view
          </Link>
          <SignOutButton />
        </div>
      </header>

      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Classes &amp; join codes</h2>
        <p className={styles.cardIntro}>
          Read a class code out at camp. Anyone with the code can join that class, so set a seat
          limit and change the code once everyone is in.
        </p>

        <div className={styles.panel}>
          <h3>New class</h3>
          <ActionForm action={createClassAction} label="Create class" inline successText="Class created.">
            <label className={styles.field}>
              <span className={styles.label}>Class name</span>
              <input className={styles.input} name="name" required maxLength={80} />
            </label>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>
                  Seat limit
                  <span className={styles.hint}>Optional. Blank = unlimited.</span>
                </span>
                <input className={styles.input} name="maxUses" type="number" min="1" max="1000" />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>
                  Code expires in
                  <span className={styles.hint}>Optional, in days.</span>
                </span>
                <input className={styles.input} name="expiresDays" type="number" min="1" max="365" />
              </label>
            </div>
          </ActionForm>
        </div>

        {classOptions.length ? (
          <div className={styles.panel}>
            {classOptions.map((item) => {
              const expired = item.expires_at && new Date(item.expires_at) < new Date();
              const full = item.max_uses !== null && item.uses >= item.max_uses;
              let status = "Open";
              if (!item.active) {
                status = "Closed";
              } else if (expired) {
                status = "Expired";
              } else if (full) {
                status = "Full";
              }

              return (
                <div key={item.id} className={styles.classRow}>
                  <div>
                    <h3 className={styles.itemTitle}>{item.name}</h3>
                    <p className={styles.itemMeta}>
                      {item.member_count} joined
                      {item.max_uses !== null ? ` · ${item.uses}/${item.max_uses} seats used` : ""}
                      {` · ${status}`}
                    </p>
                  </div>
                  <div className={styles.barActions}>
                    <span className={styles.codeChip}>{item.join_code}</span>
                    <ActionForm action={rotateCodeAction} label="New code" inline>
                      <input type="hidden" name="classId" value={item.id} />
                    </ActionForm>
                    <ActionForm
                      action={toggleClassAction}
                      label={item.active ? "Close" : "Reopen"}
                      inline
                    >
                      <input type="hidden" name="classId" value={item.id} />
                      <input type="hidden" name="active" value={String(item.active)} />
                    </ActionForm>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>No classes yet. Create one above to get a join code.</p>
        )}
      </section>

      <section className={styles.block}>
        <h2 className={styles.blockTitle}>Post something</h2>

        <div className={styles.panel}>
          <h3>Announcement</h3>
          <ActionForm action={postAnnouncementAction} label="Post announcement" inline successText="Posted.">
            <label className={styles.field}>
              <span className={styles.label}>Title</span>
              <input className={styles.input} name="title" required maxLength={140} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Message</span>
              <textarea className={styles.textarea} name="body" required maxLength={4000} />
            </label>
            {audiencePicker}
          </ActionForm>
        </div>

        <div className={styles.panel}>
          <h3>Assignment</h3>
          <ActionForm action={postAssignmentAction} label="Post assignment" inline successText="Posted.">
            <label className={styles.field}>
              <span className={styles.label}>Title</span>
              <input className={styles.input} name="title" required maxLength={140} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Instructions</span>
              <textarea className={styles.textarea} name="instructions" required maxLength={4000} />
            </label>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>
                  Due date
                  <span className={styles.hint}>Optional.</span>
                </span>
                <input className={styles.input} name="dueOn" type="date" />
              </label>
              {audiencePicker}
            </div>
          </ActionForm>
        </div>

        <div className={styles.panel}>
          <h3>Book or link</h3>
          <ActionForm action={postResourceAction} label="Add to library" inline successText="Added.">
            <label className={styles.field}>
              <span className={styles.label}>Title</span>
              <input className={styles.input} name="title" required maxLength={140} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>
                Link
                <span className={styles.hint}>A PDF, a video, or any web page.</span>
              </span>
              <input
                className={styles.input}
                name="url"
                type="url"
                placeholder="https://"
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>
                Description
                <span className={styles.hint}>Optional.</span>
              </span>
              <input className={styles.input} name="description" maxLength={500} />
            </label>
            {audiencePicker}
          </ActionForm>
        </div>
      </section>
    </div>
  );
}
