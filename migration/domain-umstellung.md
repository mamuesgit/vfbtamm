# Domain-Umstellung vfbtamm.de → Cloudflare

Stand der DNS-Zone beim Hoster (Sitecontrol `vfbtamm-de.prossl.de`, Nameserver `ns1/ns2/ns3.prodns.de`),
abgelesen am 07.11.2026.

**Wichtig:** E-Mail (`mail.vfbtamm.de`) und Website laufen beide auf dem Hosting-Paket des Hosters.
Das Paket darf nach der Umstellung **nicht gekündigt** werden, solange die Postfächer dort liegen.
Die alte WordPress-Seite bleibt außerdem unter https://vfbtamm-de.prossl.de erreichbar.

## Warum die Nameserver wechseln müssen

Eine eigene Domain lässt sich bei einem Cloudflare Worker nur einbinden, wenn Cloudflare die DNS-Zone
verwaltet. Die Domain-Registrierung (Vertrag) bleibt beim Hoster; nur die Nameserver werden auf
Cloudflare umgestellt. Dabei müssen **alle** bisherigen Einträge in Cloudflare vorhanden sein – sonst
funktioniert die E-Mail nicht mehr.

## Ablauf in zwei Phasen (sicher)

### Phase 1: DNS zu Cloudflare umziehen – die Website bleibt vorerst die alte

1. Cloudflare-Dashboard → **Add a domain** → `vfbtamm.de` → Plan **Free**. Cloudflare liest die
   vorhandenen Einträge ein.
2. Die eingelesenen Einträge mit der Tabelle unten vergleichen, fehlende ergänzen.
   **Alle Einträge auf „DNS only“ (graue Wolke) stellen**, auch `@` und `www`. Ein orange
   „Proxied“-Eintrag bei `mail`, `imap`, `smtp` usw. würde den E-Mail-Empfang unterbrechen.
3. Cloudflare zeigt zwei Nameserver an (z. B. `anna.ns.cloudflare.com`, `bob.ns.cloudflare.com`).
4. Falls beim Hoster **DNSSEC** aktiv ist: vorher abschalten lassen (sonst ist die Domain nach dem
   Wechsel nicht erreichbar). Im Sitecontrol war dazu nichts zu sehen; im Zweifel in der Mail mitfragen.
5. Hoster bitten, die Nameserver umzustellen (Vorlage unten). Im Sitecontrol gibt es dafür keinen
   eigenen Menüpunkt („eigene DNS-Servernamen“ ist etwas anderes).
6. Warten, bis Cloudflare die Zone als **Active** meldet (meist wenige Stunden, max. 24–48 h).
7. Testen: E-Mail an info@vfbtamm.de senden und von dort versenden, E-Mail-Programme (IMAP/SMTP)
   prüfen. Die Website ist in dieser Phase noch die alte WordPress-Seite.

### Phase 2: Website auf den Worker umschalten

1. In Cloudflare unter DNS die Einträge **`@` (A, 91.233.87.67)** und **`www` (A, 91.233.87.67)** löschen.
   Alle anderen Einträge bleiben!
2. Workers & Pages → `vfbtamm` → **Settings → Domains & Routes → Add → Custom domain**:
   `www.vfbtamm.de` und `vfbtamm.de` hinzufügen. Cloudflare legt die passenden Einträge und
   SSL-Zertifikate automatisch an (dauert einige Minuten).
3. Hauptadresse festlegen: Die alten Links (Google, Facebook) verwenden `https://www.vfbtamm.de/…`.
   Deshalb `www` als Hauptadresse behalten und `vfbtamm.de` darauf umleiten:
   Zone `vfbtamm.de` → **Rules → Redirect Rules → Vorlage „Redirect from root to WWW“** (301).
4. Testen (macht Claude): Startseite, Weiterleitungen alter Adressen, Bilder, CMS-Login unter
   `https://www.vfbtamm.de/admin/`.
