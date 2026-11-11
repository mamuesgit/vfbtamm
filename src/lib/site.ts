import { getCollection, type CollectionEntry } from 'astro:content';
import { ABTEILUNG_SLUG, type Abteilung } from '../data/abteilungen';

export const VEREIN = {
  name: 'VfB Tamm 1920 e.V.',
  kurz: 'VfB Tamm',
  strasse: 'Asperger Straße 3',
  ort: '71732 Tamm',
  telefon: '07141/9747328',
  email: 'info@vfbtamm.de',
  // Nur ein Link, keine eingebettete Karte (Datenschutz)
  karte: 'https://www.google.com/maps/search/?api=1&query=Asperger+Stra%C3%9Fe+3%2C+71732+Tamm',
};

export type Beitrag = CollectionEntry<'beitraege'>;
export type Mannschaft = CollectionEntry<'mannschaften'>;

// ---------- URLs ----------

export const abteilungUrl = (a: Abteilung) => `/${ABTEILUNG_SLUG[a]}/`;
export const beitraegeUrl = (a: Abteilung) => `/${ABTEILUNG_SLUG[a]}/beitraege/`;
export const beitragUrl = (b: Beitrag) => `/beitraege/${b.id}/`;

/** URL-Teil einer Mannschaft innerhalb der Abteilung ("tischtennis-herren" → "herren") */
export function mannschaftSlug(m: Mannschaft) {
  const prefix = ABTEILUNG_SLUG[m.data.abteilung] + '-';
  return m.id.startsWith(prefix) ? m.id.slice(prefix.length) : m.id;
}
export const mannschaftUrl = (m: Mannschaft) => `/${ABTEILUNG_SLUG[m.data.abteilung]}/${mannschaftSlug(m)}/`;

// ---------- Daten ----------

/** Alle Beiträge, neueste zuerst (optional nur eine Abteilung) */
export async function beitraege(abteilung?: Abteilung) {
  const alle = await getCollection('beitraege', (b) => !abteilung || b.data.abteilung === abteilung);
  return alle.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Mannschaften einer Abteilung, sortiert nach reihenfolge, dann Name */
export async function mannschaften(abteilung: Abteilung) {
  const alle = await getCollection('mannschaften', (m) => m.data.abteilung === abteilung);
  return alle.sort(
    (a, b) => (a.data.reihenfolge ?? 999) - (b.data.reihenfolge ?? 999) || a.data.name.localeCompare(b.data.name, 'de'),
  );
}

/** Mannschaften nach Gruppe (Reihenfolge der Gruppen wie in den Daten) */
export function nachGruppe(liste: Mannschaft[]) {
  const gruppen = new Map<string, Mannschaft[]>();
  for (const m of liste) {
    if (!gruppen.has(m.data.gruppe)) gruppen.set(m.data.gruppe, []);
    gruppen.get(m.data.gruppe)!.push(m);
  }
  return [...gruppen.entries()];
}

// ---------- Formatierung ----------

// Beitragsdaten sind ohne Zeitzone gespeichert und werden als UTC gelesen → in UTC anzeigen,
// damit das Kalenderdatum unverändert bleibt.
const datumFormat = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const datumKurz = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
const wochentag = new Intl.DateTimeFormat('de-DE', { weekday: 'short', timeZone: 'UTC' });

export const datum = (d: Date) => datumFormat.format(d);
export const datumNumerisch = (d: Date) => datumKurz.format(d);
export const tagKurz = (d: Date) => wochentag.format(d);
export const isoDatum = (d: Date) => d.toISOString().slice(0, 10);

/** Kurzer Textauszug aus dem Markdown eines Beitrags */
export function auszug(markdown: string | undefined, laenge = 180) {
  if (!markdown) return '';
  const text = markdown
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_#>`|]/g, '')
    .replace(/\\(.)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= laenge) return text;
  return text.slice(0, text.lastIndexOf(' ', laenge)) + ' …';
}

export const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] as const;

