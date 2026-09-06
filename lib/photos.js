import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Reads the gallery manifest written by scripts/sort_photos.py.
 *
 * Every entry carries alt text describing only what is visible in the frame,
 * so photos can be placed anywhere on the site without a component having to
 * invent a caption for them.
 */

const manifestFile = path.join(process.cwd(), "public", "images", "gallery-manifest.json");

let cache = null;

function readManifest() {
  if (cache) {
    return cache;
  }

  if (!fs.existsSync(manifestFile)) {
    cache = [];
    return cache;
  }

  const parsed = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  cache = (parsed.photos || []).map((photo) => ({
    ...photo,
    src: `/${photo.file}`,
    name: photo.file.split("/").pop().replace(/\.jpg$/, "")
  }));

  return cache;
}

/** Every photo, optionally narrowed to one category. */
export function getPhotos(category) {
  const photos = readManifest();
  if (!category) {
    return photos;
  }
  return photos.filter((photo) => photo.category === category);
}

/**
 * Look up specific photos by name ("teampic-02"), preserving the order asked
 * for. Names that aren't in the manifest are dropped rather than rendered as a
 * broken image, so a mistyped name degrades to a smaller grid.
 */
export function pickPhotos(...names) {
  const byName = new Map(readManifest().map((photo) => [photo.name, photo]));
  return names.map((name) => byName.get(name)).filter(Boolean);
}

/** A single photo by name, or null. */
export function getPhoto(name) {
  return pickPhotos(name)[0] || null;
}
