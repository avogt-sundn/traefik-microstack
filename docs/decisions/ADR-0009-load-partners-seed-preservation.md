# ADR-0009: load-partners.sh uses targeted DELETE, not TRUNCATE, for seed preservation

**Date**: 2026-04-16  
**Status**: Accepted  
**Session context**: Branch `feature/partner-infra-consolidation`, commit acb27fa — fix `load-partners.sh`

## Context

`load-partners.sh` bulk-reloads partner data by stopping the stack, clearing the database, and re-seeding with generated records. The script used `TRUNCATE TABLE partner RESTART IDENTITY CASCADE` to empty the table before loading.

The partner database contains two classes of rows:
- **Seed data** (partner_number < 1,000,000): inserted by Flyway V2/V3/V4 migrations. These are the partners that e2e tests look up by specific partner number.
- **Bulk generated data** (partner_number ≥ 1,000,000): inserted by either the V5 Flyway migration or `load-partners.sh` itself.

A TRUNCATE destroyed both classes, then `load-partners.sh` re-inserted only generated data. After a `load-partners.sh` run, seed records were absent — e2e tests that relied on them failed.

The failure was non-obvious: `make pw-run` passed immediately after `make up` (Flyway seeds present), but failed after any `load-partners.sh` run until the stack was fully torn down and recreated.

## Decision

Replace `TRUNCATE TABLE partner RESTART IDENTITY CASCADE` with:
```sql
DELETE FROM partner WHERE partner_number >= 1000000;
```

This removes only bulk-generated data, leaving all Flyway seed rows intact.

Also corrected in the same commit: the Elasticsearch container name was hardcoded as `elasticsearch-spring-partner` (the pre-PARTNER-ES-018 name). Updated to `elasticsearch-partner` to match the consolidated shared service name.

## Consequences

- `load-partners.sh` can now be run safely at any time without breaking e2e tests.
- Seed data is always present after a bulk reload — no need to recreate the stack to restore test fixtures.
- **Naming fragility:** Container names are still hardcoded (`traefik-microstack-elasticsearch-partner-1`). A future project rename or service rename will break the script silently. Mitigation: grep `<domain>/scripts/` for container names after any Compose service rename.

## Token efficiency note

This bug required re-running e2e tests multiple times to diagnose the source (was it the ES index, the Quarkus app, or the missing seed data?). Documenting the `partner_number < 1,000,000 = seed` / `>= 1,000,000 = generated` boundary means future debugging sessions can skip the re-discovery phase and go straight to checking whether seed rows survived a bulk operation.
