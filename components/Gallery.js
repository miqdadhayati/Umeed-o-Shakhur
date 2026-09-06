import Image from "next/image";
import styles from "@/components/Gallery.module.css";

/**
 * An editorial photo grid. The first photo runs wide and tall; the rest fill
 * in around it, so a set of ordinary documentary shots reads as a composed
 * layout rather than a uniform contact sheet.
 *
 * Alt text comes from the manifest — each photo describes itself.
 */
export default function Gallery({ photos = [] }) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <div className={styles.grid}>
      {photos.map((photo, index) => (
        <figure
          key={photo.name}
          className={`${styles.item} ${index === 0 ? styles.feature : ""}`}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes={
              index === 0
                ? "(max-width: 760px) 100vw, 58vw"
                : "(max-width: 760px) 50vw, 28vw"
            }
            style={{ objectFit: "cover" }}
          />
        </figure>
      ))}
    </div>
  );
}
