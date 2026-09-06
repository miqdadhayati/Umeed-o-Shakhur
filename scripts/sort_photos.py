"""
Classify the NGO's camp photos with Claude vision, then rename and web-optimise
them into public/images.

Each image is sent to Claude as a small probe (downscaled, ~1024px) purely to
decide a category; the file that lands in public/images is a separately-encoded
web version of the original, not the probe.

Usage:
    python scripts/sort_photos.py --dry-run     # classify + report, write nothing
    python scripts/sort_photos.py               # classify, convert, write
    python scripts/sort_photos.py --subfolders  # mirror categories as directories

Requires ANTHROPIC_API_KEY in the environment. Re-running is safe: sources
already recorded in the manifest are skipped and numbering continues from there.
"""

import argparse
import base64
import io
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor

import anthropic
from PIL import Image, ImageOps

# HEIC comes off iPhones and is readable by neither the API nor a browser,
# so every HEIC has to be decoded here and re-encoded as JPEG.
try:
    from pillow_heif import register_heif_opener

    register_heif_opener()
    HEIF_OK = True
except ImportError:  # pragma: no cover - dependency is in the install line
    HEIF_OK = False

MODEL = "claude-opus-5"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DEFAULT_SOURCE = os.path.join(PROJECT_ROOT, "raw")
DEFAULT_DEST = os.path.join(PROJECT_ROOT, "public", "images")
MANIFEST = os.path.join(PROJECT_ROOT, "public", "images", "gallery-manifest.json")
DEFAULT_CLASSIFICATIONS = os.path.join(SCRIPT_DIR, "classifications.json")

READABLE = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif", ".tif", ".tiff", ".bmp"}

# The category the model returns -> the filename prefix on disk.
PREFIXES = {"classroom": "classroom", "team": "teampic", "fieldwork": "fieldwork"}

PROBE_MAX_EDGE = 1024   # what Claude sees — small keeps image tokens down
WEB_MAX_EDGE = 2000     # what ships to the browser
WEB_QUALITY = 82

SYSTEM = """\
You are sorting photographs taken at education camps run by Umeed o Shakhur, a \
non-profit working in northern Pakistan. Each photo goes into exactly one of \
three buckets, chosen by what the photo primarily shows:

- "classroom": teaching or learning in progress — participants seated and \
working, someone instructing, a board or teaching materials in use, a workshop \
or study session. Indoors or outdoors, as long as the subject is instruction.
- "team": a posed or semi-posed group portrait — people arranged and facing the \
camera, standing or seated together for the photo rather than doing an activity.
- "fieldwork": activity outside a teaching or portrait setting — travel, \
outdoor and community activity, sports and games, distribution of supplies, \
site and landscape shots of the camp.

Pick the single best fit. If a photo could read as two, favour what occupies \
most of the frame.

Also write short alt text describing only what is visibly in the photograph. \
Do not name people, places, dates, or events, and do not guess at them — you \
have no way to know these, and the alt text will be published on a live website."""

SCHEMA = {
    "type": "object",
    "properties": {
        "category": {"type": "string", "enum": ["classroom", "team", "fieldwork"]},
        "alt": {
            "type": "string",
            "description": "One sentence describing what is visible. No names, places, or dates.",
        },
        "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
    },
    "required": ["category", "alt", "confidence"],
    "additionalProperties": False,
}


def load_image(path):
    """Decode any supported format, honouring EXIF rotation."""
    image = Image.open(path)
    image = ImageOps.exif_transpose(image)
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    return image


def encode_jpeg(image, max_edge, quality):
    """Downscale to fit max_edge and return JPEG bytes (metadata dropped)."""
    resized = image.copy()
    resized.thumbnail((max_edge, max_edge), Image.LANCZOS)
    buffer = io.BytesIO()
    resized.convert("RGB").save(buffer, "JPEG", quality=quality, optimize=True)
    return buffer.getvalue()


def classify(client, image, label):
    probe = encode_jpeg(image, PROBE_MAX_EDGE, 80)
    response = client.messages.create(
        model=MODEL,
        max_tokens=1000,
        system=SYSTEM,
        output_config={
            "format": {"type": "json_schema", "schema": SCHEMA},
            "effort": "low",
        },
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": base64.standard_b64encode(probe).decode(),
                        },
                    },
                    {"type": "text", "text": "Classify this photograph."},
                ],
            }
        ],
    )

    if response.stop_reason == "refusal":
        raise RuntimeError(f"{label}: model declined to classify this image")

    text = next(b.text for b in response.content if b.type == "text")
    return json.loads(text)


def find_sources(root):
    found = []
    for directory, _, filenames in os.walk(root):
        for filename in sorted(filenames):
            if os.path.splitext(filename)[1].lower() in READABLE:
                found.append(os.path.join(directory, filename))
    return sorted(found)


