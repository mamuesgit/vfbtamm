# Offene Punkte aus der Migration

Bitte prüfen und die Dateien in `src/data/` bzw. `src/content/seiten/` bei Bedarf anpassen.

## Vor dem Go-live

- **Datenschutzerklärung** wurde für die neue Seite neu geschrieben (`src/content/seiten/datenschutz.md`,
  Stand November 2026). Bitte vom Vorstand prüfen lassen, insbesondere:
  - Der Auftragsverarbeitungsvertrag mit Cloudflare ist bei Cloudflare Bestandteil der Nutzungsbedingungen
    (Customer DPA) – im Cloudflare-Konto unter Einstellungen bestätigen bzw. ablegen.
  - Kein Datenschutzbeauftragter angegeben. Pflicht erst, wenn in der Regel mind. 20 Personen ständig
    mit der Verarbeitung personenbezogener Daten beschäftigt sind (§ 38 BDSG) – vom Verein zu prüfen.
- **Impressum:** Hinweis „Telefonnummern siehe unter Kontaktseite“ entfernt, E-Mail-Adresse als echter Link,
  veralteter Link-Haftungsausschluss (LG Hamburg 1998) und „Webmaster“-Formulierungen ersetzt.
  Noch offen (Vorstand):
  - Vertretungsberechtigten Vorstand nach § 26 BGB nennen (laut Satzung § 11: Vorsitzender, 1. und 2.
    stellvertretender Vorsitzender, Vorstand für Finanzen). Wer ist aktuell 1./2. Stellvertreter?
  - Verantwortliche Person für redaktionelle Inhalte nach § 18 Abs. 2 MStV (Name und Anschrift).
  - Umsatzsteuer-ID DE 146 121 889 bestätigen.

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

- **fussball.de-Links** sind für Saison 2026/27 aktualisiert (Herren 1/2, Damen, A, C1/C2, D1/D2, E1/E2;
  Quelle: gespeicherte Vereinsseite). Zu jeder neuen Saison neu eintragen – die Adresse enthält die Saison
  (`/saison/2627/`), und bei der Jugend ändern sich die Team-IDs. F-Jugend, Bambini, AH, Inklusionsteam und
  Torwarttraining haben keine fussball.de-Mannschaftsseite.
- **mytischtennis-Link** (Tischtennis Herren) zeigt noch auf die Saison 2022/23.
- **Tischtennis Jugend** hat auf der alten Seite keinerlei Inhalt.
- **Tischtennis Herren** ohne Trainingszeiten.
- **Jahrgänge:** C1 und C2 haben beide 2012/13, D1 und D2 beide 2015 – so stand es auf der alten Seite.
- **Schwimmen:** Kontaktname war „Anja Knauth-Heize“, übernommen als „Anja Knauth-Henze“.

## Personenfotos

Alle Personenfotos wurden auf quadratische Kopf-und-Schulter-Ausschnitte geprüft (`public/uploads/personen/`).
Nur in sehr kleiner Auflösung vorhanden – bei Gelegenheit neue Fotos besorgen:
- Jürgen Seel (Herren 1, Betreuer): Original nur 92 × 128 px
- Florian Ziegler (Herren 1, Physiotherapeut): Original nur 115 × 176 px

## Nicht übernommene Seiten (bekommen später eine Weiterleitung)

PSG, B2-Jugend, Mädchen B, Mädchen C, Hygienekonzept, Vereinspielplan,
Veranstaltungen-Unterseiten (Kategorien, Meine Buchungen, Schlagwörter, Veranstaltungsorte).

Die Übersichtsseiten „Trainingszeiten“ (Fußball) sowie „Wochenplan Erwachsene/Kinder“
(Freizeitsport) waren auf der alten Seite nur Screenshots. Sie werden auf der neuen Seite
aus den Trainingszeiten der Mannschaftsdateien erzeugt.

## Beiträge

- 2025-03-16 „Gymnastikgruppe Dienstag“: zwei Bilder fehlen bereits auf der alten Seite (HTTP 404).
