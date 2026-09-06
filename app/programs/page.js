import PageHero from "@/components/PageHero";
import ProgramCard from "@/components/ProgramCard";
import CTASection from "@/components/CTASection";
import { getPrograms } from "@/lib/content";
import { getPhoto } from "@/lib/photos";
import grid from "@/app/page.module.css";
import styles from "@/app/programs/programs.module.css";

export const metadata = {
  title: "Programs & Missions",
  description: "Ongoing and upcoming education programs run by Umeed o Shakhur."
};

export default function ProgramsPage() {
  const programs = getPrograms();

  const ongoing = programs.filter((program) => program.frontmatter.status === "Ongoing");
  const upcoming = programs.filter((program) => program.frontmatter.status === "Upcoming");
  const completed = programs.filter((program) => program.frontmatter.status === "Completed");

  function renderGroup(title, label, items) {
    if (items.length === 0) {
      return null;
    }

    return (
      <section className="section">
        <div className="container">
          <div className={styles.groupHead}>
            <p className="eyebrow">{label}</p>
            <h2 className={styles.groupTitle}>{title}</h2>
          </div>
          <div className={grid.cardGrid}>
            {items.map((program) => (
              <ProgramCard key={program.slug} program={program} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  let body = null;
  if (programs.length === 0) {
    body = (
      <section className="section">
        <div className="container">
          <p className={styles.empty}>
            Programs are being published through our content system. Check back shortly, or write to us
            to hear what is launching next.
          </p>
        </div>
      </section>
    );
  } else {
    body = (
      <>
        {renderGroup("Running now", "Ongoing", ongoing)}
        {renderGroup("Launching soon", "Upcoming", upcoming)}
        {renderGroup("Delivered", "Completed", completed)}
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Programs & missions"
        title="A few things, done properly."
        intro="We would rather do a few things well than spread thin. Here is every camp we have run, and what is coming next."
        photo={getPhoto("classroom-14")}
      />
      {body}
      <CTASection
        title="Sponsor a program"
        photo={getPhoto("classroom-17")}
        body="Organisations and individuals can fund a whole camp. We will tell you what it cost and how it went."
        primaryLabel="Talk to us"
        primaryHref="/contact"
        secondaryLabel="Give a one-off donation"
        secondaryHref="/donate"
      />
    </>
  );
}
