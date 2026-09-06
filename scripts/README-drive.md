# Getting `credentials.json` for the Drive image downloader

One-time setup, ~5 minutes. Do it with the Google account that can see the NGO's
Drive folder.

## 1. Create a Google Cloud project

Go to <https://console.cloud.google.com/>. Top-left project dropdown ->
**New Project**. Name it anything (e.g. `umeed-o-shakhur-media`) -> **Create**,
then make sure it's the selected project.

## 2. Enable the Google Drive API

**APIs & Services -> Library** -> search "Google Drive API" -> **Enable**.
(Direct link: <https://console.cloud.google.com/apis/library/drive.googleapis.com>)

## 3. Configure the OAuth consent screen

**APIs & Services -> OAuth consent screen**.

- User type: **External** (unless you have a Google Workspace org, then Internal
  is simpler — it skips the test-user step).
- App name, user support email, developer contact email: fill in, everything
  else can stay blank.
- Scopes: you can skip this page; the script requests its scope at runtime.
- **Test users**: add your own Gmail address. This matters — an External app in
  "Testing" mode only lets listed test users sign in. You do **not** need to
  publish or submit for verification.

## 4. Create the OAuth client

**APIs & Services -> Credentials -> Create credentials -> OAuth client ID**.

- Application type: **Desktop app**
- Name: anything
- **Create** -> **Download JSON**

Rename the downloaded file to `credentials.json` and put it here:

```
Umeed-o-shakhur/scripts/credentials.json
```

## 5. Run it

```bash
python scripts/download_drive_images.py
```

A browser window opens asking you to sign in and grant read-only Drive access.
Google will show an "unverified app" warning — that's expected for a personal
Desktop client. Click **Advanced -> Go to <app name> (unsafe)** and continue.

After consent the script caches a token in `scripts/token.json`, so subsequent
runs don't prompt.

## Notes

- Both `credentials.json` and `token.json` are secrets and are gitignored.
  Never commit them.
- The script requests `drive.readonly` only — it cannot modify or delete
  anything in Drive.
- Re-running is safe: files already present in `public/raw_images` are skipped.

## Options

```bash
# a different folder
python scripts/download_drive_images.py --folder <url-or-id>

# dump everything into one directory instead of mirroring the camp subfolders
python scripts/download_drive_images.py --flat

# somewhere other than public/raw_images
python scripts/download_drive_images.py --dest ./somewhere-else
```
