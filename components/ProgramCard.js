import Image from "next/image";
import styles from "@/components/ProgramCard.module.css";

export default function ProgramCard({ program }) {
  const { frontmatter } = program;

  let statusClass = styles.statusOngoing;
  if (frontmatter.status === "Upcoming") {
    statusClass = styles.statusUpcoming;
  } else if (frontmatter.status === "Completed") {
    statusClass = styles.statusDone;
  }

  let media = null;
  if (frontmatter.image) {
    media = (
      <div className={styles.media}>
        <Image
          src={frontmatter.image}
          alt={frontmatter.title}
          fill
          sizes="(max-width: 760px) 100vw, 360px"
          style={{ objectFit: "cover" }}
        />
      </div>
    );
  }

  return (
    <article className={styles.card}>
      {media}
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.tag}>{frontmatter.category}</span>
          <span className={`${styles.status} ${statusClass}`}>{frontmatter.status}</span>
        </div>
        <h3 className={styles.title}>{frontmatter.title}</h3>
        <p className={styles.summary}>{frontmatter.summary}</p>
        {frontmatter.location ? <p className={styles.location}>{frontmatter.location}</p> : null}
      </div>
    </article>
  );
}
