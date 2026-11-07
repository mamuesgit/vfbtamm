import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { ABTEILUNGEN } from './data/abteilungen';

/**
 * Bildpfade sind einfache Strings (z. B. "/uploads/2026/sommerfest.webp").
 * Bilder werden bewusst nicht von Astro verarbeitet, sondern direkt ausgeliefert
 * (Optimierung passiert beim Upload im CMS bzw. im Migrationsskript).
 */
const bildpfad = z.string().min(1);

/** Ansprechperson (Trainer, Vorstand, Abteilungsleitung …) */
const person = z.object({
  // z. B. "Trainer", "Co-Trainer", "Übungsleiterin", "Vorstand Finanzen"
  rolle: z.string().min(1),
  name: z.string().min(1),
  foto: bildpfad.optional(),
  telefon: z.string().optional(),
  email: z.email().optional(),
  beschreibung: z.string().optional(),
});

/** Uhrzeit im Format HH:MM, z. B. "18:30". */
const uhrzeit = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Uhrzeit im Format HH:MM angeben');

/**
 * Beiträge: Markdown-Dateien in src/content/beitraege/, werden im CMS gepflegt.
 * Dateiname = ID, z. B. "2026-05-14-sommerfest.md".
 */
const beitraege = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/beitraege' }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    abteilung: z.enum(ABTEILUNGEN),
    cover: bildpfad.optional(),
    gallery: z.array(bildpfad).optional(),
  }),
});

/**
 * Mannschaften und Gruppen: YAML-Dateien in src/data/mannschaften/,
 * vom Admin direkt im Repo gepflegt (nicht im CMS).
 * Dateiname = ID, z. B. "herren-1.yaml", "e1-jugend.yaml", "wassergymnastik.yaml".
 */
const mannschaften = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/data/mannschaften' }),
  schema: z.object({
    name: z.string().min(1),
    abteilung: z.enum(ABTEILUNGEN),
    // Untergruppe innerhalb der Abteilung, z. B. "Aktive", "Jugend", "Erwachsene", "Kinder/Jugend".
    gruppe: z.string().min(1),
    // Steuert die Reihenfolge in Menüs und Übersichten (kleiner = weiter oben).
    reihenfolge: z.number().int().optional(),
    // Nur Jugend, z. B. "2015" oder "2012/13"
    jahrgang: z.string().optional(),
    teamfoto: bildpfad.optional(),
    personen: z.array(person).default([]),
    trainingszeiten: z
      .array(
        z.object({
          tag: z.enum(['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']),
          von: uhrzeit,
          // Fehlt bei offenen Angaben wie "ab 14:00 Uhr"
          bis: uhrzeit.optional(),
          ort: z.string().optional(),
          // z. B. "alle 2 Wochen", "E-Jugend", "Kinder 4–5 Jahre", "April–Oktober"
          hinweis: z.string().optional(),
        }),
      )
      .default([]),
    // Freitext (Markdown)
    beschreibung: z.string().optional(),
    // Externe Links, z. B. die Mannschaft bei fussball.de
    links: z
      .array(z.object({ titel: z.string().min(1), url: z.url() }))
      .default([]),
    // Weitere Bilder, z. B. von Turnieren und Ausflügen
    galerie: z
      .array(z.object({ bild: bildpfad, beschreibung: z.string().optional() }))
      .default([]),
  }),
});

/**
 * Statische Seiten (Verein, Chronik, Impressum …): Markdown in src/content/seiten/,
 * vom Admin im Repo gepflegt (nicht im CMS). Dateiname = ID.
 */
const seiten = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/seiten' }),
  schema: z.object({
    title: z.string().min(1),
  }),
});

/**
 * Gremien und Kontaktlisten (Vorstand, Abteilungsleiter …): YAML in src/data/gremien/.
 */
const gremien = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/data/gremien' }),
  schema: z.object({
    titel: z.string().min(1),
    reihenfolge: z.number().int().optional(),
    personen: z.array(person).default([]),
    hinweis: z.string().optional(),
  }),
});

// Einzelne Listen-Dateien in src/data/ (je eine Datei = ein Eintrag mit einer Liste)
const liste = (datei: string, schema: z.ZodType) =>
  defineCollection({ loader: glob({ pattern: datei, base: './src/data' }), schema });

const sponsoren = liste(
  'sponsoren.yaml',
  z.object({
    sponsoren: z.array(z.object({ name: z.string().min(1), logo: bildpfad, url: z.url().optional() })),
  }),
);

const downloads = liste(
  'downloads.yaml',
  z.object({
    downloads: z.array(z.object({ titel: z.string().min(1), datei: z.string().startsWith('/') })),
  }),
);

const veranstaltungen = liste(
  'veranstaltungen.yaml',
  z.object({
    veranstaltungen: z.array(
      z.object({ datum: z.coerce.date(), bis: z.coerce.date().optional(), titel: z.string().min(1) }),
    ),
  }),
);

export const collections = { beitraege, mannschaften, seiten, gremien, sponsoren, downloads, veranstaltungen };
