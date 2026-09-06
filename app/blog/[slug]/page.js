import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CTASection from "@/components/CTASection";
import { getBlogPosts, getBlogPost } from "@/lib/content";
import styles from "@/app/blog/[slug]/post.module.css";

export function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }) {
  const post = getBlogPost(params.slug);
  if (!post) {
    return { title: "Story not found" };
  }

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.excerpt
  };
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export default function BlogPostPage({ params }) {
  const post = getBlogPost(params.slug);
  if (!post) {
    notFound();
  }

  const { frontmatter, html } = post;

  let cover = null;
  if (frontmatter.cover) {
    cover = (
      <div className={styles.cover}>
        <Image
          src={frontmatter.cover}
          alt={frontmatter.title}
          fill
          priority
          sizes="(max-width: 820px) 100vw, 820px"
          style={{ objectFit: "cover" }}
        />
      </div>
    );
  }

  return (
    <>
      <article className={styles.article}>
        <div className={`container ${styles.head}`}>
          <Link href="/blog" className={styles.back}>
            &larr; All stories
          </Link>
          <div className={styles.meta}>
            {frontmatter.category ? <span>{frontmatter.category}</span> : null}
            <time dateTime={frontmatter.date}>{formatDate(frontmatter.date)}</time>
          </div>
          <h1 className={styles.title}>{frontmatter.title}</h1>
          {frontmatter.author ? <p className={styles.author}>By {frontmatter.author}</p> : null}
        </div>

        {cover}

        <div
          className={`container ${styles.prose}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
      <CTASection />
    </>
  );
}
