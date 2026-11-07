// Konvertiert die WordPress-Beiträge aus migration/cache/ (siehe fetch.mjs)
// in Markdown-Dateien für die Collection "beitraege".
//
// - Abteilung aus der WordPress-Kategorie (psg-news wird nicht übernommen)
// - Bilder: Beitragsbild bzw. erstes Bild im Text → cover, weitere → gallery.
//   Es wird immer das Original geladen (keine WordPress-Zwischengrößen),
//   auf max. 1600 px Breite verkleinert und als WebP unter public/uploads/ gespeichert.
// - Text: HTML → Markdown, ohne Bilder, Elementor-Wrapper und Inline-Styles
//
// Aufruf: npm run wp:convert-posts
// Bereits heruntergeladene Originale liegen in migration/cache/originals/ und
// werden nicht erneut geladen.

import { mkdir, readFile, writeFile, access, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import TurndownService from 'turndown';
import sharp from 'sharp';

const ROOT = new URL('../../', import.meta.url);
const CACHE = new URL('migration/cache/', ROOT);
const ORIGINALS = new URL('migration/cache/originals/', ROOT);
const OUT_POSTS = new URL('src/content/beitraege/', ROOT);
const OUT_UPLOADS = new URL('public/uploads/', ROOT);
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; vfbtamm-migration)' };
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 80;

const KATEGORIE_ZU_ABTEILUNG = {
  'hauptverein-news': 'Hauptverein',
  'fussball-news': 'Fußball',
  'freizeitsport-news': 'Freizeitsport',
  'tischtennis-news': 'Tischtennis',
  // 'psg-news': nicht übernehmen (PSG 2023 aufgelöst)
};

const readJson = async (name) => JSON.parse(await readFile(new URL(name, CACHE), 'utf8'));
const exists = (url) => access(url).then(() => true, () => false);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const categories = await readJson('categories.json');
const posts = await readJson('posts.json');
const media = new Map((await readJson('media.json')).map((m) => [m.id, m]));
const kategorieSlug = new Map(categories.map((c) => [c.id, c.slug]));

// ---------- Hilfsfunktionen ----------

function decodeEntities(s) {
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

function cleanTitle(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
}

function cleanSlug(slug) {
  return decodeURIComponent(slug)
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Original-URL eines Bildes: über die Media-ID, sonst WordPress-Größensuffix entfernen. */
function originalUrl(imgTag) {
  const id = imgTag.match(/wp-image-(\d+)/)?.[1];
  if (id && media.has(Number(id))) return media.get(Number(id)).source_url;
  const src = imgTag.match(/\ssrc="([^"]+)"/)?.[1];
  if (!src) return null;
  return src.replace(/-\d+x\d+(\.\w+)$/, '$1');
}

/** Pfad unter /uploads/ für eine WordPress-URL, z. B. /uploads/2026/11/image0.webp */
function zielpfad(url, ext) {
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

const fehler = [];

/** Lädt ein Bild, speichert es als WebP und liefert den öffentlichen Pfad. */
async function bildUebernehmen(url, beitrag, stillBeiFehler = false) {
  const rel = zielpfad(url, '.webp');
  const ziel = new URL(rel, OUT_UPLOADS);
  if (!(await exists(ziel))) {
    try {
      const buf = await download(url);
      await mkdir(dirname(ziel.pathname), { recursive: true });
      await sharp(buf, { animated: false })
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(ziel.pathname);
    } catch (e) {
      if (!stillBeiFehler) fehler.push(`${beitrag}: Bild ${url} – ${e.message}`);
      return null;
    }
  }
  return '/uploads/' + rel;
}

/** Lädt eine verlinkte Datei (z. B. PDF) unverändert nach public/uploads/. */
async function dateiUebernehmen(url, beitrag) {
  const rel = zielpfad(url);
  const ziel = new URL(rel, OUT_UPLOADS);
  if (!(await exists(ziel))) {
    try {
      const buf = await download(url);
      await mkdir(dirname(ziel.pathname), { recursive: true });
      await writeFile(ziel, buf);
    } catch (e) {
      fehler.push(`${beitrag}: Datei ${url} – ${e.message}`);
      return url;
    }
  }
  return '/uploads/' + rel;
}

// ---------- HTML → Markdown ----------

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
});
turndown.remove(['style', 'script', 'noscript', 'figcaption']);
// Emojis bindet WordPress als <img alt="✨"> ein → als Text übernehmen, alle anderen Bilder entfernen.
turndown.addRule('bilder', {
  filter: 'img',
  replacement: (_, node) => {
    const alt = node.getAttribute('alt') || '';
    const src = node.getAttribute('src') || '';
    const istEmoji = (src === '' || /s\.w\.org\/images\/core\/emoji/.test(src)) && alt && [...alt].length <= 3;
    return istEmoji ? alt : '';
  },
});
// Aufklappbare Blöcke (<details>/<summary>): Inhalt als normale Absätze übernehmen
// (die Zusammenfassung enthält oft schon den ganzen Text, Hervorhebungen bleiben erhalten).
turndown.addRule('summary', {
  filter: ['details', 'summary'],
  replacement: (content) => `\n\n${content.trim()}\n\n`,
});
// <br> wird auf der alten Seite fast immer als Absatztrenner benutzt → echter Absatz
turndown.addRule('umbruch', {
  filter: 'br',
  replacement: () => '\n\n',
});
// Links, die nur noch ein (entferntes) Bild enthielten, ganz weglassen
turndown.addRule('leereLinks', {
  filter: (node) => node.nodeName === 'A' && !node.textContent.trim(),
  replacement: () => '',
});
turndown.keep(['table']);

