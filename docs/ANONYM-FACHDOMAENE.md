# Fachdomäne (Business Domain)

## Was dieses System ist

Ein **Bürgschafts-Backoffice** — eine Webanwendung, die von Sachbearbeitern betrieben wird, um Anträge zu empfangen, zu prüfen, zu genehmigen und auszustellen. Die Anträge werden von Partnern über ein externes Antragsportal eingereicht. Die Organisation aktiviert Partnerkonten nach manueller Prüfung, kontrolliert Bürgschaftslimits und Warenlisten, erteilt die Bürgschaft und stellt das fertige Dokument zur Abholung oder zum Postversand bereit.

---

## Was ein Bürgschaftsantrag ist

Partner beantragen eine **Bürgschaft** — eine Sicherheit, die die Organisation im Namen des Partners gegenüber einer Drittbehörde übernimmt. Die Bürgschaft deckt den erklärten Warenwert im festgelegten Gültigkeitszeitraum ab. Erfüllt der Partner die zugrundeliegende Verpflichtung nicht rechtzeitig, haftet die Organisation für die anfallenden Abgaben.

**Dokumentenform.** Nach Genehmigung **druckt die Organisation das Dokument** und händigt es dem Partner aus (Abholung oder Postversand). Der Partner erhält eine automatisierte E-Mail, sobald das Dokument bereitsteht. Vor der Nämlichkeitssicherung muss der Partner das Dokument **unterzeichnen**; nachträgliche Änderungen erfordern die Mitwirkung der ausstellenden Organisation. Das Dokument besteht aus einem Deckblatt und Volets (je ein Abreißblatt-Paar pro Verwendungsereignis). Die Bürgschaftssumme deckt 100 % des erklärten Warenwerts ab.

Geeignete Waren: langlebige Wirtschaftsgüter, Berufsausrüstung, Warenmuster, technische Geräte.
Ausgeschlossen: verderbliche Waren, Verbrauchsgüter, Werbegeschenke.
Gültigkeitsdauer: antragsbezogen festgelegt; in der Regel ein Jahr.

---

## Kernbegriffe

| Begriff | Was es ist |
|---|---|
| **Partner** | Im System registrierte juristische Person, identifiziert durch eine eindeutige Partnernummer. Hat Stammdaten, Adresse, Ansprechpartner und Bürgschaftslimit. |
| **Antrag** | Bürgschaftsantrag, eingereicht über das Antragsportal. Kommt als Ereignis an. Hat einen Lebenszyklus, eine Warenliste und einen Warenwert. |
| **Bürgschaft** | Haftung der Organisation gegenüber einer Drittbehörde im Namen des Partners. Bürgschaftssumme = 100 % des Warenwerts. Wird je genehmigtem Antrag erteilt. |
| **Bürgschaftslimit** | Maximale Gesamtbürgschaftssumme, die die Organisation für einen einzelnen Partner übernimmt. |
| **Warenliste** | Liste der Warenpositionen eines Antrags. |
| **Warenposition** | Eine Zeile in der Warenliste: Beschreibung, Menge, Warenwert und Nämlichkeitsmerkmale. |
| **Warenwert** | Gesamter erklärter Wert aller Waren eines Antrags. Bestimmt die Bürgschaftssumme. |
| **Nämlichkeitsmittel** | Jede Methode zur Feststellung, dass zurückgegebene Waren mit den ursprünglich verzeichneten identisch sind. In dieser Domäne: beschreibend/visuell (keine Transportsicherungen). Rechtsgrundlage: EU-DVO 2015/2447. |
| **Nämlichkeitsmerkmal** | Konkretes Nämlichkeitsmittel je Warenposition auf dem Deckblatt. Typen: (1) genaue Warenbezeichnung, (2) Serien- oder Fabrikationsnummer, (3) Fotografie, (4) angebrachte Kennzeichnung. Die Unterschrift des Partners macht das Deckblatt rechtsverbindlich. |
| **Verbund** | Benannte Zusammenfassung von Partnern mit gemeinsamem Gesamtlimit. Ein Partner gehört höchstens einem Verbund an. |
| **Gesamtlimit** | Kreditobergrenze für alle Partner eines Verbunds. Wird zusätzlich zum individuellen Bürgschaftslimit geprüft. |
| **Person** | Natürliche Person, die mit einem oder mehreren Partnern verknüpft ist (z. B. Geschäftsführer, Ansprechpartner). |
| **Zuständige Stelle** | Team oder Sachbearbeiter, der für einen Partner oder Antrag verantwortlich ist. |
| **Antragsportal** | Externes System, über das Partner Anträge einreichen. Partner registrieren sich und benennen einen Portal-Admin; die Organisation aktiviert das Konto nach manueller Registrierungsprüfung. Angebunden via API-Ereignisstrom. |
| **Portal-Admin** | Benannte Kontaktperson im Partnerunternehmen, die das Antragsportal-Konto verwaltet und weitere Nutzer anlegt. |
| **Bürgschein** | Finanzielles Sicherungsdokument des Rückbürgen, das der Organisation auf Anforderung zur Unterlegung des Bürgschaftslimits vorgelegt wird. |
| **Kontoabtretung** | Alternatives Sicherungsinstrument (Kontoabtretung), das auf Anforderung anstelle oder ergänzend zum Bürgschein vorgelegt wird. |

