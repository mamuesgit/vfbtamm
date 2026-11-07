/**
 * Abteilungen des Vereins. Grundlage für das Pflicht-Dropdown im CMS und
 * für die Zuordnung von Beiträgen und Mannschaften.
 * (Basketball ist nur ein externer Link und keine eigene Abteilung.)
 */
export const ABTEILUNGEN = ['Hauptverein', 'Fußball', 'Freizeitsport', 'Tischtennis'] as const;

export type Abteilung = (typeof ABTEILUNGEN)[number];