5. Optional: In der GitHub-OAuth-App „VfB Tamm Redaktion“ die Homepage URL auf
   `https://www.vfbtamm.de` ändern (rein kosmetisch). `ALLOWED_DOMAINS` des Login-Workers enthält
   `vfbtamm.de` und `www.vfbtamm.de` bereits.

**Zurück im Notfall:** In Phase 2 einfach die Custom Domains im Worker entfernen und die beiden A-Einträge
`@` und `www` → `91.233.87.67` wieder anlegen. Dann ist sofort wieder die alte Seite online.

## Einträge, die in Cloudflare vorhanden sein müssen

Alle mit **Proxy-Status „DNS only“ (graue Wolke)**.

| Typ | Name | Inhalt / Ziel | Priorität | Hinweis |
|---|---|---|---|---|
| MX | `@` | `mail.vfbtamm.de` | 10 | E-Mail-Empfang |
| A | `mail` | `91.233.87.220` | | Mailserver |
| A | `@` | `91.233.87.67` | | alte Website – in Phase 2 löschen |
| A | `www` | `91.233.87.67` | | alte Website – in Phase 2 löschen |
| CNAME | `autoconfig` | `securemail-vfbtamm-de.prossl.de` | | Mail-Einrichtung (Thunderbird) |
| CNAME | `imap` | `mail.vfbtamm.de` | | |
| CNAME | `pop` | `mail.vfbtamm.de` | | |
| CNAME | `pop3` | `mail.vfbtamm.de` | | |
| CNAME | `smtp` | `mail.vfbtamm.de` | | |
| CNAME | `owncloud` | `owncloud1.prohost.de` | | ownCloud des Hosters – behalten, falls genutzt |
| TXT | `@` | `v=spf1 a mx ip4:91.233.84.0/22 ~all` | | SPF (Spamschutz) |
| TXT | `_dmarc` | `v=DMARC1; p=none` | | DMARC |
| SRV | `_autodiscover._tcp` | `securemail-vfbtamm-de.prossl.de`, Port 443 | 0 | Gewichtung 0 – Mail-Einrichtung (Outlook) |
| SRV | `_imap._tcp` | `.`, Port 0 | 0 | Gewichtung 0 – „kein unverschlüsseltes IMAP“ |
| SRV | `_imaps._tcp` | `securemail-vfbtamm-de.prossl.de`, Port 993 | 0 | Gewichtung 1 |
| SRV | `_pop._tcp` | `.`, Port 0 | 0 | Gewichtung 0 – „kein unverschlüsseltes POP“ |
| SRV | `_pops._tcp` | `securemail-vfbtamm-de.prossl.de`, Port 995 | 10 | Gewichtung 1 |
| SRV | `_submission._tcp` | `securemail-vfbtamm-de.prossl.de`, Port 587 | 5 | Gewichtung 0 |

Hinweise:
- Der SPF-Eintrag deckt mit `ip4:91.233.84.0/22` den Mailserver (91.233.87.220) ab und bleibt auch nach
  Phase 2 gültig.
- Die SRV-Einträge mit Ziel `.` bedeuten „Dienst nicht angeboten“. Lässt Cloudflare das Ziel `.` nicht
  zu, können diese beiden Einträge entfallen – sie sind für den Mailbetrieb nicht nötig.
- DKIM-Einträge gibt es derzeit keine.

## Vorlage: E-Mail an den Hoster

> Betreff: Nameserver-Änderung für vfbtamm.de
>
> Guten Tag,
>
> für unsere Domain **vfbtamm.de** (Account vfbtamm-de) möchten wir die Nameserver auf Cloudflare umstellen:
>
> - `<NAMESERVER 1 von Cloudflare>`
> - `<NAMESERVER 2 von Cloudflare>`
>
> Die Domain-Registrierung und das Hosting-Paket inklusive E-Mail-Postfächern sollen unverändert bei Ihnen
> bleiben; die DNS-Einträge für den Mailserver übernehmen wir in Cloudflare. Falls für die Domain DNSSEC
> aktiv ist, bitten wir, es im Zuge der Umstellung zu deaktivieren.
>
> Vielen Dank und viele Grüße
> VfB Tamm 1920 e.V.
