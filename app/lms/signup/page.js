import StudentSignupForm from "@/app/lms/signup/StudentSignupForm";
import styles from "@/app/lms/lms.module.css";

export const metadata = {
  title: "Join with a class code",
  description: "Students join the Umeed o Shakhur learning portal with the code from their teacher."
};

export default function StudentSignupPage() {
  return (
    <div className={`container ${styles.authWrap}`}>
      <div className={styles.card}>
        <h1>Join your class</h1>
        <p className={styles.cardIntro}>
          Your teacher will give you a class code at camp. You need that code to join — it is what
          tells us you are one of our students.
        </p>

        <StudentSignupForm />

        <p className={styles.switcher}>
          Already have an account? <a href="/lms/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
