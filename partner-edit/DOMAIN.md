# Partner-Edit Domain

## Purpose

Owns the **partner master data** for the business partner registry. Provides REST endpoints to read and update individual partner records. The PostgreSQL instance lives here; `partner-search` connects as a read-only participant.

## Bounded Context

Single-record operations on the `partner` table: fetch by `partnerNumber`, update all non-key fields. After a successful update, asynchronously notifies `partner-search` to re-index the changed partner in Elasticsearch.

## Glossary

German business terms authorized as code identifiers in this domain ([CLAUDE-14]). OpenAPI-generated files (`src/app/api/`) are exempt — their identifiers come from the upstream spec.

| German term | English gloss | Usage | Example identifier |
|---|---|---|---|
| Verbund | group, association | partner group entity linking multiple partners | `InternerVerbund`, `NormalerVerbund` |
| Hauptanschrift | main address | primary registered address of a partner | `HAUPTANSCHRIFT`, `PARTNER_HAUPTANSCHRIFT` |
| Zusatzanschrift | additional address | secondary address | `ZUSATZANSCHRIFT`, `PARTNER_ZUSATZANSCHRIFT` |
| Betriebsstaette | place of business | operational site address | `BETRIEBSSTAETTE` |
| Versandanschrift | shipping address | dispatch/mailing address | `VERSANDANSCHRIFT`, `VERSANDADRESSE` |
| Rechnungsanschrift | billing address | invoice address | `RECHNUNGSANSCHRIFT` |
| Postfachanschrift | PO box address | post office box address | `POSTFACHANSCHRIFT` |
| Geschaeftsfuehrer | managing director | legal representative role (GmbH) | `GESCHAEFTSFUEHRER` |
| Inhaber | owner | sole proprietor role | `INHABER` |
| Vorstand | board member | executive board role (AG) | `VORSTAND` |
| Ansprechpartner | contact person | designated contact at a partner | `PARTNER_ANSPRECHPARTNER` |
| Hauptnummer | main phone number | primary telephone | `HAUPTNUMMER` |
| Mobiltelefon | mobile phone | mobile telephone number | `MOBILTELEFON` |
| Vorankuendigung | pre-notification | advance notice communication channel | `EMAIL_VORANKUENDIGUNG` |
| Herr | Mr. | male salutation code | `Herr` |
| Frau | Mrs./Ms. | female salutation code | `Frau` |
| Dachgesellschaft | holding company | parent/umbrella company in a Verbund | `Dachgesellschaft` |
| Kreditwesengesetz | Banking Act | KWG regulatory classification flag | `kwgFlag` (JSDoc: `Kreditwesengesetz`) |

## Services

| Service | Framework | Route | Notes |
|---|---|---|---|
| `app-spring-partner-edit` | Spring Boot 3 + JPA | `/api/partner-edit/spring` priority 1000 | Owns Flyway migrations V1–V6 |
| `postgres-partner-edit` | PostgreSQL 15 | internal | Source of truth for all partner data |

## PostgreSQL Ownership

`postgres-partner-edit` is the authoritative store for all partner records. Flyway migrations run exclusively from `partner-edit/spring` (V1–V6). The `partner-search` backends connect with the read-only role `partner_search_ro` (created by V6) and do not run Flyway.

## API Shape

```
GET  /api/partner-edit/spring/{partnerNumber}   → DetailResponse (200) or 404
PUT  /api/partner-edit/spring/{partnerNumber}   → DetailResponse (200) or 404
```

`DetailResponse` fields: `partnerNumber`, `alphaCode`, `name1`, `name2`, `name3`, `firstname`, `street`, `houseNumber`, `postalCode`, `city`, `type`, `groupType`, `groupNumber`.

`EditRequest` fields: all `DetailResponse` fields except `partnerNumber`.

After PUT, `SearchNotifier` fires `POST https://gateway/api/partner-search/spring/index/partner/{partnerNumber}`. Failures are logged at WARN and do not affect the HTTP response.

## Deferred

- Angular micro-frontend — PARTNER-EDIT-002
