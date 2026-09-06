import Image from "next/image";
import Button from "@/components/Button";
import styles from "@/components/Hero.module.css";

export default function Hero({ heading, lede, photo }) {
  let backdrop = null;
  if (photo) {
    backdrop = (
      <div className={styles.media}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="100vw"
          quality={82}
          style={{ objectFit: "cover", objectPosition: "center 40%" }}
        />
        <div className={styles.scrim} aria-hidden="true" />
      </div>
    );
  }

  return (
    <section className={`${styles.hero} ${photo ? styles.hasPhoto : ""}`}>
      {backdrop}
      {photo ? null : <div className={styles.arc} aria-hidden="true" />}
      <div className={`container ${styles.inner}`}>
        <p className="eyebrow">Education access · Pakistan</p>
        <h1 className={styles.heading}>{heading}</h1>
        <p className={styles.lede}>{lede}</p>
        <div className={styles.cta}>
          <Button href="/donate" variant="primary">
            Donate now
          </Button>
          <Button href="/contact" variant="secondary" onDark={Boolean(photo)}>
            Join us as a volunteer
          </Button>
        </div>
        <p className={styles.note}>
          Donations go directly to our camps. <a href="/donate">See the account details</a> and ask
          us for a breakdown of any camp we have run.
        </p>
      </div>
    </section>
  );
}
