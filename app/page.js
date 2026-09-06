import Hero from "@/components/Hero";
import ImpactMetrics from "@/components/ImpactMetrics";
import SectionHeading from "@/components/SectionHeading";
import ProgramCard from "@/components/ProgramCard";
import NewsCard from "@/components/NewsCard";
import Gallery from "@/components/Gallery";
import CTASection from "@/components/CTASection";
import { getPrograms, getBlogPosts, getSettings } from "@/lib/content";
import { getPhoto, pickPhotos } from "@/lib/photos";
import styles from "@/app/page.module.css";

export default function HomePage() {
  const settings = getSettings();
  const programs = getPrograms();
  const posts = getBlogPosts();

  const heroHeading = settings.hero?.heading || "Every child left out of school is a future we refuse to lose.";
  const heroLede =
    settings.hero?.lede ||
    "Umeed o Shakhur runs free learning centres, scholarships, and teacher training across underserved Pakistani neighbourhoods — so potential is never decided by a postcode.";
  const stats = settings.impact || [];

  const featuredPrograms = programs.slice(0, 3);
  const recentPosts = posts.slice(0, 3);

  // The whole-camp group shot carries the hero: it shows scale and the people
  // the work is for, and it is wide enough to survive a full-bleed crop.
  const heroPhoto = getPhoto("teampic-02");
  const ctaPhoto = getPhoto("teampic-03");

  // First entry becomes the 2x2 feature tile; nine photos fill the grid exactly.
  const galleryPhotos = pickPhotos(
    "classroom-18",
    "fieldwork-01",
    "classroom-17",
    "classroom-20",
    "teampic-06",
    "classroom-15",
    "fieldwork-02",
    "classroom-09",
    "classroom-21"
  );

  let programsBlock = null;
  if (featuredPrograms.length > 0) {
    programsBlock = (
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="What we run"
            title="The camps we have run"
            intro="Every camp is documented and reported honestly — including what it cost and what we would change."
            actionLabel="See all programs"
            actionHref="/programs"
          />
          <div className={styles.cardGrid}>
            {featuredPrograms.map((program) => (
              <ProgramCard key={program.slug} program={program} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  let galleryBlock = null;
  if (galleryPhotos.length > 0) {
    galleryBlock = (
      <section className={`section ${styles.gallerySection}`}>
        <div className="container">
          <SectionHeading
            eyebrow="From the camps"
            title="What a week with us actually looks like"
            intro="Sessions under the trees, group work on the floor, a volleyball match before dinner, and certificates on the last day. Every photo here was taken at one of our camps."
          />
          <Gallery photos={galleryPhotos} />
        </div>
      </section>
    );
  }

  let postsBlock = null;
  if (recentPosts.length > 0) {
    postsBlock = (
      <section className="section" style={{ background: "var(--mist)" }}>
        <div className="container">
          <SectionHeading
            eyebrow="From the field"
            title="Recent stories & updates"
            actionLabel="Read the blog"
            actionHref="/blog"
          />
          <div className={styles.cardGrid}>
            {recentPosts.map((post) => (
              <NewsCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <Hero heading={heroHeading} lede={heroLede} photo={heroPhoto} />
      {stats.length > 0 ? <ImpactMetrics stats={stats} /> : null}
      {programsBlock}
      {galleryBlock}
      {postsBlock}
      <CTASection photo={ctaPhoto} />
    </>
  );
}
