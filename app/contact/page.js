import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import { site, activeSocial } from "@/lib/site";
import { getPhoto } from "@/lib/photos";
import styles from "@/app/contact/contact.module.css";

export const metadata = {
  title: "Contact",
  description:
    "Get in touch with Umeed o Shakhur — volunteer, partner, or simply ask a question. Email, phone, location, and social handles.",
};

export default function ContactPage() {
  const phoneHref = "tel:" + site.phone.replace(/\s/g, "");

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Tell us how you would like to help — or just say hello."
        intro="Whether you want to volunteer, partner on a camp, or learn more before you give — we read every message that comes through."
        photo={getPhoto("classroom-10")}
      />

      <section className="section">
        <div className={`container ${styles.layout}`}>
          <div className={styles.formCol}>
            <h2 className={styles.formTitle}>Send us a message</h2>
            <ContactForm />
          </div>

          <aside className={styles.info}>
            <div className={styles.block}>
              <h3 className={styles.blockTitle}>Reach us directly</h3>
              {site.email || site.phone || site.address ? (
                <ul className={styles.list}>
                  {site.email ? (
                    <li>
                      <span className={styles.label}>Email</span>
                      <a href={`mailto:${site.email}`}>{site.email}</a>
                    </li>
                  ) : null}
                  {site.phone ? (
                    <li>
                      <span className={styles.label}>Phone</span>
                      <a href={phoneHref}>{site.phone}</a>
                    </li>
                  ) : null}
                  {site.address ? (
                    <li>
                      <span className={styles.label}>Office</span>
                      <span>{site.address}</span>
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p className={styles.label}>
                  The form is the fastest way to reach us — it goes straight to our team.
                </p>
              )}
            </div>

            {activeSocial.length > 0 ? (
              <div className={styles.block}>
                <h3 className={styles.blockTitle}>Follow our work</h3>
                <ul className={styles.social}>
                  {activeSocial.map((item) => (
                    <li key={item.label}>
                      <a href={item.href} target="_blank" rel="noreferrer">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section id="volunteer" className="section" style={{ background: "var(--mist)" }}>
        <div className={`container ${styles.volunteer}`}>
          <p className="eyebrow">Volunteer</p>
          <h2 className={styles.volunteerTitle}>Give your time where it counts</h2>
          <p className={styles.volunteerBody}>
            We welcome teachers, mentors, translators, designers, and organisers. Tell us your skills
            and availability using the form above — choose &ldquo;Volunteering&rdquo; as your reason
            for writing, and our coordinator will match you to a program that fits.
          </p>
        </div>
      </section>
    </>
  );
}
