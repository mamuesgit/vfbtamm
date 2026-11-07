import type { Abteilung } from '../data/abteilungen';
import { abteilungUrl, beitraegeUrl, mannschaften, mannschaftUrl, nachGruppe } from './site';

export interface NavGruppe {
  titel?: string;
  links: { text: string; href: string }[];
}

const STATISCH: Record<Abteilung, NavGruppe[]> = {
  Hauptverein: [
    {
      links: [
        { text: 'Übersicht', href: '/hauptverein/' },
        { text: 'Beiträge', href: '/hauptverein/beitraege/' },
        { text: 'Veranstaltungen', href: '/hauptverein/veranstaltungen/' },
      ],
    },
    {
      titel: 'Verein',
      links: [
        { text: 'Verein', href: '/hauptverein/verein/' },
        { text: 'Unsere Leitsätze', href: '/hauptverein/leitsaetze/' },
        { text: 'Vereinschronik', href: '/hauptverein/chronik/' },
        { text: 'Vorstand', href: '/hauptverein/vorstand/' },
        { text: 'Abteilungsleiter', href: '/hauptverein/abteilungsleiter/' },
        { text: 'Mitgliedsbeiträge', href: '/hauptverein/mitgliedsbeitraege/' },
        { text: 'Downloads', href: '/hauptverein/downloads/' },
        { text: 'Sponsoren', href: '/hauptverein/sponsoren/' },
        { text: 'Vereinsgaststätte', href: '/hauptverein/gaststaette/' },
      ],
    },
  ],
  Fußball: [
    {
      links: [
        { text: 'Übersicht', href: '/fussball/' },
        { text: 'Beiträge', href: '/fussball/beitraege/' },
        { text: 'Trainingszeiten', href: '/fussball/trainingszeiten/' },
      ],
    },
  ],
  Freizeitsport: [
    {
      links: [
        { text: 'Übersicht', href: '/freizeitsport/' },
        { text: 'Beiträge', href: '/freizeitsport/beitraege/' },
        { text: 'Abteilungsleitung', href: '/freizeitsport/abteilungsleitung/' },
        { text: 'Wochenplan Erwachsene', href: '/freizeitsport/wochenplan-erwachsene/' },
        { text: 'Wochenplan Kinder', href: '/freizeitsport/wochenplan-kinder/' },
      ],
    },
  ],
  Tischtennis: [
    {
      links: [
        { text: 'Übersicht', href: '/tischtennis/' },
        { text: 'Beiträge', href: '/tischtennis/beitraege/' },
        { text: 'Kontakt', href: '/tischtennis/kontakt/' },
      ],
    },
  ],
};

/** Seitenmenü eines Bereichs: feste Seiten + Mannschaften/Gruppen nach Gruppe */
export async function bereichsnav(abteilung: Abteilung): Promise<NavGruppe[]> {
  const gruppen = nachGruppe(await mannschaften(abteilung)).map(([titel, liste]) => ({
    titel,
    links: liste.map((m) => ({ text: m.data.name, href: mannschaftUrl(m) })),
  }));
  return [...STATISCH[abteilung], ...gruppen];
}

export { abteilungUrl, beitraegeUrl };
