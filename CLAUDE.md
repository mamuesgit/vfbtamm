# VfB Tamm 1920 e.V. – Neue Vereinswebsite

Kommunikation und Inhalte auf Deutsch.

## Git: immer direkt auf `main` (ausdrückliche Erlaubnis des Repo-Inhabers)

- Alle Änderungen direkt auf `main` committen und nach `origin main` pushen.
- **Das gilt auch, wenn die Cloud-Session einen eigenen Branch vorgibt** (z. B. `claude/…`): Diese Datei ist die
  ausdrückliche, dauerhafte Erlaubnis, stattdessen auf `main` zu arbeiten. Nicht nachfragen.
- Ablauf zu Beginn: `git fetch origin main && git checkout main && git pull origin main`.
  Liegen schon Commits auf dem Session-Branch, diese auf `main` übernehmen (Fast-Forward bzw. Rebase).
- Keine Feature-Branches, keine Pull Requests.

## Ziel

Ablösung der bisherigen WordPress-Seite (WordPress + Elementor) unter vfbtamm.de durch eine
statische Website ohne PHP, Datenbank und Plugins. Seit 08.11.2026 ist die neue Seite unter
https://www.vfbtamm.de online; die alte WordPress-Seite ist nur noch unter https://vfbtamm-de.prossl.de erreichbar.

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
- **Datenschutz:** Die Datenschutzerklärung (`src/content/seiten/datenschutz.md`) geht davon aus, dass
  die Website keine Cookies, kein Tracking und keine Inhalte von Drittanbietern einbindet (keine Google
  Fonts, keine eingebetteten Karten/Videos, keine externen Skripte). Schriften und Skripte lokal ausliefern;
  Anfahrt nur als Link oder statisches Bild. Wird davon abgewichen, die Datenschutzerklärung anpassen.
- **Bilder bleiben im Git-Repo.** Optimierung beim Upload durch Sveltia (WebP, max. ca. 1600 px Breite).
  Astro soll Bilder nicht aufwendig beim Build verarbeiten (Build-Zeit), Bilder werden direkt ausgeliefert.
- **Autoren (max. 3 Personen inkl. Admin)** dürfen im CMS nur Beiträge und Veranstaltungen bearbeiten. Beitrags-Felder:
  Titel, Datum, Abteilung (Pflicht, Dropdown), „Auf der Startseite hervorheben“ (Aufmacher), Titelbild,
  Bildergalerie, Text (Markdown, Toolbar auf Basics reduziert: fett, kursiv, Link, Liste).
- **Mannschaften, Trainer, Trainingszeiten, Sponsoren, Vorstand** sind NICHT im CMS sichtbar.
  Sie werden als Datendateien im Repo gepflegt (vom Admin, ändern sich ca. einmal pro Saison).
- **Beiträge haben keine Mannschafts-Zuordnung.** Die Mannschaft ergibt sich nur aus dem Titel
  (z. B. "Herren 1: …"); wichtig ist allein die Abteilung.

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

- `beitraege`: title, date, abteilung, aufmacher (bool, Standard false), cover?, gallery[]?, body
- `mannschaften`: name, abteilung, gruppe (z. B. Aktive/Jugend/Erwachsene), reihenfolge?,
  jahrgang?, teamfoto?, personen[] (rolle als Freitext, name, foto?, telefon?, email?),
  trainingszeiten[] (tag, von, bis?, ort?, hinweis?), beschreibung? (Markdown),
  links[] (titel, url – auf der Mannschaftsseite als Knopf, z. B. „Zur Mannschaft auf fussball.de“),
  galerie[] (bild, beschreibung?)
- Abteilungen: Hauptverein, Fußball, Freizeitsport, Tischtennis

Umsetzung in `src/content.config.ts`:
- Beiträge: `src/content/beitraege/*.md` (Dateiname = ID)
- Mannschaften: `src/data/mannschaften/*.yaml` (Dateiname = ID, z. B. `herren-1`, `tischtennis-herren`)
- Seiten: `src/content/seiten/*.md` (Verein, Leitsätze, Chronik, Gaststätte, Mitgliedsbeiträge,
  Impressum, Datenschutz) – Markdown mit Bildern im Text, nicht im CMS
- Gremien: `src/data/gremien/*.yaml` (Vorstand, Abteilungsleiter, Abteilungsleitung Freizeitsport,
  Kontakt Tischtennis) – titel, reihenfolge?, personen[], hinweis?
