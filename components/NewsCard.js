import Link from "next/link";
import Image from "next/image";
import styles from "@/components/NewsCard.module.css";

function formatDate(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default function NewsCard({ post }) {
  const { slug, frontmatter } = post;

  let media = null;
  if (frontmatter.cover) {
    media = (
      <div className={styles.media}>
        <Image
          src={frontmatter.cover}
          alt={frontmatter.title}
          fill
          sizes="(max-width: 760px) 100vw, 380px"
          style={{ objectFit: "cover" }}
        />
      </div>
    );
  }

  return (
    <article className={styles.card}>
      <Link href={`/blog/${slug}`} className={styles.link}>
        {media}
        <div className={styles.body}>
          <div className={styles.meta}>
            {frontmatter.category ? <span>{frontmatter.category}</span> : null}
            <time dateTime={frontmatter.date}>{formatDate(frontmatter.date)}</time>
          </div>
          <h3 className={styles.title}>{frontmatter.title}</h3>
          <p className={styles.excerpt}>{frontmatter.excerpt}</p>
          <span className={styles.more}>Read story &rarr;</span>
        </div>
      </Link>
    </article>
  );
}
