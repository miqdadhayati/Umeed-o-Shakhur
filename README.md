# Umeed o Shakhur

A high-performance, responsive, free-to-host website for the education non-profit **Umeed o Shakhur**, built with **Next.js (App Router)** and a **Git-based headless CMS**. Content lives as markdown/JSON inside the repository, and publishing from the CMS commits to Git, which triggers an automatic static rebuild on Netlify. No server-hosted database is required, so hosting stays within the free tier.

The codebase is pre-engineered so a Learning Management System (LMS) can be dropped into the reserved `/lms` route segment in a later phase without disturbing the public static routes.

## Tech stack

- **Next.js 15** (App Router, React 19)
- **CSS Modules** + a small set of global design tokens (no heavy UI framework)
- **next/image** for automatic compression, WebP/AVIF, and lazy loading
- **gray-matter** + **marked** for reading markdown content at build time
- **Self-hosted fonts** via `@fontsource` (Bricolage Grotesque, Hanken Grotesk, IBM Plex Mono)
- **Sveltia CMS** (a drop-in Decap CMS replacement) for Git-based editing
- **Netlify** for hosting and CI/CD via the official Next.js runtime

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
```

Node 20 or newer is recommended.

## Project structure

```
app/                 App Router routes
  page.js            Home
  about/             About Us
  programs/          Programs & Missions
  blog/              Stories index + [slug] dynamic posts
  donate/            Bank transfer details
  contact/           Contact form + details
  lms/               Reserved for the future LMS (see below)
    layout.js        Isolation segment for auth-gated routes
    coming-soon/     Branded fallback the "Student Portal" nav links to
  sitemap.js         Dynamic sitemap
  icon.svg           Favicon
components/          Reusable UI (Header, Footer, Hero, cards, CTAs, form)
content/             CMS-managed content
  settings/home.json Hero copy + impact metrics
  programs/*.md      Program entries
  blog/*.md          Stories
lib/
  site.js            Site metadata, navigation, bank details
  content.js         Build-time content readers (server-only)
public/
  admin/             CMS (Sveltia) shell + config.yml
  images/            Program/story imagery and uploads
  __forms.html       Static stub so Netlify Forms detects the contact form
```

## Content management

Editors visit `/admin` on the deployed site. The CMS is configured in `public/admin/config.yml` with three collections: **Site Settings** (home hero + impact metrics), **Programs**, and **Stories**. Saving an entry commits the change to the Git repository, and Netlify rebuilds the site automatically.

### A note on authentication (important deviation)

The brief referenced Decap/Netlify CMS, which historically relied on **Netlify Identity + Git Gateway**. Both have been **deprecated** by Netlify and are no longer recommended for new projects. To keep the same Git-based workflow without depending on a deprecated service, this project ships **Sveltia CMS** — a drop-in replacement that reads the same `config.yml` and authenticates **directly against GitHub via OAuth**, with no Identity service in the middle. A commented Decap fallback is included in `public/admin/index.html`.

To enable editor login after deploying:

1. In **GitHub → Settings → Developer settings → OAuth Apps**, create an app. Set the callback URL to your Netlify OAuth endpoint.
2. In **Netlify → Site settings → Access control → OAuth**, install the **GitHub** provider using that app's Client ID and Secret. Netlify hosts the OAuth handshake for free.
3. Update `repo: your-org/umeed-o-shakhur` in `public/admin/config.yml` to your actual GitHub repository.

For editing locally without GitHub, uncomment `local_backend` in the config and run a proxy server alongside `npm run dev`.

## Deployment (Netlify + GitHub)

1. Push this repository to GitHub.
2. In Netlify, **Add new site → Import from Git** and select the repo.
3. Build command `npm run build` and publish directory `.next` are detected automatically; `netlify.toml` also pins them along with the Next.js runtime plugin and `NODE_VERSION`.
4. Deploy. Every push to `main` — including CMS commits — triggers a rebuild.

### Why not `output: export`?

A literal reading of "static site" suggests Next.js static export, but `output: export` **disables `next/image` optimization**, which the brief explicitly requires for NGO media. Instead the site deploys through the **`@netlify/plugin-nextjs` runtime** (free tier). Public pages are still statically generated, while `next/image` optimization and future incremental revalidation keep working. Netlify installs the plugin during the build, so it is referenced in `netlify.toml` rather than added as a local dependency.

### Contact form

App Router forms are rendered by React, so Netlify's build-time form scanner cannot see them. `public/__forms.html` is a static stub declaring the `contact` form's fields so Netlify registers the form; the live React form in `components/ContactForm.js` then posts to it (with a honeypot field for spam). Submissions appear in the Netlify **Forms** dashboard.

## Future LMS

The `/lms` segment is reserved and isolated by its own `app/lms/layout.js`, which documents where Supabase-backed authentication and the Admin/Teacher/Student dashboards will wrap in. Keeping these routes in a separate segment ensures the public marketing pages stay fully static even after a server-dependent LMS is added. The global navigation already includes a **Student Portal** button pointing at `/lms/coming-soon`; repointing it to the real dashboard later is a one-line change.

## Environment variables

See `.env.example`. None are required for the public site to build. Future phases (payment gateway, Supabase LMS) will add their own keys there.

## Configuration notes

- `next.config.mjs` — image formats (AVIF/WebP) and a remote pattern for Cloudinary, should media ever move off-repo.
- `netlify.toml` — build settings, Next.js plugin, caching, and security headers.
- `jsconfig.json` — the `@/*` import alias used throughout.