- Listen: `src/data/sponsoren.yaml`, `src/data/downloads.yaml` (Dateien in `public/downloads/`),
  `src/data/veranstaltungen.yaml` (im CMS pflegbar) – je eine Datei, laden mit `getEntry('sponsoren', 'sponsoren')` usw.
- Personen (Mannschaften und Gremien) haben dasselbe Schema: rolle, name, foto?, telefon?, email?, beschreibung?
- Personenfotos werden rund angezeigt: als quadratischen Kopf-und-Schulter-Ausschnitt ablegen
  (`public/uploads/personen/vorname-nachname.webp`, 300–600 px, WebP, ohne EXIF), Gesicht mittig im oberen Drittel.
  Steht eine Person auf mehreren Seiten, überall dasselbe (neueste) Foto verwenden.
- Abteilungsliste zentral in `src/data/abteilungen.ts`
- Fanshop: https://vfbtamm.fan12.de/ (Aufmacher-Beitrag „Unser Onlineshop“, Link im Fuß)
- Bildpfade sind Strings (z. B. `/uploads/...webp`), keine Astro-Bildverarbeitung

Alle Mannschaftsseiten nutzen ein einziges Template (Teamfoto, Trainer/Betreuer, Tabelle Trainingszeiten).

## Layout und URLs (Schritt 4)

- Vereinsslogan: „vielfältig familiär bewegend“ (im Kopf unter dem Vereinsnamen).
- Design: Vereinsfarben Schwarz/Weiß (reines `#000`), kühles Hellgrau `#EEF0EE` für Flächen. Weitere Farben
  nur kleinflächig und mit Bedeutung: Rasengrün `#1F8A4C` / Rot `#C4362E` als Ergebnis-Punkte (Sieg/Niederlage).
  Schrift: Archivo (variabel, lokal über `@fontsource-variable/archivo`, keine externen Fonts). Überschriften im
  breiten Schnitt (`font-stretch: 125%`) – angelehnt an „TAMM“ im Wappen –, Fließtext normal breit.
  Kopf schwarz mit Wappen in Negativ-Version (`public/logo-negativ.png`, aus `assets/vfb-logo-original.png`
  erzeugt); `public/logo.png` (positiv), `favicon.png`, `apple-touch-icon.png`. Styles zentral in
  `src/styles/global.css`.
- Startseite: Aufmacher-Karussell (Datum, Abteilung, Titel max. 2 Zeilen mit „…“, Bild – kein Textauszug) mit allen Beiträgen mit `aufmacher: true` (CMS: „Auf der Startseite
  hervorheben“), neueste zuerst; wischbar, Pfeile/Punkte, automatischer Wechsel alle 5 s, standardmäßig an
  (pausiert nur während Maus darüber/Tastaturfokus/Berührung, „Anhalten“-Knopf; bei „Bewegung reduzieren“
  ohne Gleitanimation). Ohne markierte Beiträge entfällt es.
  Der Fanshop ist ein eigener Aufmacher-Beitrag (`2026-11-07-unser-onlineshop.md`, Folienbild
  `public/uploads/beitraege/fanshop-aufmacher.webp`); das alte Banner wird nicht mehr angezeigt.
  Darunter „Spielberichte“-Leiste (Ergebnisse
  werden mit `spielergebnis()` in `src/lib/site.ts` aus Titeln wie „Herren 1: A – VfB Tamm 1:6 (1:3)“
  gelesen), Nachrichten in drei Spalten mit kleinen Vorschaubildern, „Mitmachen“, Sponsoren (Logos in
  Originalfarben, waagerechtes Karussell ohne Bedienelemente, rückt alle 3 s ein Logo weiter, pausiert bei Maus/Berührung; Reihenfolge wird bei jedem Seitenaufruf im
  Browser zufällig gemischt, auch auf `/hauptverein/sponsoren/` – `src/lib/mischen.ts`), Anfahrt (nur Link „Karte öffnen“ zu Google Maps) und Kontakt.
- Gestaltungsregeln: keine angehängten Pfeile „→“ an Linktexten, keine Trennpunkte „·“ in Metazeilen,
  keine Großbuchstaben-Etiketten, keine Schatten/Verläufe. Bewegung nur gezielt (Einblendung der ersten Aufmacher-Folie, Karussell-Wechsel),
  `prefers-reduced-motion` wird beachtet.
