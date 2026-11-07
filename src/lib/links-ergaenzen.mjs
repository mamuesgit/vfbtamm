// Astro-Integration: ergänzt nach dem Build in allen HTML-Dateien Links, die ohne Protokoll
// eingegeben wurden, z. B. href="vfbtamm.fan12.de" → https://… oder href="info@vfbtamm.de" → mailto:…
// Ohne "https://" würde der Browser sie als Unterseite der eigenen Website behandeln.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const DOMAIN = /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.(de|com|net|org|eu|info|at|ch|fr|it|nl|io|app|tv)([/?#:][^"]*)?$/i;
const EMAIL = /^[^\s@/"]+@[^\s@/"]+\.[a-z]{2,}$/i;

export function ergaenze(url) {
  const u = url.trim();
  // Schon mit Protokoll (https:, mailto:, tel: …), intern (/…), Anker (#…) oder relativ (./…) → unverändert
  if (/^[a-z][a-z0-9+.-]*:/i.test(u) || /^[/#.?]/.test(u)) return url;
  if (EMAIL.test(u)) return 'mailto:' + u;
  if (DOMAIN.test(u)) return 'https://' + u;
  return url;
}

export default function linksErgaenzen() {
  return {
    name: 'links-ergaenzen',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        let geaendert = 0;
        for (const datei of await readdir(root, { recursive: true })) {
          if (!datei.endsWith('.html') || datei.startsWith('admin')) continue;
          const pfad = join(root, datei);
          const html = await readFile(pfad, 'utf8');
          const neu = html.replace(/href="([^"]*)"/g, (ganz, url) => {
            const korrigiert = ergaenze(url);
            if (korrigiert === url) return ganz;
            geaendert++;
            return `href="${korrigiert}"`;
          });
          if (neu !== html) await writeFile(pfad, neu);
        }
        logger.info(`${geaendert} Links ohne Protokoll ergänzt`);
      },
    },
  };
}
