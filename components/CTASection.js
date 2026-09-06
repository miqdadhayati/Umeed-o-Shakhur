import Image from "next/image";
import Button from "@/components/Button";
import styles from "@/components/CTASection.module.css";

export default function CTASection({
  title = "Turn hope into a classroom.",
  body = "Your support funds our mentorship camps — the sessions, the materials, and the cost of bringing students together. Volunteers give time where it counts most.",
  primaryHref = "/donate",
  primaryLabel = "Donate now",
  secondaryHref = "/contact",
  secondaryLabel = "Volunteer with us",
  photo = null
}) {
  let backdrop = null;
  if (photo) {
    backdrop = (
      <div className={styles.media}>
        <Image
          src={photo.src}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          quality={78}
          style={{ objectFit: "cover", objectPosition: "center 45%" }}
        />
        <div className={styles.scrim} aria-hidden="true" />
      </div>
    );
  }

  return (
    <section className={`${styles.cta} ${photo ? styles.hasPhoto : ""}`}>
      {backdrop}
      <div className={`container ${styles.inner}`}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
        <div className={styles.actions}>
          <Button href={primaryHref} variant="primary">
            {primaryLabel}
          </Button>
          <Button href={secondaryHref} variant="ghost" onDark>
            {secondaryLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
