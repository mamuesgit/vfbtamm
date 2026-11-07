// EINMALIGER EXPORT – die erzeugten Dateien wurden danach von Hand nachbearbeitet.
// Nicht erneut ausführen, sonst gehen diese Änderungen verloren.
//
// Konvertiert ausgewählte statische WordPress-Seiten in Markdown-Dateien für die
// Collection "seiten" (src/content/seiten/). Bilder bleiben im Text erhalten und werden
// wie bei den Beiträgen als WebP (max. 1600 px) unter public/uploads/ abgelegt.
//
// Nicht hier enthalten (von Hand als Daten- bzw. Markdown-Datei angelegt):
// Vorstand, Abteilungsleiter, Sponsoren, Downloads, Veranstaltungen, Mitgliedsbeiträge.
//
// Aufruf: npm run wp:convert-pages

import { mkdir, writeFile } from 'node:fs/promises';
import { ROOT, readJson, htmlZuMarkdown, cleanTitle, bildUebernehmen } from './lib.mjs';

const OUT = new URL('src/content/seiten/', ROOT);

// alter Pfad → neue ID (Dateiname) und Titel
const SEITEN = {
  '/hauptverein/verein/': { id: 'verein', title: 'Verein' },
  '/hauptverein/unsere-leitsaetze/': { id: 'leitsaetze', title: 'Unsere Leitsätze' },
  '/hauptverein/vereinschronik/': { id: 'chronik', title: 'Vereinschronik' },
  '/hauptverein/verein/vfb-vereinsgaststaette/': { id: 'gaststaette', title: 'VfB-Vereinsgaststätte' },
  '/impressum/': { id: 'impressum', title: 'Impressum' },
  '/datenschutzerklaerung/': { id: 'datenschutz', title: 'Datenschutzerklärung' },
};

const pages = await readJson('pages.json');
await mkdir(OUT, { recursive: true });

for (const page of pages) {
  const pfad = new URL(page.link).pathname;
  const ziel = SEITEN[pfad];
  if (!ziel) continue;

  let html = page.content.rendered;

  // Bilder laden und src auf den neuen Pfad umschreiben (immer das Original, keine Zwischengröße)
  for (const [tag, src] of html.matchAll(/<img[^>]*\ssrc="(https?:\/\/(?:www\.)?vfbtamm\.de\/wp-content\/uploads\/[^"]+)"[^>]*>/g)) {
    const original = src.replace(/-\d+x\d+(\.\w+)$/, '$1');
    let neu;
    try {
      neu = await bildUebernehmen(original);
    } catch {
      neu = await bildUebernehmen(src);
    }
    html = html.replace(tag, tag.replace(src, neu));
  }

  const body = htmlZuMarkdown(html, { bilderBehalten: true });
  const fm = ['---', `title: ${JSON.stringify(ziel.title)}`, '---', ''].join('\n');
  await writeFile(new URL(`${ziel.id}.md`, OUT), fm + body + '\n');
  console.log(`${pfad} → src/content/seiten/${ziel.id}.md (${cleanTitle(page.title.rendered)})`);
}
