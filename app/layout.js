import "@/app/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { site } from "@/lib/site";

export const metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s — ${site.name}`
  },
  description: site.description,
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: "en_PK",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description
  }
};

export const viewport = {
  themeColor: "#15183a"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <a href="#main" className="sr-only">
          Skip to content
        </a>
        <Header />
        <main id="main" style={{ flex: "1 0 auto" }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
