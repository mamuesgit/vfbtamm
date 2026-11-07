// Sucht in den Datendateien (src/data/**/*.yaml) nach Bildpfaden unter /uploads/,
// die es in public/uploads/ noch nicht gibt, und lädt sie aus der WordPress-Mediathek
// nach (Original → max. 1600 px → WebP).
//
// So können Datendateien von Hand mit dem Zielpfad geschrieben werden, z. B.
//   teamfoto: /uploads/2025/06/2025_ah-turnier_mannschaftsbild.webp
// für https://www.vfbtamm.de/wp-content/uploads/2025/06/2025_AH-Turnier_Mannschaftsbild.jpg
//
// Aufruf: npm run wp:bilder-nachladen

import { readdir, readFile } from 'node:fs/promises';
import { ROOT, readJson, exists, zielpfad, bildUebernehmen } from './lib.mjs';

const DATA = new URL('src/data/', ROOT);

const media = await readJson('media.json');
const nachZielpfad = new Map(media.map((m) => ['/uploads/' + zielpfad(m.source_url, '.webp'), m.source_url]));

const dateien = (await readdir(DATA, { recursive: true })).filter((f) => /\.ya?ml$/.test(f));
const pfade = new Set();
for (const f of dateien) {
  const text = await readFile(new URL(f, DATA), 'utf8');
  for (const [p] of text.matchAll(/\/uploads\/[^\s"']+\.webp/g)) pfade.add(p);
}

let geladen = 0;
const fehlend = [];
for (const pfad of pfade) {
  if (await exists(new URL('public' + pfad, ROOT))) continue;
  const url = nachZielpfad.get(pfad);
  if (!url) {
    fehlend.push(pfad);
    continue;
  }
  await bildUebernehmen(url);
  geladen++;
}

console.log(`${pfade.size} Bildpfade gefunden, ${geladen} nachgeladen.`);
if (fehlend.length) {
  console.log('Nicht in der WordPress-Mediathek gefunden:');
  for (const p of fehlend) console.log('  - ' + p);
  process.exitCode = 1;
}