def read_manifest():
    if not os.path.exists(MANIFEST):
        return []
    with open(MANIFEST, encoding="utf-8") as handle:
        return json.load(handle).get("photos", [])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default=DEFAULT_SOURCE)
    parser.add_argument("--dest", default=DEFAULT_DEST)
    parser.add_argument("--dry-run", action="store_true", help="classify only, write nothing")
    parser.add_argument(
        "--subfolders",
        action="store_true",
        help="write into public/images/<category>/ instead of flat",
    )
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument(
        "--from-file",
        nargs="?",
        const=DEFAULT_CLASSIFICATIONS,
        metavar="PATH",
        help="Read categories from a JSON file instead of calling the API "
        f"(defaults to {os.path.basename(DEFAULT_CLASSIFICATIONS)})",
    )
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")

    if not os.path.isdir(args.source):
        sys.exit(f"Source folder not found: {args.source}")

    if not args.from_file and not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit(
            "\nANTHROPIC_API_KEY is not set.\n"
            "Create a key at https://console.anthropic.com/settings/keys, then:\n"
            '  PowerShell:  $env:ANTHROPIC_API_KEY = "sk-ant-..."\n'
            '  bash:        export ANTHROPIC_API_KEY="sk-ant-..."\n'
        )

    sources = find_sources(args.source)
    if not sources:
        sys.exit(f"No images found under {args.source}")

    heics = [s for s in sources if os.path.splitext(s)[1].lower() in (".heic", ".heif")]
    if heics and not HEIF_OK:
        sys.exit(
            f"{len(heics)} HEIC file(s) found but pillow-heif is not installed.\n"
            "Run: pip install pillow-heif"
        )

    existing = read_manifest()
    done = {entry["source"] for entry in existing}
    pending = [s for s in sources if os.path.relpath(s, PROJECT_ROOT) not in done]

    print(f"\nSource : {args.source}")
    print(f"Target : {args.dest}")
    print(f"Found  : {len(sources)} image(s); {len(pending)} to process, "
          f"{len(sources) - len(pending)} already in the manifest\n")

    if not pending:
        print("Nothing to do.")
        return

    lookup = None
    client = None
    if args.from_file:
        with open(args.from_file, encoding="utf-8") as handle:
            lookup = {
                key.replace("\\", "/"): value
                for key, value in json.load(handle).items()
                if not key.startswith("_")
            }
        print(f"Using categories from {os.path.relpath(args.from_file, PROJECT_ROOT)} "
              "(no API calls)\n")
    else:
        client = anthropic.Anthropic()

    def process(path):
        label = os.path.relpath(path, args.source).replace("\\", "/")
        try:
            image = load_image(path)
            if lookup is None:
                result = classify(client, image, label)
            else:
                result = lookup.get(label)
                if result is None:
                    raise KeyError("no entry in the classifications file")
            return path, image, result, None
        except Exception as error:  # keep one bad file from killing the batch
            return path, None, None, error

    results = []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for path, image, result, error in pool.map(process, pending):
            label = os.path.relpath(path, args.source)
            if error:
                print(f"  FAILED     {label}: {error}")
                results.append((path, None, None))
                continue
            print(f"  {result['category']:<10} {label}  ({result['confidence']} confidence)")
            results.append((path, image, result))

    # Number per category, continuing past anything already written.
    counters = {}
    for entry in existing:
        prefix = PREFIXES[entry["category"]]
        counters[prefix] = max(counters.get(prefix, 0), entry["index"])

    written = []
    for path, image, result in results:
        if result is None:
            continue
        category = result["category"]
        prefix = PREFIXES[category]
        counters[prefix] = counters.get(prefix, 0) + 1
        index = counters[prefix]
        filename = f"{prefix}-{index:02d}.jpg"

        directory = os.path.join(args.dest, category) if args.subfolders else args.dest
        target = os.path.join(directory, filename)

        # The camp folder name is the only provenance we have; keep it so the
        # photos can be attributed per camp on the site later.
        camp = os.path.relpath(os.path.dirname(path), args.source).replace("\\", "/")
        written.append(
            {
                "file": os.path.relpath(target, os.path.join(PROJECT_ROOT, "public")).replace("\\", "/"),
                "category": category,
                "index": index,
                "alt": result["alt"],
                "confidence": result["confidence"],
                "camp": camp if camp != "." else None,
                "source": os.path.relpath(path, PROJECT_ROOT).replace("\\", "/"),
            }
        )

        if args.dry_run:
            continue

        os.makedirs(directory, exist_ok=True)
        web = encode_jpeg(image, WEB_MAX_EDGE, WEB_QUALITY)
        with open(target, "wb") as handle:
            handle.write(web)
        before = os.path.getsize(path) / 1024
        print(f"    wrote {filename}  ({before:,.0f} KB -> {len(web) / 1024:,.0f} KB)")

    if not args.dry_run and written:
        os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)
        with open(MANIFEST, "w", encoding="utf-8") as handle:
            json.dump({"photos": existing + written}, handle, indent=2, ensure_ascii=False)
        print(f"\nManifest: {os.path.relpath(MANIFEST, PROJECT_ROOT)}")

    tally = {}
    for entry in written:
        tally[entry["category"]] = tally.get(entry["category"], 0) + 1
    failed = sum(1 for _, _, r in results if r is None)

    print("\n" + ("Dry run - nothing written." if args.dry_run else "Done."))
    print("  " + ", ".join(f"{v} {k}" for k, v in sorted(tally.items())) if tally else "  none")
    if failed:
        print(f"  {failed} failed")


if __name__ == "__main__":
    main()
