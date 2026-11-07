// Kopiert Sveltia CMS aus node_modules nach public/admin/, damit das CMS vom eigenen Server
// ausgeliefert wird (keine externen Skripte, siehe Datenschutz). Läuft automatisch vor "npm run build".
import { cp, mkdir, rm } from 'node:fs/promises';

const quelle = new URL('../node_modules/@sveltia/cms/dist/', import.meta.url);
const ziel = new URL('../public/admin/', import.meta.url);

await mkdir(ziel, { recursive: true });
await rm(new URL('chunks/', ziel), { recursive: true, force: true });
await cp(new URL('sveltia-cms.js', quelle), new URL('sveltia-cms.js', ziel));
await cp(new URL('chunks/', quelle), new URL('chunks/', ziel), {
  recursive: true,
  filter: (pfad) => !pfad.endsWith('.map'),
});
console.log('Sveltia CMS nach public/admin/ kopiert');
