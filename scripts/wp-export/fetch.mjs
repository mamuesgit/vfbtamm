// Lädt alle Beiträge, Seiten, Medien-Metadaten und Kategorien der alten
// WordPress-Seite über die REST-API und speichert sie roh als JSON in
// migration/cache/. Diese Dateien sind die Grundlage für die Konvertierung.
//
// Aufruf: npm run wp:fetch
// (In der Cloud-Umgebung ggf. mit NODE_USE_ENV_PROXY=1, damit fetch den Proxy nutzt.)

import { mkdir, writeFile } from 'node:fs/promises';

// Seit der Domain-Umstellung (08.11.2026) zeigt www.vfbtamm.de auf die neue Seite;
// die alte WordPress-Seite ist nur noch unter der Adresse des Hosters erreichbar.
const API = 'https://vfbtamm-de.prossl.de/wp-json/wp/v2';
// Der Webhoster blockiert Anfragen ohne Browser-ähnliche Kennung.
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; vfbtamm-migration)' };
const OUT = new URL('../../migration/cache/', import.meta.url);
const PAUSE_MS = 500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchAll(endpoint) {
  const items = [];
  for (let page = 1; ; page++) {
    const url = `${API}/${endpoint}?per_page=100&page=${page}&context=view`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    items.push(...(await res.json()));
    const totalPages = Number(res.headers.get('x-wp-totalpages') ?? 1);
    console.log(`${endpoint}: Seite ${page}/${totalPages}`);
    if (page >= totalPages) break;
    await sleep(PAUSE_MS);
  }
  return items;
}

await mkdir(OUT, { recursive: true });
for (const endpoint of ['categories', 'posts', 'pages', 'media']) {
  const items = await fetchAll(endpoint);
  await writeFile(new URL(`${endpoint}.json`, OUT), JSON.stringify(items, null, 2));
  console.log(`→ ${items.length} ${endpoint} gespeichert`);
}
