# Fachdomäne (Business Domain)

## Was dieses System ist

Ein **IHK-Carnet-A.T.A.-Backoffice** — eine Webanwendung, die von IHK-Sachbearbeitern betrieben wird, um Carnet-A.T.A.-Anträge zu empfangen, zu prüfen, zu genehmigen und auszudrucken. Die Anträge werden von Partnern über **www.e-ata.de** (Antragsportal) eingereicht. Die IHK aktiviert Partnerkonten nach manueller Prüfung, kontrolliert Bürgschaftslimits und Warenlisten, erteilt die Bürgschaft und druckt das fertige Carnet zur Abholung oder zum Postversand aus.

---

## Was ein Carnet A.T.A. ist

Ein Carnet A.T.A. („Admission Temporaire / Temporary Admission") ist ein international anerkanntes Zolldokument — ein **Reisepass für Waren** — das die vorübergehende zollfreie Aus- und Wiedereinfuhr von Waren in über 75 Länder ermöglicht.

**Dokumentenform.** Das Carnet ist ein **von der IHK gedrucktes Heft**, das dem Partner ausgehändigt wird (Abholung bei der IHK oder Postversand). Der Partner erhält eine automatisierte E-Mail, sobald das Carnet ausgestellt ist. Vor der Nämlichkeitssicherung muss der Partner das Carnet **unterzeichnen**; nachträgliche Änderungen erfordern die Mitwirkung der ausstellenden IHK. Das Heft besteht aus einem Deckblatt (mit der Warenliste) und Volets — farblich unterschiedliche Abreißblätter, je ein Paar pro Grenzübergang. Ein papierbasierter Antragsweg ist übergangsweise weiterhin möglich. Die ICC strebt eine vollständige Digitalisierung (eCarnet) an.

**Bürgschaft.** Die IHK stellt gegenüber den ausländischen Zollbehörden die Bürgschaft für den Partner aus. Die Bürgschaftssumme deckt 100 % des erklärten Warenwerts ab (zuzüglich eines Strafaufschlags von 10 %, der vom Rückbürgen Allianz Trade gehalten wird). Werden die Waren nicht innerhalb des Gültigkeitszeitraums wieder ausgeführt, haftet die IHK für die Einfuhrabgaben des Bestimmungslandes.

Geeignete Waren: Messegüter, Berufsausrüstung, Warenmuster, Film-/Presseausrüstung.
Ausgeschlossen: verderbliche Waren, Verbrauchsgüter, Werbegeschenke.
Gültigkeitsdauer: ein Jahr ab Ausstellungsdatum.

---

## Kernbegriffe

| Begriff | Was es ist |
|---|---|
| **Partner** | Im System registrierte juristische Person, identifiziert durch eine eindeutige Partnernummer. Hat Stammdaten, Adresse, Ansprechpartner und Bürgschaftslimit. |
| **Carnet-Antrag** | Carnet-A.T.A.-Antrag, eingereicht über das Antragsportal. Kommt als Ereignis an. Hat einen Lebenszyklus, eine Warenliste und einen Warenwert. |
| **Bürgschaft** | Haftung der IHK gegenüber dem ausländischen Zoll für Einfuhrabgaben, falls Waren nicht rechtzeitig rückgeführt werden. Bürgschaftssumme = 100 % des Warenwerts. Rückbürge: Allianz Trade (10 % Strafpuffer). |
| **Bürgschaftslimit** | Maximale Gesamtbürgschaftssumme, die die IHK für einen einzelnen Partner übernimmt. |
| **Warenliste** | Liste der Warenpositionen eines Antrags. |
| **Warenposition** | Eine Zeile in der Warenliste: Beschreibung, Menge, Warenwert und Nämlichkeitsmerkmale. |
| **Warenwert** | Gesamter erklärter Wert aller Waren eines Antrags. Bestimmt die Bürgschaftssumme. |
| **Nämlichkeitsmittel** | Jede Methode zur Feststellung, dass wiedereingeführte Waren mit den ausgeführten identisch sind. Für Carnets: beschreibend/visuell (keine Transportsicherungen). Rechtsgrundlage: EU-DVO 2015/2447. |
| **Nämlichkeitsmerkmal** | Konkretes Nämlichkeitsmittel je Warenposition auf dem Deckblatt. Typen: (1) genaue Warenbezeichnung, (2) Serien- oder Fabrikationsnummer, (3) Fotografie, (4) eingenähte oder angebrachte Kennzeichnung. Die Unterschrift des Partners macht das Deckblatt rechtsverbindlich. |
| **Verbund** | Benannte Zusammenfassung von Partnern mit gemeinsamem Gesamtlimit. Ein Partner gehört höchstens einem Verbund an. |
| **Gesamtlimit** | Kreditobergrenze für alle Partner eines Verbunds. Wird zusätzlich zum individuellen Bürgschaftslimit geprüft. |
| **Person** | Natürliche Person, die mit einem oder mehreren Partnern verknüpft ist (z. B. Geschäftsführer, Ansprechpartner). |
| **Zuständige Stelle** | IHK-Team oder Sachbearbeiter, der für einen Partner oder Antrag verantwortlich ist. |
| **Antragsportal** | **www.e-ata.de** — externes System, über das Partner Carnet-Anträge einreichen. Partner registrieren sich und benennen einen eCarnet-Admin; die IHK aktiviert das Konto nach manueller Registrierungsprüfung. Angebunden via API-Ereignisstrom. |
| **eCarnet-Admin** | Benannte Kontaktperson im Partnerunternehmen, die das e-ata.de-Konto verwaltet und weitere Nutzer anlegt. |
| **Bürgschein** | Finanzielles Sicherungsdokument von Allianz Trade, das der IHK auf Anforderung zur Unterlegung des Bürgschaftslimits vorgelegt wird. |
| **Kontoabtretung** | Alternatives Sicherungsinstrument (Kontoabtretung), das auf IHK-Anforderung anstelle oder ergänzend zum Bürgschein vorgelegt wird. |

---

## Domänenübersicht

```
Partner registriert sich bei e-ata.de
   └── IHK-Registrierungsprüfung (manuell) → Konto aktiviert
           │
Antragsportal (e-ata.de) ── Ereignis ──────────────────→  Carnet-Antrag
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
                                                     IHK druckt Carnet
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
| **Genehmigt** | Sachbearbeiter genehmigt; Bürgschaft erteilt; IHK druckt Carnet; automatische E-Mail; Partner holt ab oder erhält per Post; Partner unterschreibt vor Nämlichkeitssicherung |
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

Die Domäne `antrag` wird die vollständige Carnet-Antragsverarbeitung verantworten:

- Empfang des Antragsereignisses vom Antragsportal
- Partnerprüfung (Partnernummer-Lookup via `partner-edit`)
- Limitprüfung (Bürgschaftslimit- und Gesamtlimit-Berechnung)
- Warenprüfung-Workflow, weitergeleitet an Zuständige Stelle
- Bürgschaftserteilung und Carnet-Ausgabe (Druck und Versand)
- Leseprojektionen für die Partnerdetailansicht

`antrag` wird ein **Customer-Supplier** von `partner-edit` sein: Es liest Partner-Stammdaten und das Bürgschaftslimit über den veröffentlichten Partnernummer-Schlüssel, besitzt aber kein Partnerschema.

---

## Glossar (maßgebliche Fachbegriffe)

Die hier aufgeführten Begriffe sind als Code-Bezeichner in allen Domänen zugelassen ([CLAUDE-14]). Domänenspezifische Erweiterungen stehen in der jeweiligen `DOMAIN.md`.

| Begriff | Englisch | Anmerkung |
|---|---|---|
| Antrag | application | Konkret ein Carnet-A.T.A.-Antrag — im Code NICHT ins Englische übersetzen |
| Carnet | carnet | Von der IHK gedrucktes Zolldokument (Heft: Deckblatt + Volets) |
| Bürgschaft | guarantee | Haftung der IHK gegenüber ausländischen Zollbehörden |
| Bürgschaftslimit | guarantee limit | Partnerbezogene Obergrenze der ausstehenden Bürgschaftssumme |
| Bürgschaftssumme | guarantee amount | Verbürgter Wert eines Antrags (= Warenwert) |
| Bürgschein | guarantee bond | Allianz-Trade-Sicherungsdokument; nur auf IHK-Anforderung |
| Kontoabtretung | account assignment | Alternatives Sicherungsinstrument; nur auf IHK-Anforderung |
| Warenliste | goods list | Liste der Warenpositionen eines Antrags |
| Warenposition | goods item | Einzelne Zeile in der Warenliste |
| Warenwert | goods value | Gesamter erklärter Warenwert eines Antrags |
| Nämlichkeitsmittel | identity measure | Methode zur Identitätsfeststellung von Waren (EU-DVO 2015/2447); für Carnets: beschreibend/visuell |
| Nämlichkeitsmerkmal | identity feature | Konkretes Nämlichkeitsmittel je Warenposition: Warenbezeichnung, Serien-/Fabrikationsnummer, Fotografie oder Kennzeichnung |
| Nämlichkeitssicherung | identity securing | Eintrag der Nämlichkeitsmerkmale und Unterzeichnung des Deckblatts durch den Partner nach Carnet-Erhalt |
| Deckblatt | cover sheet | Titelseite des Carnet-Hefts mit der Warenliste und Nämlichkeitsmerkmalen; vom Partner zu unterzeichnen |
| Volet | counterfoil sheet | Farbiges Abreißblatt für einen Grenzübergang; je ein Paar pro Übergang |
| Gesamtlimit | total limit | Kreditobergrenze für alle Partner eines Verbunds |
| Sachbearbeiter | case worker | IHK-Mitarbeiter, der einen Antrag bearbeitet |
| Zuständige Stelle | responsible unit | Team oder Person, die für einen Partner oder Antrag verantwortlich ist |
| Verbund | group | Benannte Partnergruppe mit gemeinsamem Gesamtlimit |
| Partner | business partner | Im System registrierte juristische Person, die Carnet-Anträge stellt |
| Stammdaten | master data | Kerndaten eines Partners (nicht transaktional) |
| Eingang | receipt | Initialer Lebenszyklus-Status beim Eintreffen eines Antragsereignisses |
| Gültigkeitszeitraum | validity period | Gültigkeitsdauer eines Carnets (ein Jahr) |
| Partnernummer | partner number | Eindeutige Kennung eines Partnerdatensatzes |
| Antragsnummer | application number | Eindeutige Kennung eines Antrags |
| Eröffnungsdatum | opening date | Datum der Partnerregistrierung |
| Antragsportal | application portal | www.e-ata.de — externes Self-Service-System für die Antragstellung; Kontoaktivierung durch IHK nach Registrierungsprüfung |
| eCarnet-Admin | portal admin | Benannte Kontaktperson im Partnerunternehmen für die Kontoverwaltung bei e-ata.de |
| Registrierungsprüfung | registration check | Manuelle IHK-Prüfung der Partnerdaten vor Kontoaktivierung |

---

## Was dieses System nicht ist

- Kein öffentlich zugängliches Portal — die SPA wird ausschließlich von IHK-Mitarbeitern bedient. Partner nutzen das externe Antragsportal.
- Kein allgemeines Zollsystem — der Scope beschränkt sich auf Carnet-A.T.A.-Anträge und die dafür benötigten Partner- und Bürgschaftsdaten.
- Nicht zuständig für die physische Carnet-Logistik — das System erfasst die Entscheidung und löst die Bürgschaftserteilung aus; Druck und Versand erfolgen außerhalb des Systems.