---

## Domänenübersicht

```
Partner registriert sich im Antragsportal
   └── Registrierungsprüfung (manuell) → Konto aktiviert
           │
Antragsportal ── Ereignis ──────────────────────────────→  Antrag
                                                               │
Partner ──── Partnernummer-Abgleich ───────────────────→  Partnerprüfung
   │                                                           │
   ├── Bürgschaftslimit (+ Bürgschein / Kontoabtretung) →  Limitprüfung
   └── Verbund → Gesamtlimit ──────────────────────────→  Limitprüfung
                                                               │
Antrag.Warenliste ─── Warenpositionen ─────────────────→  Warenprüfung
                                                               │
Sachbearbeiter ────────────────────────────────────────→  Genehmigung
                                                               │
                                                     Bürgschaft erteilt
                                                     Organisation druckt Dokument
                                                     automatische E-Mail → Partner
                                                     Partner unterschreibt → Nämlichkeitssicherung
```

---

## Antrag-Lebenszyklus

```
Eingang → Partnerprüfung → Limitprüfung → Warenprüfung → Genehmigt
                │                │               │
                └── Abgelehnt ───┴───────────────┘
                                                    └── Storniert
```

| Status | Auslöser |
|---|---|
| **Eingang** | Antragsereignis vom Antragsportal empfangen |
| **Partnerprüfung** | System gleicht Partnernummer mit dem Partnerregister ab |
| **Limitprüfung** | System prüft Warenwert gegen Bürgschaftslimit (und Gesamtlimit bei Verbund-Zugehörigkeit) |
| **Warenprüfung** | Sachbearbeiter prüft Warenliste auf geeignete Waren und Nämlichkeitsmerkmale |
| **Genehmigt** | Sachbearbeiter genehmigt; Bürgschaft erteilt; Organisation druckt Dokument; automatische E-Mail; Partner holt ab oder erhält per Post; Partner unterschreibt vor Nämlichkeitssicherung |
| **Abgelehnt** | Prüfung schlägt fehl oder Sachbearbeiter lehnt ab |
| **Storniert** | Partner zieht Antrag vor der Entscheidung zurück |

---

## Fachliche Kontexte in diesem Repository

| Domänenordner | Verantwortung | Beziehung |
|---|---|---|
| `partner-edit` | Schreibseite: Owner des Partner-Stammdatenschemas, Flyway-Migrationen, Bürgschaftslimit, PUT/GET per Partnernummer | upstream — maßgebliche Quelle |
| `partner-search` | Leseseite: Partner nach Name / Adresse / Alphacode finden; Dual-Engine (Postgres + Elasticsearch) | downstream conformist von `partner-edit` |
| `platform` | Shell-SPA, gemeinsame UI-Bibliothek, Micro-Frontend-Orchestrierung | Infrastruktur — keine Fachlogik |
| `greeting` | Framework-Vergleichslabor (Spring vs. Quarkus CRUD) | Demo — keine Fachdomäne |

### Nächste Domäne: `antrag`

Die Domäne `antrag` wird die vollständige Antragsverarbeitung verantworten:

- Empfang des Antragsereignisses vom Antragsportal
- Partnerprüfung (Partnernummer-Lookup via `partner-edit`)
- Limitprüfung (Bürgschaftslimit- und Gesamtlimit-Berechnung)
- Warenprüfung-Workflow, weitergeleitet an Zuständige Stelle
- Bürgschaftserteilung und Dokument-Ausgabe (Druck und Versand)
- Leseprojektionen für die Partnerdetailansicht

