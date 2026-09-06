import styles from "@/components/ImpactMetrics.module.css";

export default function ImpactMetrics({ stats }) {
  return (
    <section className={styles.band} aria-label="Our impact in numbers">
      <div className={`container ${styles.inner}`}>
        <div className={styles.intro}>
          <p className="eyebrow">By the numbers</p>
          <h2 className={styles.title}>Proof, not promises.</h2>
        </div>
        <dl className={styles.grid}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <dt className={styles.value}>{stat.value}</dt>
              <dd className={styles.label}>{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
