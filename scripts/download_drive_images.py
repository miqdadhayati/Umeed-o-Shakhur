"""
Download every image from a Google Drive folder (recursively) into public/raw_images.

Usage:
    python scripts/download_drive_images.py
    python scripts/download_drive_images.py --folder <drive-folder-url-or-id>
    python scripts/download_drive_images.py --flat        # ignore subfolders, dump everything together

Requires a Google Cloud OAuth client file at scripts/credentials.json.
See scripts/README-drive.md for how to create it.

On first run a browser opens for consent; the resulting token is cached in
scripts/token.json so later runs are non-interactive.
"""

import argparse
import io
import os
import re
import sys

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload

# Read-only is all we need; Drive is never modified by this script.
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

DEFAULT_FOLDER = "https://drive.google.com/drive/folders/1Xni__5GNBOyTT7uiu3gF-1kAQ_Izsmpu"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CREDENTIALS_FILE = os.path.join(SCRIPT_DIR, "credentials.json")
TOKEN_FILE = os.path.join(SCRIPT_DIR, "token.json")
DEST_ROOT = os.path.join(PROJECT_ROOT, "public", "raw_images")

FOLDER_MIME = "application/vnd.google-apps.folder"

# Google Docs-native types can't be downloaded directly; a Drive "drawing" is the
# only image-ish one, and we export it as PNG.
EXPORTABLE = {"application/vnd.google-apps.drawing": ("image/png", ".png")}

MIME_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/tiff": ".tif",
    "image/bmp": ".bmp",
    "image/svg+xml": ".svg",
}


def extract_folder_id(value):
    """Accept a full Drive URL or a bare folder ID."""
    match = re.search(r"/folders/([a-zA-Z0-9_-]+)", value)
    if match:
        return match.group(1)
    match = re.search(r"[?&]id=([a-zA-Z0-9_-]+)", value)
    if match:
        return match.group(1)
    return value.strip()


def authenticate():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                sys.exit(
                    f"\nMissing OAuth client file: {CREDENTIALS_FILE}\n"
                    "Create it in Google Cloud Console (APIs & Services -> Credentials ->\n"
                    "Create credentials -> OAuth client ID -> Desktop app), download the JSON,\n"
                    "and save it at the path above as credentials.json.\n"
                    "Full walkthrough: scripts/README-drive.md\n"
                )
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, "w", encoding="utf-8") as handle:
            handle.write(creds.to_json())

    return build("drive", "v3", credentials=creds)


def list_children(service, folder_id):
    """Return every non-trashed child of a folder, following pagination."""
    items = []
    page_token = None
    while True:
        response = (
            service.files()
            .list(
                q=f"'{folder_id}' in parents and trashed = false",
                fields="nextPageToken, files(id, name, mimeType, size)",
                pageSize=1000,
                pageToken=page_token,
                orderBy="name",
                # Needed if the folder ever lives in a Shared Drive.
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
            )
            .execute()
        )
        items.extend(response.get("files", []))
        page_token = response.get("nextPageToken")
        if not page_token:
            return items


def slug(text, fallback):
    text = text.strip().replace(" ", "-")
    text = re.sub(r"[^A-Za-z0-9._-]", "", text)
    return re.sub(r"-+", "-", text).strip("-.") or fallback


def safe_name(name):
    """Filesystem- and URL-friendly filename, extension preserved separately.

    Splitting first means a fully non-Latin stem (Urdu/Arabic photo names are
    likely here) falls back to a placeholder without eating the extension.
    """
    stem, ext = os.path.splitext(name)
    ext = slug(ext.lstrip("."), "")
    return slug(stem, "image") + (f".{ext}" if ext else "")


def unique_path(directory, filename):
    """Avoid clobbering same-named files coming from different Drive folders."""
    base, ext = os.path.splitext(filename)
    candidate = os.path.join(directory, filename)
    counter = 2
    while os.path.exists(candidate):
        candidate = os.path.join(directory, f"{base}-{counter}{ext}")
        counter += 1
    return candidate


def download(service, file_meta, directory):
    file_id = file_meta["id"]
    mime = file_meta["mimeType"]

    name = safe_name(file_meta["name"])
    export_mime = None
    if mime in EXPORTABLE:
        export_mime, forced_ext = EXPORTABLE[mime]
        name = os.path.splitext(name)[0] + forced_ext
    elif not os.path.splitext(name)[1]:
        name += MIME_EXTENSIONS.get(mime, "")

    # Already pulled in a previous run (exact name match) -> skip.
    target = os.path.join(directory, name)
    if os.path.exists(target):
        print(f"    skip (exists)  {name}")
        return "skipped"

    target = unique_path(directory, name)

    if export_mime:
        request = service.files().export_media(fileId=file_id, mimeType=export_mime)
    else:
        request = service.files().get_media(fileId=file_id, supportsAllDrives=True)

    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request, chunksize=5 * 1024 * 1024)
    done = False
    try:
        while not done:
            _, done = downloader.next_chunk()
    except HttpError as error:
        print(f"    FAILED         {file_meta['name']}: {error}")
        return "failed"

    with open(target, "wb") as handle:
        handle.write(buffer.getvalue())

    kb = len(buffer.getvalue()) / 1024
    print(f"    saved          {os.path.basename(target)}  ({kb:,.0f} KB)")
    return "downloaded"


def walk(service, folder_id, directory, flat, stats, depth=0):
    os.makedirs(directory, exist_ok=True)
    indent = "  " * depth

    children = list_children(service, folder_id)
    folders = [c for c in children if c["mimeType"] == FOLDER_MIME]
    images = [
        c
        for c in children
        if c["mimeType"].startswith("image/") or c["mimeType"] in EXPORTABLE
    ]
    others = len(children) - len(folders) - len(images)

    print(f"{indent}{len(images)} image(s), {len(folders)} subfolder(s)"
          + (f", {others} other file(s) ignored" if others else ""))

    for image in images:
        stats[download(service, image, directory)] += 1

    for folder in folders:
        print(f"{indent}-> {folder['name']}/")
        sub_dir = directory if flat else os.path.join(directory, safe_name(folder["name"]))
        walk(service, folder["id"], sub_dir, flat, stats, depth + 1)


def main():
    # Drive names may contain Urdu/emoji; a legacy cp1252 console would raise
    # UnicodeEncodeError mid-download without this.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--folder", default=DEFAULT_FOLDER, help="Drive folder URL or ID")
    parser.add_argument("--dest", default=DEST_ROOT, help="Destination directory")
    parser.add_argument(
        "--flat",
        action="store_true",
        help="Put every image in one directory instead of mirroring Drive subfolders",
    )
    args = parser.parse_args()

    folder_id = extract_folder_id(args.folder)
    service = authenticate()

    try:
        root = (
            service.files()
            .get(fileId=folder_id, fields="id, name, mimeType", supportsAllDrives=True)
            .execute()
        )
    except HttpError as error:
        sys.exit(
            f"\nCould not open folder {folder_id}: {error}\n"
            "Check that the Drive API is enabled and that the Google account you "
            "consented with can see this folder.\n"
        )

    if root["mimeType"] != FOLDER_MIME:
        sys.exit(f"{root['name']} is not a folder.")

    print(f"\nSource : {root['name']} ({folder_id})")
    print(f"Target : {args.dest}\n")

    stats = {"downloaded": 0, "skipped": 0, "failed": 0}
    walk(service, folder_id, args.dest, args.flat, stats)

    print(
        f"\nDone. {stats['downloaded']} downloaded, "
        f"{stats['skipped']} already present, {stats['failed']} failed."
    )


if __name__ == "__main__":
    main()