export function uhrzeit(von: string, bis?: string) {
  return bis ? `${von}–${bis} Uhr` : `ab ${von} Uhr`;
}

/**
 * tel:-Link aus einer frei geschriebenen Telefonnummer.
 * "0160… / 0157…" sind zwei Nummern (erste wird verlinkt), "07141 / 5055437" ist eine Nummer mit Vorwahl.
 */
export function telLink(telefon: string) {
  const teile = telefon.split(/\s\/\s/);
  const zweiNummern = teile.length > 1 && teile.every((t) => t.replace(/\D/g, '').length >= 8);
  return 'tel:' + (zweiNummern ? teile[0] : telefon).replace(/[^\d+]/g, '');
}

// ---------- Spielergebnisse aus Beitragstiteln ----------

export interface Ergebnis {
  mannschaft: string;
  heim: string;
  gast: string;
  toreHeim: number;
  toreGast: number;
  ausgang: 'sieg' | 'remis' | 'niederlage';
}

/**
 * Liest ein Spielergebnis aus einem Titel wie
 * „Herren 1: DJK Ludwigsburg 2 – VfB Tamm 1:6 (1:3)“. Gibt null zurück, wenn der Titel
 * nicht diesem Muster folgt oder der VfB Tamm keine der beiden Mannschaften ist.
 */
export function spielergebnis(titel: string): Ergebnis | null {
  const m = titel.match(
    /^([^:]{1,30}):\s*(.+?)\s+[–-]\s+(.+?)\s+(\d{1,2})\s*:\s*(\d{1,2})\s*(?:\(\s*\d{1,2}\s*:\s*\d{1,2}\s*\))?\s*$/,
  );
  if (!m) return null;
  const [, mannschaft, heim, gast, h, g] = m;
  const vfbHeim = /vfb\s*tamm/i.test(heim);
  const vfbGast = /vfb\s*tamm/i.test(gast);
  if (vfbHeim === vfbGast) return null;
  const eigene = vfbHeim ? +h : +g;
  const gegner = vfbHeim ? +g : +h;
  return {
    mannschaft: mannschaft.trim(),
    heim: heim.trim(),
    gast: gast.trim(),
    toreHeim: +h,
    toreGast: +g,
    ausgang: eigene > gegner ? 'sieg' : eigene < gegner ? 'niederlage' : 'remis',
  };
}

/** Vergleichsschlüssel für Mannschaftsnamen: „D1 Junioren“, „D1-Jugend“ → „d1jugend“, „AH“ → „alteherren“ */
function mannschaftsSchluessel(name: string) {
  const s = name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\b(pokalspiel|freundschaftsspiel|testspiel)\b/g, '')
    .replace(/junior(en|innen)|jugend/g, 'jugend')
    .replace(/[^a-z0-9äöüß]/g, '');
  return s === 'ah' ? 'alteherren' : s;
}

/**
 * Mannschaft zu einem Spielbericht: liest die Mannschaft aus dem Titel (siehe spielergebnis())
 * und sucht sie in derselben Abteilung. „E1“ passt auf „E1-Jugend“, „A1-Junioren“ passt auch auf „A-Jugend“, wenn es keine
 * A1 gibt. Gibt undefined zurück, wenn der Beitrag kein Spielbericht ist oder keine Mannschaft passt.
 */
export async function mannschaftZumSpielbericht(b: Beitrag) {
  const ergebnis = spielergebnis(b.data.title);
  if (!ergebnis) return undefined;
  const gesucht = mannschaftsSchluessel(ergebnis.mannschaft);
  const liste = await mannschaften(b.data.abteilung);
  const finde = (k: string) => liste.find((m) => mannschaftsSchluessel(m.data.name) === k);
  const kurz = /^[a-g]\d?$/.test(gesucht) ? gesucht + 'jugend' : gesucht; // „E1: …“ ohne „Jugend“
  return finde(kurz) ?? finde(kurz.replace(/^([a-z])1(?=jugend$)/, '$1'));
}
