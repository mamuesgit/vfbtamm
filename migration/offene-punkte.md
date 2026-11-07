# Offene Punkte aus der Migration

Bitte prüfen und die Dateien in `src/data/` bzw. `src/content/seiten/` bei Bedarf anpassen.

## Vor dem Go-live zwingend

- **Datenschutzerklärung neu schreiben** (`src/content/seiten/datenschutz.md`). Die übernommene Fassung
  ist die WordPress-Standardvorlage (Kommentare, Gravatar, Login-Cookies) und passt nicht zur neuen Seite.
  Neu zu beschreiben sind u. a.: Hosting bei Cloudflare, Server-Logs, Sveltia CMS mit GitHub-Login (nur Autoren),
  externe Links (fussball.de, Fanshop). Die Google-Maps-Einbettung der Gaststätte wurde nicht übernommen.
- **Impressum prüfen** (`src/content/seiten/impressum.md`): Verweis „Telefonnummern siehe unter Kontaktseite“ –
  eine Kontaktseite gibt es nicht; Angaben zum vertretungsberechtigten Vorstand prüfen.

## Seiten und Kontakte

- **Mitgliedsbeiträge:** Die alte Seite (2022) war veraltet (z. B. 85 € statt 95 €). Die neue Seite basiert auf
  der Beitragsordnung 2026 (`public/downloads/beitragsordnung-2026.pdf`).
- **Vorstand:** Rolle „1. Vorsitzende“ als „1. Vorsitzender“ übernommen, „Veranstaltungsmanagment“ korrigiert.
- **Abteilungsleiter Fußball Aktive:** Name „Axel Nitsche-Pflumm“, Bilddatei heißt „Nitsche-Pfumm“ – Schreibweise prüfen.
- **Tischtennis-Kontakt:** Thomas Scheer hat zwei Telefonnummern (07141/913999 bei den Abteilungsleitern,
  0173 7208191 auf der TT-Kontaktseite). Jugendleiter und Jugendtrainer waren leer und fehlen.
- **Sponsoren:** Namen anhand der Logos vergeben, Webadressen nur, wo sie auf dem Logo stehen. Die
  Vereinsgaststätte steht (wie auf der alten Seite) mit in der Sponsorenliste.
- **Veranstaltungen:** Nur Termine 2026 vorhanden; für 2027 in `src/data/veranstaltungen.yaml` ergänzen.

# Mannschaftsseiten

## Nicht übernommene E-Mail-Adressen

Auf der alten Seite waren die E-Mail-Adressen nur als Symbol sichtbar. Viele davon gehören
offensichtlich zu anderen Personen (kopierte Elementor-Blöcke). Übernommen wurden nur Adressen,
die erkennbar zur Person passen oder allgemeine Vereinsadressen sind.

| Mannschaft | Person | Adresse auf der alten Seite |
|---|---|---|
| Herren 1 | Markus Schneider (Trainer) | denis-frank.flöter@vb-lb.de |
| Herren 1 | Michael Stein (Co-Trainer) | steffen_1004@yahoo.de |
| Herren 1 | Michael Walz (Co-Trainer) | denis-frank.flöter@vb-lb.de |
| Herren 1 | Frank Silzle (Spielleiter) | hf.kalmbach@web.de |
| Herren 2 | Mustafa Ulubel (Trainer) | mark.tessari@gmx.de |
| Herren 2 | Erik Nothacker (Co-Trainer) | m.walz56@gmail.com |
| Wandergruppe | Wolfgang Schuh | wdthoma@arcor.de |
| Wandergruppe | Siegfried Ihde | buhlinger@arcor.de |
| Tischtennis Herren | Jürgen Sautter | frank.silzle@mannheimer.de |

Außerdem gab es leere Personenblöcke ohne Namen, die weggelassen wurden:
Herren 2 (zweiter „Trainer“ mit denis-frank.flöter@vb-lb.de), Wandergruppe (Ansprechpartner
mit miriam@muellers-web.de), Torwarttraining („Torspieltrainer“ ohne Namen).

## Vermutlich veraltet

- **fussball.de-/mytischtennis-Links** zeigen auf die Saison 2022/23 (Herren 1, Herren 2, A-Jugend,
  C2-Jugend, Tischtennis Herren). Bei der Jugend ändert sich die Team-ID meist jede Saison.
- **Tischtennis Jugend** hat auf der alten Seite keinerlei Inhalt.
- **Tischtennis Herren** ohne Trainingszeiten.
- **Jahrgänge:** C1 und C2 haben beide 2012/13, D1 und D2 beide 2015 – so stand es auf der alten Seite.
- **Schwimmen:** Kontaktname war „Anja Knauth-Heize“, übernommen als „Anja Knauth-Henze“.

## Nicht übernommene Seiten (bekommen später eine Weiterleitung)

PSG, B2-Jugend, Mädchen B, Mädchen C, Hygienekonzept, Vereinspielplan,
Veranstaltungen-Unterseiten (Kategorien, Meine Buchungen, Schlagwörter, Veranstaltungsorte).

Die Übersichtsseiten „Trainingszeiten“ (Fußball) sowie „Wochenplan Erwachsene/Kinder“
(Freizeitsport) waren auf der alten Seite nur Screenshots. Sie werden auf der neuen Seite
aus den Trainingszeiten der Mannschaftsdateien erzeugt.

## Beiträge

- 2025-03-16 „Gymnastikgruppe Dienstag“: zwei Bilder fehlen bereits auf der alten Seite (HTTP 404).
