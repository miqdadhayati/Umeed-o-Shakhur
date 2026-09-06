import Link from "next/link";
import Logo from "@/components/Logo";
import { site, primaryNav, activeSocial } from "@/lib/site";
import styles from "@/components/Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandCol}>
          <Logo />
          <p className={styles.mission}>{site.description}</p>
          {site.registration ? <p className={styles.reg}>{site.registration}</p> : null}
        </div>

        <nav className={styles.col} aria-label="Footer">
          <h4 className={styles.heading}>Explore</h4>
          <ul>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/donate">Donate</Link>
            </li>
            <li>
              <Link href="/lms/login">Student Portal</Link>
            </li>
          </ul>
        </nav>

        <div className={styles.col}>
          <h4 className={styles.heading}>Reach us</h4>
          <ul>
            {site.email ? (
              <li>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
            ) : null}
            {site.phone ? (
              <li>
                <a href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a>
              </li>
            ) : null}
            {site.address ? <li className={styles.address}>{site.address}</li> : null}
            {!site.email && !site.phone && !site.address ? (
              <li>
                <Link href="/contact">Send us a message</Link>
              </li>
            ) : null}
          </ul>
        </div>

        {activeSocial.length > 0 ? (
          <div className={styles.col}>
            <h4 className={styles.heading}>Follow</h4>
            <ul>
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
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>
          &copy; {year} {site.name}. All rights reserved.
        </span>
        <span>Built for learners, funded by hope.</span>
      </div>
    </footer>
  );
}
