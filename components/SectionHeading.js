import Link from "next/link";
import styles from "@/components/SectionHeading.module.css";

export default function SectionHeading({ eyebrow, title, intro, actionLabel, actionHref }) {
  let action = null;
  if (actionLabel && actionHref) {
    action = (
      <Link href={actionHref} className={styles.action}>
        {actionLabel} &rarr;
      </Link>
    );
  }

  return (
    <div className={styles.wrap}>
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className={styles.title}>{title}</h2>
        {intro ? <p className={styles.intro}>{intro}</p> : null}
      </div>
      {action}
    </div>
  );
}