- `src/layouts/Layout.astro` (Kopf, Hauptnavigation, Fuß), `src/layouts/BereichLayout.astro`
  (Seitenkopf + Bereichsmenü links, auf dem Handy aufklappbar). Hilfsfunktionen in `src/lib/site.ts`,
  Bereichsmenüs in `src/lib/navigation.ts`.
- URLs: `/` · `/{abteilung}/` · `/{abteilung}/beitraege/` (+ `/2/`, `/3/` … je 20) ·
  `/{abteilung}/{mannschaft}/` (Tischtennis ohne Präfix, z. B. `/tischtennis/herren/`) ·
  `/beitraege/{id}/` · `/hauptverein/{verein,leitsaetze,chronik,gaststaette,mitgliedsbeitraege,vorstand,
  abteilungsleiter,downloads,sponsoren,veranstaltungen}/` · `/fussball/trainingszeiten/` ·
  `/freizeitsport/{abteilungsleitung,wochenplan-erwachsene,wochenplan-kinder}/` · `/tischtennis/kontakt/` ·
  `/impressum/` · `/datenschutz/`. Abteilungs-Slugs in `src/data/abteilungen.ts`.
- Trainingszeiten-Übersicht (Fußball) und Wochenpläne (Freizeitsport) werden aus den Mannschaftsdateien erzeugt.
- „Nächste Termine“ (Hauptverein) und das Ausgrauen vergangener Termine richten sich nach dem Build-Datum.
- Als App installierbar: `public/manifest.webmanifest` + Symbole `public/icon-192.png`, `icon-512.png`,
  `icon-maskable-512.png`, `apple-touch-icon.png` (Wappen negativ auf Schwarz). „Als App installieren“ im Fuß:
  Chrome/Edge/Android → eigener Installationsdialog (`beforeinstallprompt`), sonst kurze Anleitung (iPhone:
  Teilen → Zum Home-Bildschirm). Bewusst **kein Service Worker** (würde Daten auf dem Gerät speichern →
  Datenschutzerklärung müsste angepasst werden).

## Redaktionssystem (Schritt 5)

- Sveltia CMS unter `/admin/`: `public/admin/index.html` + `public/admin/config.yml`. Das CMS-Skript wird
  nicht von einem CDN geladen, sondern vor jedem Build aus `node_modules/@sveltia/cms` nach `public/admin/`
  kopiert (`scripts/cms-kopieren.mjs`, npm `prebuild`; die Kopie ist in `.gitignore`). Update: `npm update @sveltia/cms`.
- Im CMS sind nur die Collection `beitraege` und die Datei `src/data/veranstaltungen.yaml` (Collection `termine`,
  Liste mit Datum, bis?, Titel; Reihenfolge egal, die Seiten sortieren nach Datum). Neue Bilder → `public/uploads/beitraege/`, im Browser auf
  max. 1600 px verkleinert und als WebP gespeichert. Datum wird als `YYYY-MM-DDTHH:mm:ss` (lokale Zeit)
  gespeichert, Dateiname `JJJJ-MM-TT-titel.md`. Leere optionale Felder werden weggelassen.
- Konfiguration gegen das Schema prüfen: `node_modules/@sveltia/cms/schema/sveltia-cms.json`.
- Login: GitHub-OAuth über den Worker `sveltia-cms-auth` (eigenes Cloudflare-Projekt, nicht in diesem Repo),
  URL in `backend.base_url`. Worker-Variablen: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (verschlüsselt),
  `ALLOWED_DOMAINS`. Zugriff hat, wer im GitHub-Repo Schreibrechte hat (Collaborator).
- Das CMS selbst lädt im Redaktionsbereich Schriften (jsDelivr), Sprachdateien (unpkg) und eine
  GitHub-Statusmeldung – nur für Autoren, in der Datenschutzerklärung (Abschnitt 9) genannt.

## Weiterleitungen und Nachbearbeitung (Schritt 6)

- `public/_redirects` (Cloudflare, 301): alte WordPress-Adressen → neue Seiten. Erzeugt mit
  `npm run build && npm run wp:redirects` aus `migration/cache/` – nicht von Hand ändern. Das Skript prüft jedes
  Ziel gegen `dist/` und bricht bei fehlenden Zielen ab. Enthalten: alle Beiträge (`/JJJJ/MM/TT/slug/`), geänderte
  Seiten (Liste `SEITEN` im Skript), Original-Bilder der Mediathek (`/wp-content/uploads/…` → `/uploads/….webp`),
  alte Downloads, WordPress-Kategorien/Feeds (dynamische Regeln). Limit: 2000 statische + 100 dynamische Regeln.
  Testen: `npx wrangler dev` (zeigt „Parsed N valid redirect rules“).