`antrag` wird ein **Customer-Supplier** von `partner-edit` sein: Es liest Partner-Stammdaten und das Bürgschaftslimit über den veröffentlichten Partnernummer-Schlüssel, besitzt aber kein Partnerschema.

---

## Glossar (maßgebliche Fachbegriffe)

Die hier aufgeführten Begriffe sind als Code-Bezeichner in allen Domänen zugelassen ([CLAUDE-14]). Domänenspezifische Erweiterungen stehen in der jeweiligen `DOMAIN.md`.

| Begriff | Englisch | Anmerkung |
|---|---|---|
| Antrag | application | Bürgschaftsantrag — im Code NICHT ins Englische übersetzen |
| Dokument | document | Von der Organisation ausgestelltes Dokument nach Bürgschaftsgenehmigung |
| Bürgschaft | guarantee | Haftung der Organisation gegenüber einer Drittbehörde im Namen des Partners |
| Bürgschaftslimit | guarantee limit | Partnerbezogene Obergrenze der ausstehenden Bürgschaftssumme |
| Bürgschaftssumme | guarantee amount | Verbürgter Wert eines Antrags (= Warenwert) |
| Bürgschein | guarantee bond | Sicherungsdokument des Rückbürgen; nur auf Anforderung |
| Kontoabtretung | account assignment | Alternatives Sicherungsinstrument; nur auf Anforderung |
| Warenliste | goods list | Liste der Warenpositionen eines Antrags |
| Warenposition | goods item | Einzelne Zeile in der Warenliste |
| Warenwert | goods value | Gesamter erklärter Warenwert eines Antrags |
| Nämlichkeitsmittel | identity measure | Methode zur Identitätsfeststellung von Waren (EU-DVO 2015/2447); in dieser Domäne: beschreibend/visuell |
| Nämlichkeitsmerkmal | identity feature | Konkretes Nämlichkeitsmittel je Warenposition: Warenbezeichnung, Serien-/Fabrikationsnummer, Fotografie oder Kennzeichnung |
| Nämlichkeitssicherung | identity securing | Eintrag der Nämlichkeitsmerkmale und Unterzeichnung des Deckblatts durch den Partner nach Dokument-Erhalt |
| Deckblatt | cover sheet | Titelseite des Dokuments mit Warenliste und Nämlichkeitsmerkmalen; vom Partner zu unterzeichnen |
| Volet | counterfoil sheet | Abreißblatt für ein Verwendungsereignis; je ein Paar pro Ereignis |
| Gesamtlimit | total limit | Kreditobergrenze für alle Partner eines Verbunds |
| Sachbearbeiter | case worker | Mitarbeiter, der einen Antrag bearbeitet |
| Zuständige Stelle | responsible unit | Team oder Person, die für einen Partner oder Antrag verantwortlich ist |
| Verbund | group | Benannte Partnergruppe mit gemeinsamem Gesamtlimit |
| Partner | business partner | Im System registrierte juristische Person, die Anträge stellt |
| Stammdaten | master data | Kerndaten eines Partners (nicht transaktional) |
| Eingang | receipt | Initialer Lebenszyklus-Status beim Eintreffen eines Antragsereignisses |
| Gültigkeitszeitraum | validity period | Gültigkeitsdauer einer Bürgschaft |
| Partnernummer | partner number | Eindeutige Kennung eines Partnerdatensatzes |
| Antragsnummer | application number | Eindeutige Kennung eines Antrags |
| Eröffnungsdatum | opening date | Datum der Partnerregistrierung |
| Antragsportal | application portal | Externes Self-Service-System für die Antragstellung; Kontoaktivierung durch Organisation nach Registrierungsprüfung |
| Portal-Admin | portal admin | Benannte Kontaktperson im Partnerunternehmen für die Kontoverwaltung |
| Registrierungsprüfung | registration check | Manuelle Prüfung der Partnerdaten vor Kontoaktivierung |

---

## Was dieses System nicht ist

- Kein öffentlich zugängliches Portal — die SPA wird ausschließlich von internen Mitarbeitern bedient. Partner nutzen das externe Antragsportal.
- Kein allgemeines Bürgschafts- oder Finanzsystem — der Scope beschränkt sich auf den Antrag-Lebenszyklus dieser Organisation und die dafür benötigten Partner- und Bürgschaftsdaten.
- Nicht zuständig für die physische Dokumentenlogistik — das System erfasst die Entscheidung und löst die Bürgschaftserteilung aus; Druck und Versand erfolgen außerhalb des Systems.
