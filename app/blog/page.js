import PageHero from "@/components/PageHero";
import NewsCard from "@/components/NewsCard";
import { getBlogPosts } from "@/lib/content";
import grid from "@/app/page.module.css";
import styles from "@/app/blog/blog.module.css";

export const metadata = {
  title: "Stories",
  description: "Field notes, updates, and stories from the Umeed o Shakhur community."
};

export default function BlogPage() {
  const posts = getBlogPosts();

  let body = null;
  if (posts.length === 0) {
    body = (
      <p className={styles.empty}>
        We haven&rsquo;t published any stories yet. Updates from our camps will appear here.
      </p>
    );
  } else {
    body = (
      <div className={grid.cardGrid}>
        {posts.map((post) => (
          <NewsCard key={post.slug} post={post} />
        ))}
      </div>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Stories & updates"
        title="What change actually looks like, told from the field."
        intro="Progress reports, student stories, and the honest lessons in between — published by our team through the content system."
      />
      <section className="section">
        <div className="container">{body}</div>
      </section>
    </>
  );
}
