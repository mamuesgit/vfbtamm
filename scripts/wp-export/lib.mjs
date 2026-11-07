// Gemeinsame Hilfsfunktionen für die WordPress-Migration.

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import sharp from 'sharp';

export const ROOT = new URL('../../', import.meta.url);
export const CACHE = new URL('migration/cache/', ROOT);
const ORIGINALS = new URL('migration/cache/originals/', ROOT);
const OUT_UPLOADS = new URL('public/uploads/', ROOT);
// Der Webhoster blockiert Anfragen ohne Browser-ähnliche Kennung.
export const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; vfbtamm-migration)' };
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 80;

export const readJson = async (name) => JSON.parse(await readFile(new URL(name, CACHE), 'utf8'));
export const exists = (url) => access(url).then(() => true, () => false);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Pfad unter /uploads/ für eine WordPress-URL, z. B. 2026/11/image0.webp */
export function zielpfad(url, ext) {
  const u = new URL(url);
  let path = u.pathname.replace(/^\/wp-content\/uploads\//, '').replace(/^\/+/, '');
  if (path === u.pathname.replace(/^\/+/, '')) path = 'sonstige/' + path.split('/').pop();
  path = decodeURIComponent(path).toLowerCase().replace(/[^a-z0-9/._-]+/g, '-');
  return ext ? path.replace(/\.[^./]+$/, ext) : path;
}

async function download(url) {
  const cacheFile = new URL(zielpfad(url), ORIGINALS);
  if (await exists(cacheFile)) return readFile(cacheFile);
  const res = await fetch(url.replace(/^http:/, 'https:'), { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(cacheFile.pathname), { recursive: true });
  await writeFile(cacheFile, buf);
  await sleep(200);
  return buf;
}

/**
 * Lädt ein Bild (Original), verkleinert es auf max. 1600 px Breite, speichert es als WebP
 * unter public/uploads/ und liefert den öffentlichen Pfad. Wirft bei Fehlern.
 */
export async function bildUebernehmen(url) {
  const rel = zielpfad(url, '.webp');
  const ziel = new URL(rel, OUT_UPLOADS);
  if (!(await exists(ziel))) {
    const buf = await download(url);
    await mkdir(dirname(ziel.pathname), { recursive: true });
    await sharp(buf, { animated: false })
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(ziel.pathname);
  }
  return '/uploads/' + rel;
}

/** Lädt eine verlinkte Datei (z. B. PDF) unverändert nach public/uploads/. Wirft bei Fehlern. */
export async function dateiUebernehmen(url) {
  const rel = zielpfad(url);
  const ziel = new URL(rel, OUT_UPLOADS);
  if (!(await exists(ziel))) {
    const buf = await download(url);
    await mkdir(dirname(ziel.pathname), { recursive: true });
    await writeFile(ziel, buf);
  }
  return '/uploads/' + rel;
}
