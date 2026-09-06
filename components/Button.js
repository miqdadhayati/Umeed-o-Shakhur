import Link from "next/link";
import styles from "@/components/Button.module.css";

export default function Button({
  href,
  children,
  variant = "primary",
  external = false,
  onDark = false,
  ...rest
}) {
  let className = styles.button;
  if (variant === "primary") {
    className = `${styles.button} ${styles.primary}`;
  } else if (variant === "secondary") {
    className = `${styles.button} ${styles.secondary}`;
  } else if (variant === "ghost") {
    className = `${styles.button} ${styles.ghost}`;
  }

  // Secondary and ghost both rely on the page background for contrast, so they
  // need an explicit light treatment when they sit on a photo or dark band.
  if (onDark) {
    className = `${className} ${styles.onDark}`;
  }

  if (external) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href} {...rest}>
      {children}
    </Link>
  );
}
