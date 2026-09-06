# Deploying to Netlify

The repository is initialised and committed locally. Nothing has been pushed
anywhere — the remaining steps need your accounts, so they have to be yours.

Use **Path A**. Path B is a fallback if you want something online in five
minutes without creating a GitHub repo.

---

## Path A — GitHub → Netlify (recommended)

Every push redeploys automatically, and it is the only path where the `/admin`
content editor can work (Decap CMS commits through GitHub).

### 1. Create the GitHub repository

Go to [github.com/new](https://github.com/new). Name it `umeed-o-shakhur`.
Choose **Private** unless you want the code public. **Do not** tick "Add a
README", "Add .gitignore", or "Choose a license" — the repo already has them
and those options will cause a conflict on first push.

### 2. Push

Copy the two lines GitHub shows you, or run these (replace `YOUR-USERNAME`):

```bash
git remote add origin https://github.com/YOUR-USERNAME/umeed-o-shakhur.git
git push -u origin main
```

If it asks for a password, use a
[personal access token](https://github.com/settings/tokens), not your account
password — GitHub stopped accepting passwords over HTTPS.

### 3. Connect Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an
   existing project** → **GitHub** → authorise → pick the repo.
2. Leave the build settings alone. `netlify.toml` already sets the build
   command, the publish directory, and the Next.js runtime plugin.
3. **Deploy site.**

First build takes 2–4 minutes. You get a URL like
`random-name-123.netlify.app`.

### 4. Turn on the contact form

Site configuration → **Forms** → enable form detection, then **trigger one more
deploy** (Deploys → Trigger deploy → Deploy site). Netlify only scans for forms
at build time, and `public/__forms.html` is what it looks for.

Test it by submitting the contact form. Submissions land in the **Forms** tab.
Add your email under Forms → **Form notifications** or nobody will know a
message arrived.

### 5. Custom domain (when you have one)

Domain management → **Add a domain**. Netlify walks you through the DNS records
and issues an HTTPS certificate automatically. Canonical URLs, `robots.txt` and
the sitemap pick the new domain up on the next deploy with no code change.

---

## Path B — Netlify CLI (no GitHub)

Faster, but you redeploy by hand every time and `/admin` will not work.

```bash
netlify login          # opens a browser
netlify init           # create a new site, follow the prompts
netlify deploy --prod  # builds and publishes
```

You can move to Path A later without losing the site.

---

## Before you announce the link

The site is honest as it stands, but four things are missing rather than wrong.
None of them block a deploy.

| What | Where | Why it matters |
| --- | --- | --- |
| Contact email, phone, office | `lib/site.js` | Currently blank, so those blocks are hidden and the footer just links to the contact form. Donors generally want a human to reach. |
| Social profile URLs | `lib/site.js` | The "Follow" column is hidden entirely while these are empty. |
| Charity registration number | `lib/site.js` | Only add this once registration is complete, using the exact number from the certificate. The old fabricated one has been removed. |
| CMS repository | `public/admin/config.yml` | Set `repo:` to `YOUR-USERNAME/umeed-o-shakhur` and configure GitHub OAuth in Netlify (Site configuration → Access & security → OAuth) or `/admin` cannot sign in. |

Fill any of these in, commit, push — Netlify redeploys on its own.

## The student portal

`/lms` is built but inert until Supabase is connected. Signed-out visitors see
a "not connected yet" notice rather than an error, so it is safe to deploy as
is. When you come back to it, follow [`LMS-SETUP.md`](LMS-SETUP.md) and add the
six environment variables under Site configuration → **Environment variables**.

## Everyday updates

```bash
git add -A
git commit -m "Describe the change"
git push
```

Netlify redeploys within a couple of minutes. Watch progress in the **Deploys**
tab; if a build fails the log names the file and line.
