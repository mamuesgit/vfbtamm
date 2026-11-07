/**
 * Abteilungen des Vereins. Grundlage für das Pflicht-Dropdown im CMS und
 * für die Zuordnung von Beiträgen und Mannschaften.
 * (Basketball ist nur ein externer Link und keine eigene Abteilung.)
 */
export const ABTEILUNGEN = ['Hauptverein', 'Fußball', 'Freizeitsport', 'Tischtennis'] as const;

export type Abteilung = (typeof ABTEILUNGEN)[number];

/** URL-Pfad je Abteilung, z. B. "fussball" → /fussball/ */
export const ABTEILUNG_SLUG: Record<Abteilung, string> = {
  Hauptverein: 'hauptverein',
  Fußball: 'fussball',
  Freizeitsport: 'freizeitsport',
  Tischtennis: 'tischtennis',
};

export const BASKETBALL_URL = 'http://www.bgvfbtsv.de/';
export const FANSHOP_URL = 'https://vfbtamm.fan12.de/';
