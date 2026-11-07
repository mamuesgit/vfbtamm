// Erzeugt public/_redirects: 301-Weiterleitungen von den alten WordPress-Adressen auf die neue Seite.
// Grundlage sind die Rohdaten in migration/cache/ (npm run wp:fetch).
//
// Aufruf: npm run build && npm run wp:redirects
// Jedes Ziel wird gegen dist/ geprüft – fehlt eine Zielseite, bricht das Skript ab.
// Cloudflare erlaubt max. 2000 statische und 100 dynamische Regeln.

import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { ROOT, readJson, beitragsDateiname, zielpfad } from './lib.mjs';

const DIST = new URL('dist/', ROOT);

// Alte Seiten → neue Seiten (nur wo sich die Adresse geändert hat)
const SEITEN = {
  '/bambini_jugend/': '/fussball/bambini/',
  '/datenschutzerklaerung/': '/datenschutz/',
  '/freizeitsport/abteilungsleiter/': '/freizeitsport/abteilungsleitung/',
  '/freizeitsport/freizeitsport-beitraege/': '/freizeitsport/beitraege/',
  '/fussball/a_jugend/': '/fussball/a-jugend/',
  '/fussball/ah/': '/fussball/alte-herren/',
  '/fussball/b2_24_jugend/': '/fussball/',
  '/fussball/c1_jugend/': '/fussball/c1-jugend/',
  '/fussball/c2_jugend/': '/fussball/c2-jugend/',
  '/fussball/d1_jugend/': '/fussball/d1-jugend/',
  '/fussball/d2_jugend/': '/fussball/d2-jugend/',
  '/fussball/e1_jugend/': '/fussball/e1-jugend/',
  '/fussball/e2_jugend/': '/fussball/e2-jugend/',
  '/fussball/f2_jugend/': '/fussball/f2-jugend/',
  '/fussball/fussball-beitraege/': '/fussball/beitraege/',
  '/fussball/archiv/': '/fussball/beitraege/',
  '/fussball/inklusionsmannschaft/': '/fussball/inklusionsteam/',
  '/fussball/maedchen_b_jugend/': '/fussball/',
  '/fussball/maedchen_c_jugend/': '/fussball/',
  '/fussball/torwart_training/': '/fussball/torwarttraining/',
  '/fussball/vereinspielplan/': '/fussball/',
  '/hauptverein/der-vorstand/': '/hauptverein/vorstand/',
  '/hauptverein/die-abteilungsleit/': '/hauptverein/abteilungsleiter/',
  '/hauptverein/hauptverein-beitraege/': '/hauptverein/beitraege/',
  '/hauptverein/hygienekonzept/': '/hauptverein/',
  '/hauptverein/unsere-leitsaetze/': '/hauptverein/leitsaetze/',
  '/hauptverein/verein/vfb-vereinsgaststaette/': '/hauptverein/gaststaette/',
  '/hauptverein/vereinschronik/': '/hauptverein/chronik/',
  '/psg/': '/hauptverein/',
  '/veranstaltungen/': '/hauptverein/veranstaltungen/',
  '/category/hauptverein-news/': '/hauptverein/beitraege/',
  '/category/fussball-news/': '/fussball/beitraege/',
  '/category/freizeitsport-news/': '/freizeitsport/beitraege/',
  '/category/tischtennis-news/': '/tischtennis/beitraege/',
  '/category/psg-news/': '/hauptverein/',
  '/feed/': '/',
  '/wp-login.php': '/admin/',
  '/wp-admin/': '/admin/',
  // Downloads (alte Pfade außerhalb der Mediathek)
  '/custom/downloads/Satzung.pdf': '/downloads/satzung.pdf',
  '/custom/downloads/PassantragSpielerpass.pdf': '/downloads/passantrag-spielerpass.pdf',
  '/custom/downloads/EinverstaendnisErklaerungSpielerfoto.pdf': '/downloads/einverstaendnis-spielerfoto.pdf',
  '/wp-content/uploads/2026/02/Beitritterklaerung_VfB-Tamm_2026.pdf': '/downloads/mitgliedsantrag-2026.pdf',
  '/wp-content/uploads/2026/02/Beitragsordnung_2026.pdf': '/downloads/beitragsordnung-2026.pdf',
  '/uploads/news/vfbmitgliedsantrag_2018.pdf': '/downloads/mitgliedsantrag-2026.pdf',
};

