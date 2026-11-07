# VfB Tamm 1920 e.V. – Neue Vereinswebsite

Kommunikation und Inhalte auf Deutsch.

## Ziel

Ablösung der bisherigen WordPress-Seite (WordPress + Elementor) unter vfbtamm.de durch eine
statische Website ohne PHP, Datenbank und Plugins. Die alte Seite läuft weiter, bis die Domain
am Ende umgestellt wird.

## Stack (entschieden)

- **Astro** als Static Site Generator, reine statische Ausgabe nach `dist/`
- **Sveltia CMS** unter `/admin` mit GitHub-Backend (Repo `mamuesgit/vfbtamm`, Branch `main`)
- **GitHub-Login für das CMS** über den offiziellen `sveltia-cms-auth` Cloudflare Worker (OAuth)
- **Hosting:** Cloudflare Workers mit Static Assets, Konfiguration in `wrangler.jsonc`
  (`assets.directory: ./dist`, Name `vfbtamm`). Build: `npm run build`, Deploy: `npx wrangler deploy`.
  Preview-Builds für Nicht-main-Branches sind aktiv.
- Entwicklung läuft remote (Claude Code Cloud-Session), nicht lokal. Direkt auf `main` arbeiten,
  committen und pushen – keine Feature-Branches, keine Pull Requests.

## Wichtige Entscheidungen

- **Keine eigene Benutzerverwaltung / Auth bauen.** Login ausschließlich über das CMS.
- **Bilder bleiben im Git-Repo.** Optimierung beim Upload durch Sveltia (WebP, max. ca. 1600 px Breite).
  Astro soll Bilder nicht aufwendig beim Build verarbeiten (Build-Zeit), Bilder werden direkt ausgeliefert.
- **Autoren (max. 3 Personen inkl. Admin)** dürfen im CMS nur Beiträge bearbeiten. Felder:
  Titel, Datum, Abteilung (Pflicht, Dropdown), Mannschaft (optional, Dropdown), Titelbild,
  Bildergalerie, Text (Markdown, Toolbar auf Basics reduziert: fett, kursiv, Link, Liste).
- **Mannschaften, Trainer, Trainingszeiten, Sponsoren, Vorstand** sind NICHT im CMS sichtbar.
  Sie werden als Datendateien im Repo gepflegt (vom Admin, ändern sich ca. einmal pro Saison).
- Beiträge mit Mannschafts-Zuordnung erscheinen zusätzlich auf der jeweiligen Mannschaftsseite.

## Seitenstruktur (aus Analyse der alten Seite)

- **Startseite:** Neueste Beiträge in drei Blöcken (Hauptverein, Fußball, Freizeitsport),
  Sponsoren-Logos, Anfahrt (Aspergerstr. 3, Tamm), Banner zum Fanshop (vfbtamm.fan12.de)
- **Hauptverein:** Veranstaltungen, Beiträge, Verein, Leitsätze, Vorstand, Abteilungsleiter,
  Chronik, Gaststätte, Downloads, Sponsoren
- **Fußball:** Trainingszeiten (Übersicht), Beiträge
  - Aktive: Herren 1, Herren 2, Damen, Inklusionsteam, Alte Herren
  - Jugend: Torwarttraining, A, C1, C2, D1, D2, E1, E2, F1, F2, Bambini
- **Freizeitsport:** Abteilungsleiter, Beiträge, Wochenplan Erwachsene, Wochenplan Kinder
  - Erwachsene: Wandergruppe, Fitnessgymnastik, Seniorengymnastik, Nordic Walking,
    Wassergymnastik, Systema, Rehasport
  - Kinder/Jugend: Babyspaß, Kinderturnen, Schwimmen, Tanzen
- **Tischtennis:** Kontakt, Mannschaften Herren und Jugend
- **Basketball:** nur externer Link auf http://www.bgvfbtsv.de/
- Impressum, Datenschutzerklärung

## Datenmodell (Astro Content Collections)

- `beitraege`: title, date, abteilung, mannschaft?, cover?, gallery[]?, body
- `mannschaften`: name, abteilung, gruppe (z. B. Aktive/Jugend/Erwachsene), teamfoto?,
  personen[] (rolle: Trainer/Betreuer, name, foto?, telefon?, email?),
  trainingszeiten[] (tag, von, bis, ort?), beschreibung?
- Abteilungen: Hauptverein, Fußball, Freizeitsport, Tischtennis

Alle Mannschaftsseiten nutzen ein einziges Template (Teamfoto, Trainer/Betreuer, Tabelle Trainingszeiten).

## Migration von WordPress

- Beiträge und Medien über die WordPress-REST-API von https://www.vfbtamm.de/wp-json/wp/v2/ holen
  (Netzwerkzugriff auf vfbtamm.de muss in der Cloud-Umgebung erlaubt sein).
- Pro Bild nur die größte Version übernehmen, auf ca. 1600 px verkleinern, als WebP speichern.
  WordPress-Zwischengrößen ignorieren.
- WordPress-Kategorien auf die Abteilungen mappen; Mannschaft wenn möglich aus dem Titel
  ableiten (Muster z. B. "Herren 1: ...", "E1-Jugend: ...").
- Mannschaftsseiten (Elementor) in Datendateien überführen.
- **Weiterleitungen** für alte URLs einrichten (Beiträge: `/JJJJ/MM/TT/slug/`, Seiten wie
  `/fussball/d1_jugend/`), damit Links aus Google und Facebook weiter funktionieren.

## Reihenfolge

1. Astro-Grundgerüst + `wrangler.jsonc`, Deployment auf Cloudflare prüfen
2. Content Collections / Datenmodell
3. Export-Skript WordPress → Markdown/Datendateien, Bilder optimieren
4. Layouts: Startseite, Abteilungen, Mannschaftsseite, Beitragsliste, Beitrag
5. Sveltia CMS + OAuth-Worker, Test mit Autoren
6. Weiterleitungen, Impressum/Datenschutz prüfen, Domain umstellen
