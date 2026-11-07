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

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { ROOT, readJson, htmlZuMarkdown, cleanTitle, bildUebernehmen as bildLaden, dateiUebernehmen as dateiLaden } from './lib.mjs';

const OUT_POSTS = new URL('src/content/beitraege/', ROOT);

const KATEGORIE_ZU_ABTEILUNG = {
  'hauptverein-news': 'Hauptverein',
  'fussball-news': 'Fußball',
  'freizeitsport-news': 'Freizeitsport',
  'tischtennis-news': 'Tischtennis',
  // 'psg-news': nicht übernehmen (PSG 2023 aufgelöst)
};


const categories = await readJson('categories.json');
const posts = await readJson('posts.json');
const media = new Map((await readJson('media.json')).map((m) => [m.id, m]));
const kategorieSlug = new Map(categories.map((c) => [c.id, c.slug]));

// ---------- Hilfsfunktionen ----------

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

const fehler = [];

/** Wie bildLaden, sammelt Fehler aber in der Liste statt abzubrechen. */
async function bildUebernehmen(url, beitrag, stillBeiFehler = false) {
  try {
    return await bildLaden(url);
  } catch (e) {
    if (!stillBeiFehler) fehler.push(`${beitrag}: Bild ${url} – ${e.message}`);
    return null;
  }
}

async function dateiUebernehmen(url, beitrag) {
  try {
    return await dateiLaden(url);
  } catch (e) {
    fehler.push(`${beitrag}: Datei ${url} – ${e.message}`);
    return url;
  }
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

  const body = htmlZuMarkdown(html);

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
