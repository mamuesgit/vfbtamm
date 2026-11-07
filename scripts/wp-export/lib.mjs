// Gemeinsame Hilfsfunktionen für die WordPress-Migration.

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import sharp from 'sharp';
import TurndownService from 'turndown';

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

// ---------- Text ----------

export function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function cleanTitle(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

export function cleanSlug(slug) {
  return decodeURIComponent(slug)
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Dateiname (= ID) eines migrierten Beitrags: JJJJ-MM-TT-slug, bei Doppelungen mit WordPress-ID.
 * `vergeben` muss in derselben Reihenfolge wie posts.json gefüllt werden (convert-posts und redirects).
 */
export function beitragsDateiname(post, vergeben) {
  let name = `${post.date.slice(0, 10)}-${cleanSlug(post.slug) || post.id}`;
  if (vergeben.has(name)) name += `-${post.id}`;
  vergeben.add(name);
  return name;
}

// ---------- HTML → Markdown ----------

/** WordPress-HTML vor der Umwandlung glätten. */
function vorbereiten(html) {
  return (
    html
      // Umbrüche am Anfang/Ende von Hervorhebungen nach außen ziehen,
      // z. B. <strong>Titel<br></strong>Text → <strong>Titel</strong><br>Text
      .replace(/((?:<br\s*\/?>\s*)+)(<\/(?:strong|b|em|i)>)/gi, '$2$1')
      .replace(/(<(?:strong|b|em|i)(?:\s[^>]*)?>)((?:\s*<br\s*\/?>)+)/gi, '$2$1')
      // Umbrüche mitten in einer Hervorhebung: Hervorhebung schließen und danach neu öffnen
      .replace(/<(strong|b|em|i)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (_, tag, attrs = '', inhalt) =>
        `<${tag}${attrs}>` + inhalt.replace(/<br\s*\/?>/gi, `</${tag}><br><${tag}>`) + `</${tag}>`,
      )
  );
}

function markdownAufraeumen(md) {
  return (
    md
      .replace(/ /g, ' ')
      .replace(/[ \t]+$/gm, '')
      // Fettdruck, der durch einen Absatz unterbrochen wurde, wieder schließen/öffnen
      .replace(/\*\*([^*\n]+)\n\n([^*\n]+)\*\*/g, '**$1**\n\n**$2**')
      .replace(/^\*\*\s*\*\*$/gm, '')
      .replace(/^[ \t]*\*\*[ \t]*$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function erstelleTurndown({ bilderBehalten }) {
  const td = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**',
  });
  td.remove(['style', 'script', 'noscript', 'iframe', 'svg']);

  // Bilder: Emojis (WordPress bindet sie als <img alt="✨"> ein) als Text übernehmen.
  // Andere Bilder entweder entfernen (Beiträge: kommen in cover/gallery) oder als
  // Markdown-Bild behalten (Seiten; src wurde vorher auf den neuen Pfad umgeschrieben).
  td.addRule('bilder', {
    filter: 'img',
    replacement: (_, node) => {
      const alt = node.getAttribute('alt') || '';
      const src = node.getAttribute('src') || '';
      const istEmoji = (src === '' || /s\.w\.org\/images\/core\/emoji/.test(src)) && alt && [...alt].length <= 3;
      if (istEmoji) return alt;
      return bilderBehalten && src.startsWith('/uploads/') ? `\n\n![${alt}](${src})\n\n` : '';
    },
  });
  // Bildunterschriften: bei Seiten kursiv unter das Bild, bei Beiträgen entfernen
  td.addRule('bildunterschrift', {
    filter: 'figcaption',
    replacement: (content) => (bilderBehalten && content.trim() ? `\n\n*${content.trim()}*\n\n` : ''),
  });
  // Aufklappbare Blöcke (<details>/<summary>): Inhalt als normale Absätze übernehmen
  // (die Zusammenfassung enthält oft schon den ganzen Text, Hervorhebungen bleiben erhalten).
  td.addRule('summary', {
    filter: ['details', 'summary'],
    replacement: (content) => `\n\n${content.trim()}\n\n`,
  });
  // <br> wird auf der alten Seite fast immer als Absatztrenner benutzt → echter Absatz
  td.addRule('umbruch', {
    filter: 'br',
    replacement: () => '\n\n',
  });
  // Links, die nur noch ein (entferntes) Bild enthielten, ganz weglassen
  td.addRule('leereLinks', {
    filter: (node) => node.nodeName === 'A' && !node.textContent.trim() && !node.querySelector('img'),
    replacement: () => '',
  });
  // Links um Bilder: nur das Bild behalten
  td.addRule('bildLinks', {
    filter: (node) => node.nodeName === 'A' && !node.textContent.trim() && node.querySelector('img'),
    replacement: (content) => content,
  });
  td.keep(['table']);
  return td;
}

const tdOhneBilder = erstelleTurndown({ bilderBehalten: false });
const tdMitBildern = erstelleTurndown({ bilderBehalten: true });

/**
 * Wandelt WordPress-HTML in Markdown um.
 * bilderBehalten: false → Bilder werden entfernt (Beiträge), true → bleiben als ![](…) stehen.
 */
export function htmlZuMarkdown(html, { bilderBehalten = false } = {}) {
  const td = bilderBehalten ? tdMitBildern : tdOhneBilder;
  return markdownAufraeumen(td.turndown(vorbereiten(html)));
}
