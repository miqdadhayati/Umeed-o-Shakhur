// Central site configuration.
//
// Anything left as an empty string is HIDDEN in the UI rather than rendered
// blank or filled with a placeholder. That is deliberate: this site asks the
// public for money, so it must never display a detail that is not verified.
// Fill a value in and it appears everywhere it belongs; leave it empty and
// nothing fake ships.

export const site = {
  name: "Umeed o Shakhur",
  tagline: "Hope, taught forward.",
  description:
    "Umeed o Shakhur is a Pakistan-based non-profit running education and mentorship camps for young people in under-served communities.",

  // Netlify sets URL to the site's primary address at build time, so canonical
  // tags, the sitemap and robots.txt are correct on the netlify.app subdomain
  // and again after a custom domain is attached — with no code change. The
  // literal is only a local-development fallback.
  // (Used exclusively in server-rendered metadata, so there is no hydration risk.)
  url: process.env.URL || "https://umeedoshakhur.org",

  // TODO: replace with the addresses and numbers the NGO actually monitors.
  // Until then these stay empty and the contact blocks omit them.
  email: "",
  phone: "",
  address: "",

  // TODO: only fill this in once the society/trust registration is complete,
  // and use the exact number from the certificate. Publishing an unverified
  // registration number is a legal risk, not a presentational one.
  registration: "",

  // TODO: replace with the NGO's real profile URLs. Empty entries are skipped.
  social: [
    { label: "Instagram", href: "" },
    { label: "Facebook", href: "" },
    { label: "LinkedIn", href: "" }
  ]
};

/** Social entries that actually point somewhere. */
export const activeSocial = site.social.filter((item) => item.href);

export const primaryNav = [
  { label: "About", href: "/about" },
  { label: "Programs", href: "/programs" },
  { label: "Stories", href: "/blog" },
  { label: "Contact", href: "/contact" }
];

// Verified against the account details supplied by the NGO on 2026-09-06.
// SWIFT/BIC is intentionally absent: it was not supplied, and guessing a
// routing code is how international transfers end up misdirected. Add it only
// from the bank's own documentation, alongside a branch address.
export const bankDetails = {
  bankName: "Meezan Bank",
  accountTitle: "EHTISHAM ALI KHAN",
  accountNumber: "00300111093848",
  iban: "PK47MEZN0000300111093848",
  branch: "MEEZAN DIGITAL CENTRE",
  swift: ""
};
