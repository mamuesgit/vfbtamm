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
    teamfoto: bildpfad.optional(),
    personen: z
      .array(
        z.object({
          // z. B. "Trainer", "Co-Trainer", "Betreuer", "Übungsleiterin"
          rolle: z.string().min(1),
          name: z.string().min(1),
          foto: bildpfad.optional(),
          telefon: z.string().optional(),
          email: z.email().optional(),
        }),
      )
      .default([]),
    trainingszeiten: z
      .array(
        z.object({
          tag: z.enum(['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']),
          von: uhrzeit,
          bis: uhrzeit,
          ort: z.string().optional(),
        }),
      )
      .default([]),
    beschreibung: z.string().optional(),
  }),
});

export const collections = { beitraege, mannschaften };