function markdownAufraeumen(md) {
  return md
    .replace(/ /g, ' ')
    .replace(/[ \t]+$/gm, '')
    // Fettdruck, der durch einen Absatz unterbrochen wurde, wieder schließen/öffnen
    .replace(/\*\*([^*\n]+)\n\n([^*\n]+)\*\*/g, '**$1**\n\n**$2**')
    .replace(/^\*\*\s*\*\*$/gm, '')
    .replace(/^[ \t]*\*\*[ \t]*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const yamlString = (s) => JSON.stringify(s);

// ---------- Konvertierung ----------

await rm(OUT_POSTS, { recursive: true, force: true });
await mkdir(OUT_POSTS, { recursive: true });

let anzahl = 0;
let uebersprungen = 0;
const dateinamen = new Set();

for (const [i, post] of posts.entries()) {
  const kat = kategorieSlug.get(post.categories[0]);
  const abteilung = KATEGORIE_ZU_ABTEILUNG[kat];
  if (!abteilung) {
    uebersprungen++;
    continue;
  }

  const datum = post.date.slice(0, 10);
  let dateiname = `${datum}-${cleanSlug(post.slug) || post.id}`;
  if (dateinamen.has(dateiname)) dateiname += `-${post.id}`;
  dateinamen.add(dateiname);

  let html = post.content.rendered;

  // Bilder einsammeln: Beitragsbild zuerst, danach Bilder aus dem Text (ohne Emojis, ohne Duplikate)
  const bildUrls = [];
  if (post.featured_media && media.has(post.featured_media)) bildUrls.push(media.get(post.featured_media).source_url);
  // Zu jedem Bild zusätzlich die eingebundene URL merken – Fallback, falls das Original fehlt.
  const fallback = new Map();
  for (const tag of html.match(/<img[^>]+>/g) ?? []) {
    const url = originalUrl(tag);
    if (url && !bildUrls.includes(url)) bildUrls.push(url);
    const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
    if (url && src && src !== url) fallback.set(url, src);
  }
  const bilder = [];
  for (const url of bildUrls) {
    let pfad = await bildUebernehmen(url, dateiname, fallback.has(url));
    if (!pfad && fallback.has(url)) pfad = await bildUebernehmen(fallback.get(url), dateiname);
    if (pfad && !bilder.includes(pfad)) bilder.push(pfad);
  }

  // Verlinkte Dateien (PDF, Office) aus wp-content/uploads übernehmen
  for (const [, url] of html.matchAll(/href="(https?:\/\/(?:www\.)?vfbtamm\.de\/wp-content\/uploads\/[^"]+\.(?:pdf|docx?|xlsx?))"/gi)) {
    html = html.replaceAll(url, await dateiUebernehmen(url, dateiname));
  }

  // Umbrüche am Anfang/Ende von Hervorhebungen nach außen ziehen,
  // z. B. <strong>Titel<br></strong>Text → <strong>Titel</strong><br>Text
  html = html
    .replace(/((?:<br\s*\/?>\s*)+)(<\/(?:strong|b|em|i)>)/gi, '$2$1')
    .replace(/(<(?:strong|b|em|i)(?:\s[^>]*)?>)((?:\s*<br\s*\/?>)+)/gi, '$2$1')
    // Umbrüche mitten in einer Hervorhebung: Hervorhebung schließen und danach neu öffnen
    .replace(/<(strong|b|em|i)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, (_, tag, attrs = '', inhalt) =>
      `<${tag}${attrs}>` + inhalt.replace(/<br\s*\/?>/gi, `</${tag}><br><${tag}>`) + `</${tag}>`,
    );

  const body = markdownAufraeumen(turndown.turndown(html));

  const fm = [
    '---',
    `title: ${yamlString(cleanTitle(post.title.rendered))}`,
    `date: ${post.date}`,
    `abteilung: ${abteilung}`,
  ];
  if (bilder[0]) fm.push(`cover: ${bilder[0]}`);
  if (bilder.length > 1) fm.push('gallery:', ...bilder.slice(1).map((b) => `  - ${b}`));
  fm.push('---', '');

  await writeFile(new URL(`${dateiname}.md`, OUT_POSTS), fm.join('\n') + body + '\n');
  anzahl++;
  if ((i + 1) % 50 === 0) console.log(`${i + 1}/${posts.length} …`);
}

console.log(`\n${anzahl} Beiträge geschrieben, ${uebersprungen} übersprungen (PSG).`);
if (fehler.length) {
  console.log(`\n${fehler.length} Probleme:`);
  for (const f of fehler) console.log('  - ' + f);
}
