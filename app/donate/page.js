import PageHero from "@/components/PageHero";
import CTASection from "@/components/CTASection";
import { bankDetails } from "@/lib/site";
import { getPhoto } from "@/lib/photos";
import styles from "@/app/donate/donate.module.css";

export const metadata = {
  title: "Donate",
  description:
    "Support Umeed o Shakhur with a direct bank transfer. Transparent details, clear instructions, and a breakdown of what your gift funds.",
};

const rows = [
  { label: "Bank", value: bankDetails.bankName },
  { label: "Account title", value: bankDetails.accountTitle },
  { label: "Account number", value: bankDetails.accountNumber },
  { label: "IBAN", value: bankDetails.iban },
  { label: "Branch", value: bankDetails.branch },
  { label: "SWIFT / BIC", value: bankDetails.swift },
].filter((row) => row.value);

export default function DonatePage() {
  return (
    <>
      <PageHero
        eyebrow="Donate"
        title="Give once, or give monthly — straight to the account below."
        intro="We accept direct bank transfers. Online card and wallet payments are next on our roadmap; this page is built so they can be added without changing how you give."
        photo={getPhoto("classroom-16")}
      />

      <section className="section">
        <div className={`container ${styles.layout}`}>
          <div className={styles.transfer}>
            <p className="eyebrow">Bank transfer</p>
            <h2 className={styles.heading}>Our account details</h2>
            <p className={styles.note}>
              Transfer to the account below from any Pakistani bank or wallet. Send us your receipt
              through the contact form and we will confirm it.
            </p>

            <dl className={styles.details}>
              {rows.map((row) => (
                <div key={row.label} className={styles.row}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>

            <ol className={styles.steps}>
              <li>Make the transfer to the account shown above.</li>
              <li>Keep your transaction reference or screenshot.</li>
              <li>Send us the receipt via the contact form, noting if it is one-off or monthly.</li>
              <li>We confirm receipt and acknowledge your gift in writing.</li>
            </ol>
          </div>

          <aside className={styles.tiers}>
            <h3 className={styles.tiersTitle}>Where your gift goes</h3>
            <p className={styles.gateway}>
              Donations fund our mentorship camps: the sessions themselves, learning materials,
              travel for our volunteer teachers, and the costs of hosting students on site.
            </p>
            <p className={styles.gateway}>
              We are a young organisation and would rather tell you what we actually spent than
              promise a fixed figure per child. Ask us for a breakdown of any camp and we will
              send it.
            </p>
            <p className={styles.gateway}>
              Card &amp; wallet payments coming soon. We are integrating a payment gateway so you can
              give in a few taps — bank transfer will always remain available.
            </p>
          </aside>
        </div>
      </section>

      <CTASection
        title="Prefer to fund a whole program?"
        body="Organisations and individual sponsors can underwrite a specific program and receive direct reporting on its outcomes."
        primaryLabel="Talk to our team"
        primaryHref="/contact"
        secondaryLabel="See the programs"
        secondaryHref="/programs"
      />
    </>
  );
}
