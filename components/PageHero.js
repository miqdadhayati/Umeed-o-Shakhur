import Image from "next/image";
import styles from "@/components/PageHero.module.css";

export default function PageHero({ eyebrow, title, intro, photo = null }) {
  let backdrop = null;
  if (photo) {
    backdrop = (
      <div className={styles.media}>
        <Image
          src={photo.src}
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
          quality={80}
          style={{ objectFit: "cover", objectPosition: "center 42%" }}
        />
        <div className={styles.scrim} aria-hidden="true" />
      </div>
    );
  }

  return (
    <section className={`${styles.hero} ${photo ? styles.hasPhoto : ""}`}>
      {backdrop}
      <div className={`container ${styles.inner}`}>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className={styles.title}>{title}</h1>
        {intro ? <p className={styles.intro}>{intro}</p> : null}
      </div>
    </section>
  );
}
