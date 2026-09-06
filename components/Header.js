"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import { primaryNav } from "@/lib/site";
import styles from "@/components/Header.module.css";

export default function Header() {
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  function toggleMenu() {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }

  let panelClass = styles.nav;
  if (open) {
    panelClass = `${styles.nav} ${styles.navOpen}`;
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link href="/" className={styles.brand} onClick={closeMenu} aria-label="Umeed o Shakhur home">
          <Logo />
        </Link>

        <button
          className={styles.burger}
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={toggleMenu}
        >
          <span className="sr-only">Toggle menu</span>
          <span className={styles.burgerLine} aria-hidden="true" />
          <span className={styles.burgerLine} aria-hidden="true" />
          <span className={styles.burgerLine} aria-hidden="true" />
        </button>

        <nav className={panelClass} id="primary-navigation" aria-label="Primary">
          <ul className={styles.links}>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={closeMenu}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <Link href="/lms/login" className={styles.portal} onClick={closeMenu}>
              Student Portal
            </Link>
            <Button href="/donate" variant="primary" onClick={closeMenu}>
              Donate
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
