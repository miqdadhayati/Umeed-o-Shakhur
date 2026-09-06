import TeacherSignupForm from "@/app/lms/signup/teacher/TeacherSignupForm";
import styles from "@/app/lms/lms.module.css";

export const metadata = {
  title: "Request teacher access",
  description: "Teachers request access to the Umeed o Shakhur learning portal."
};

export default function TeacherSignupPage() {
  return (
    <div className={`container ${styles.authWrap}`}>
      <div className={styles.card}>
        <h1>Teacher access</h1>
        <p className={styles.cardIntro}>
          Teacher accounts are approved by the NGO office. Enter your details and we will send an
          approval code to the office — ask them for it, then finish signing up below.
        </p>

        <TeacherSignupForm />

        <p className={styles.switcher}>
          Already have an account? <a href="/lms/login">Sign in</a>
          <br />
          Student? <a href="/lms/signup">Join with a class code</a>
        </p>
      </div>
    </div>
  );
}
