# Loans Domain

## Purpose

A **loan contract search microfrontend**. Users search for loan contracts using a rich set of criteria (contract number, partner number, name, date of birth, postal code, vehicle plate, etc.) and view results in a table. The frontend is a Native Federation remote loaded by the platform shell.

## Bounded Context

Frontend-only domain. There is no backend service in this folder — all data access goes through the API gateway (`/loans/*`) to a backend service deployed elsewhere.

## Services

| Service | Technology | Route | Notes |
|---|---|---|---|
| `loans` (frontend) | Angular + Nginx | `/loans` (strip prefix) | MFE remote, priority 120 |

## API Routes Consumed

All calls route through Traefik at `/loans`:

```
GET  /loans/contract-search   query params: contract/partner/name/dob/postal/city/plate
                               required: client="traefik-microstack" 
                               → list of contract results

GET  /loans/contract/{contractNumber}   → single contract detail

POST /loans/contract                    → create or retrieve contract (idempotent by client+code)
```

All requests include an OAuth2 Bearer token (auth handled by shell via Native Federation shared singleton).

**The API client (`src/app/api/`) is auto-generated from OpenAPI — do not hand-edit it.**

## Search Validation

At least one field with a minimum of 3 characters must be filled before submitting (`atLeastOneFieldValidator`). Wildcards (`*`) are supported on most text fields.

## Key Architectural Decisions

- **MFE remote**: Exposes `./Component` and `./Routes` via Native Federation. Consumed by the platform shell at `/:client/loans`.
- **Contract-first API**: The `LoanGatewayService` and all DTOs/validators are generated from the OpenAPI spec. Schema changes must be made upstream, then regenerated.
- **Multi-tenancy placeholder**: The `client` param is hardcoded to `"traefik-microstack"`.
- **i18n scaffolded**: Translation keys follow `loans.search.fields.*` convention. `de.json` / `en.json` files exist but are currently empty — populate before shipping user-visible strings.
