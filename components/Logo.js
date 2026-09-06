export default function Logo({ size = 34, showText = true }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.6rem",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: "1.15rem",
        letterSpacing: "-0.02em",
        color: "var(--ink)"
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        role="img"
        aria-label="Umeed o Shakhur"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="20" fill="var(--indigo)" />
        <path d="M8 26a12 12 0 0 1 24 0Z" fill="var(--marigold)" />
        <line x1="6" y1="29.5" x2="34" y2="29.5" stroke="var(--paper)" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="20" y1="6" x2="20" y2="9.5" stroke="var(--marigold)" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="11" y1="9" x2="13" y2="11.5" stroke="var(--marigold)" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="29" y1="9" x2="27" y2="11.5" stroke="var(--marigold)" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      {showText ? <span>Umeed o Shakhur</span> : null}
    </span>
  );
}