// Dynamische Regeln (Platzhalter *): Unterseiten und Seitennummern alter Listen
const DYNAMISCH = [
  ['/veranstaltungen/*', '/hauptverein/veranstaltungen/'],
  ['/category/hauptverein-news/*', '/hauptverein/beitraege/'],
  ['/category/fussball-news/*', '/fussball/beitraege/'],
  ['/category/freizeitsport-news/*', '/freizeitsport/beitraege/'],
  ['/category/tischtennis-news/*', '/tischtennis/beitraege/'],
  ['/category/psg-news/*', '/hauptverein/'],
  ['/psg/*', '/hauptverein/'],
  ['/author/*', '/'],
  ['/tag/*', '/'],
  ['/page/*', '/'],
  ['/feed/*', '/'],
  ['/comments/feed/*', '/'],
  ['/wp-admin/*', '/admin/'],
];

const zielExistiert = (ziel) => {
  const pfad = decodeURIComponent(ziel).replace(/^\//, '');
  return ziel.endsWith('/') ? existsSync(new URL(pfad + 'index.html', DIST)) : existsSync(new URL(pfad, DIST));
};

const regeln = new Map(); // quelle → ziel
const fehlend = [];
const hinzu = (quelle, ziel) => {
  if (quelle === ziel || regeln.has(quelle)) return;
  if (!zielExistiert(ziel)) return fehlend.push(`${quelle} → ${ziel}`);
  regeln.set(quelle, ziel);
  // Prozent-kodierte Adressen (Emojis, Umlaute) zusätzlich mit großen Hex-Ziffern, wie Browser sie senden
  const gross = quelle.replace(/%[0-9a-f]{2}/gi, (h) => h.toUpperCase());
  if (gross !== quelle && !regeln.has(gross)) regeln.set(gross, ziel);
};

// 1. Beiträge: /JJJJ/MM/TT/slug/ → /beitraege/JJJJ-MM-TT-slug/ (gleiche Namenslogik wie convert-posts)
const posts = await readJson('posts.json');
const KATEGORIE_PSG = 12;
const vergeben = new Set();
let anzahlBeitraege = 0;
for (const post of posts) {
  const alt = new URL(post.link).pathname;
  if (post.categories.includes(KATEGORIE_PSG)) {
    hinzu(alt, '/hauptverein/');
    continue;
  }
  hinzu(alt, `/beitraege/${beitragsDateiname(post, vergeben)}/`);
  anzahlBeitraege++;
}

// 2. Seiten
for (const [alt, neu] of Object.entries(SEITEN)) hinzu(alt, neu);

// 3. Bilder der Mediathek: Original-URL → neues WebP (nur wenn übernommen)
let anzahlBilder = 0;
for (const m of await readJson('media.json')) {
  if (!m.mime_type.startsWith('image/')) continue;
  const neu = '/uploads/' + zielpfad(m.source_url, '.webp');
  if (!zielExistiert(neu)) continue; // nie verwendet → nicht übernommen
  hinzu(new URL(m.source_url).pathname, neu);
  anzahlBilder++;
}

if (fehlend.length) {
  console.error(`Ziel fehlt für ${fehlend.length} Weiterleitungen:\n  ` + fehlend.join('\n  '));
  process.exit(1);
}

const zeilen = [
  '# Weiterleitungen von der alten WordPress-Seite (erzeugt mit npm run wp:redirects – nicht von Hand ändern)',
  ...[...regeln].map(([q, z]) => `${q} ${z} 301`),
  '',
  '# Dynamische Regeln',
  ...DYNAMISCH.map(([q, z]) => `${q} ${z} 301`),
  '',
];
await writeFile(new URL('public/_redirects', ROOT), zeilen.join('\n'));
console.log(
  `${regeln.size} statische Regeln (${anzahlBeitraege} Beiträge, ${Object.keys(SEITEN).length} Seiten, ${anzahlBilder} Bilder, PSG → Hauptverein), ${DYNAMISCH.length} dynamische.`,
);
if (regeln.size > 2000 || DYNAMISCH.length > 100) {
  console.error('Zu viele Regeln für Cloudflare (max. 2000 statisch / 100 dynamisch)!');
  process.exit(1);
}