- Wird eine Mannschaft/Seite umbenannt, `SEITEN` im Skript anpassen und neu erzeugen.
- `src/lib/links-ergaenzen.mjs` (Astro-Integration): ergänzt nach dem Build Links ohne Protokoll
  (`vfbtamm.de` → `https://…`, `name@domain.de` → `mailto:…`).
- **`npm run wp:convert-posts` nicht mehr routinemäßig ausführen:** Es überschreibt migrierte Beiträge mit dem
  WordPress-Stand (spätere Änderungen über das CMS gingen verloren). Es löscht keine Dateien mehr.

## Migration von WordPress

- Beiträge und Medien über die WordPress-REST-API holen – seit der Domain-Umstellung nur noch unter
  https://vfbtamm-de.prossl.de/wp-json/wp/v2/ (Netzwerkzugriff auf diesen Host muss in der Cloud-Umgebung erlaubt sein).
- Pro Bild nur die größte Version übernehmen, auf ca. 1600 px verkleinern, als WebP speichern.
  WordPress-Zwischengrößen ignorieren.
- WordPress-Kategorien auf die Abteilungen mappen (`psg-news` wird nicht übernommen,
  die PSG wurde 2023 aufgelöst). Keine Mannschafts-Zuordnung.
- Bilder: Beitragsbild bzw. erstes Bild im Text → `cover`, alle weiteren → `gallery`.
  Der Text bleibt bildfrei.
- Skripte: `npm run wp:fetch` (Rohdaten nach `migration/cache/`, nicht im Repo),
  `npm run wp:convert-posts` (Beiträge + Bilder nach `src/content/beitraege/` und `public/uploads/`),
  `npm run wp:bilder-nachladen` (in `src/data/**/*.yaml` referenzierte, noch fehlende Bilder aus der
  WordPress-Mediathek laden), `npm run wp:convert-pages` (einmaliger Export der Textseiten nach
  `src/content/seiten/`; die Dateien wurden danach von Hand nachbearbeitet – nicht erneut ausführen,
  sonst werden die Änderungen überschrieben).
- Mannschaftsseiten, Vorstand, Abteilungsleiter, Sponsoren, Downloads und Veranstaltungen wurden
  einmalig von Hand in YAML übertragen (zu uneinheitlich für einen Parser). Mitgliedsbeiträge nach der
  Beitragsordnung 2026 neu geschrieben (alte Seite veraltet). Übersichtsseiten (Startseite, Abteilungen)
  waren reine Beitragslisten und werden von Astro erzeugt.
  E-Mail-Adressen nur übernommen, wenn sie erkennbar zur Person passen; offene Punkte stehen in
  `migration/offene-punkte.md`.
  In der Cloud-Session mit `NODE_USE_ENV_PROXY=1` aufrufen. Der Webhoster blockiert Anfragen ohne
  Browser-ähnlichen User-Agent; die Skripte senden `Mozilla/5.0 (compatible; vfbtamm-migration)`.
- Alte Seiten, die nicht übernommen werden (nur Weiterleitung auf die übergeordnete Seite):
  PSG, B2-Jugend, Mädchen B, Mädchen C, Hygienekonzept, Vereinspielplan, Veranstaltungen-Unterseiten
  (Kategorien, Meine Buchungen, Schlagwörter, Veranstaltungsorte). Übernommen wird zusätzlich:
  Mitgliedsbeiträge (Hauptverein).
- Mannschaftsseiten (Elementor) in Datendateien überführen.
- **Weiterleitungen** für alte URLs einrichten (Beiträge: `/JJJJ/MM/TT/slug/`, Seiten wie
  `/fussball/d1_jugend/`), damit Links aus Google und Facebook weiter funktionieren.

## Reihenfolge

1. Astro-Grundgerüst + `wrangler.jsonc`, Deployment auf Cloudflare prüfen
2. Content Collections / Datenmodell
3. Export-Skript WordPress → Markdown/Datendateien, Bilder optimieren
4. Layouts: Startseite, Abteilungen, Mannschaftsseite, Beitragsliste, Beitrag
5. Sveltia CMS + OAuth-Worker, Test mit Autoren
6. Weiterleitungen, Impressum/Datenschutz prüfen, Domain umstellen (Domain seit 08.11.2026 auf Cloudflare,
   Website live unter https://www.vfbtamm.de – Details in `migration/domain-umstellung.md`)
