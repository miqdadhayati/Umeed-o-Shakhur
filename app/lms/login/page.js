import LoginForm from "@/app/lms/login/LoginForm";
import styles from "@/app/lms/lms.module.css";

export const metadata = {
  title: "Sign in",
  description: "Sign in to the Umeed o Shakhur learning portal."
};

export default function LoginPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <div className={`container ${styles.authWrap}`}>
      <div className={styles.card}>
        <h1>Sign in</h1>
        <p className={styles.cardIntro}>
          Your learning portal — announcements, assignments, and the library.
        </p>

        {configured ? (
          <LoginForm />
        ) : (
          <p className={`${styles.alert} ${styles.alertInfo}`}>
            The portal is not connected yet. Please check back shortly.
          </p>
        )}

        <p className={styles.switcher}>
          New student? <a href="/lms/signup">Join with a class code</a>
          <br />
          Teacher? <a href="/lms/signup/teacher">Request teacher access</a>
        </p>
      </div>
    </div>
  );
}
