import Image from "next/image";
import PageHero from "@/components/PageHero";
import CTASection from "@/components/CTASection";
import Gallery from "@/components/Gallery";
import { site } from "@/lib/site";
import { getPhoto, pickPhotos } from "@/lib/photos";
import styles from "@/app/about/about.module.css";

export const metadata = {
  title: "About",
  description: "The people and thinking behind Umeed o Shakhur."
};

const framework = [
  {
    label: "Vision",
    text: "A Pakistan where a child's right to learn is never rationed by income, gender, or geography."
  },
  {
    label: "Mission",
    text: "To remove the practical barriers that push young people out of education — cost, distance, and a shortage of people to learn from — one community at a time."
  },
  {
    label: "How we work",
    text: "We run camps inside the communities we serve, taught by volunteer mentors, and we would rather report honestly on a small amount of work than overstate a large amount."
  }
];

// Only rows with a verified value are shown. Everything here is empty until the
// NGO supplies it, so the card stays hidden rather than displaying blanks.
const governance = [
  { label: "Legal status", value: site.registration },
  { label: "Registered office", value: site.address }
].filter((row) => row.value);

export default function AboutPage() {
  const heroPhoto = getPhoto("teampic-01");
  const storyPhoto = getPhoto("classroom-21");
  const galleryPhotos = pickPhotos(
    "classroom-19",
    "fieldwork-03",
    "classroom-22",
    "teampic-07",
    "classroom-03"
  );

  return (
    <>
      <PageHero
        eyebrow="Who we are"
        title="Volunteer mentors, teaching in the communities they come from."
        intro="Umeed o Shakhur runs education and mentorship camps for young people who are a long way from the opportunities that decide a future."
        photo={heroPhoto}
      />

      <section className="section">
        <div className={`container ${governance.length ? styles.story : ""}`}>
          <div className={styles.narrative}>
            <h2>What we do</h2>
            <p>
              We run residential mentorship camps. Volunteer mentors spend a week with students —
              teaching sessions on university and career pathways, health, climate, and study
              skills, and working alongside them in small groups on projects they present
              themselves.
            </p>
            <p>
              The camps are deliberately low-infrastructure. We use whatever space a community
              already has: a school building, a courtyard, mats under the trees. That keeps costs
              down and means we can run somewhere without waiting for a facility to exist first.
            </p>
            <p>
              We are early. Two camps have run so far, and we would rather tell you exactly what
              those involved than describe a programme we have not built yet.
            </p>

            {storyPhoto ? (
              <figure className={styles.storyPhoto}>
                <Image
                  src={storyPhoto.src}
                  alt={storyPhoto.alt}
                  width={1200}
                  height={800}
                  sizes="(max-width: 900px) 100vw, 640px"
                  style={{ width: "100%", height: "auto" }}
                />
              </figure>
            ) : null}
          </div>

          {governance.length ? (
            <aside className={styles.regCard}>
              <h3>Registration &amp; governance</h3>
              <dl>
                {governance.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          ) : null}
        </div>
      </section>

      <section className="section" style={{ background: "var(--mist)" }}>
        <div className="container">
          <p className="eyebrow">Our framework</p>
          <h2 className={styles.frameworkTitle}>The thinking that holds it all together</h2>
          <div className={styles.frameworkGrid}>
            {framework.map((item) => (
              <article key={item.label} className={styles.frameworkCard}>
                <span className={styles.frameworkLabel}>{item.label}</span>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {galleryPhotos.length > 0 ? (
        <section className="section">
          <div className="container">
            <p className="eyebrow">In the field</p>
            <h2 className={styles.frameworkTitle}>Moments from our camps</h2>
            <Gallery photos={galleryPhotos} />
          </div>
        </section>
      ) : null}

      <CTASection
        title="Want to know more?"
        body="Ask us anything about a camp we have run — who taught, what it covered, and what it cost. We will tell you."
        primaryLabel="Get in touch"
        primaryHref="/contact"
        secondaryLabel="See our programs"
        secondaryHref="/programs"
      />
    </>
  );
}
