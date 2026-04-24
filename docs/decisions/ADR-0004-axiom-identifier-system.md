# ADR-0004: Axiom Identifier System and Knowledge Map

**Date**: 2026-04-10
**Status**: Accepted
**Session context**: Two new cross-cutting axioms added to CLAUDE.md; knowledge map section added; `make axioms` target implemented.

## Context

The project has axioms spread across CLAUDE.md and ten agent files. Without identifiers, referencing a specific axiom in a prompt or commit message requires quoting its full text — 15–30 tokens per reference. There was also no at-a-glance map showing which agent file covers which concern.

Two new axioms were also added to CLAUDE.md:
- **Optimize for clarity and brevity** — all markdown and source code must minimize tokens and time-to-read.
- **Locality and hierarchy** — every line of text lives as close as possible to its point of use, in a strict hierarchy.

## Decision

1. **Unique axiom identifiers**: Each axiom is addressable by `<ABBREV>-<N>` where `ABBREV` is the file's abbreviation and `N` is the 1-based position of the bullet within that file's `## Axioms` or `## Behavioral Rules` block. Abbreviation map:

   | Abbreviation | File |
   |---|---|
   | CLAUDE | CLAUDE.md |
   | ANGBLD | .claude/agents/angular-build-fixer.md |
   | ANGFED | .claude/agents/angular-federation-expert.md |
   | DEVC | .claude/agents/devcontainer-integrator.md |
   | DID | .claude/agents/developing-in-domain.md |
   | DCA | .claude/agents/docker-compose-architect.md |
   | E2E | .claude/agents/e2e-test-engineer.md |
   | GIT | .claude/agents/git-commit-master.md |
   | OBS | .claude/agents/session-observer.md |
   | TLS | .claude/agents/tls-security-engineer.md |
   | TRK | .claude/agents/traefik-routing-expert.md |

2. **`make axioms` target**: Walks CLAUDE.md then all agent files in alphabetical order, extracts every `## Axioms` / `## Behavioral Rules` block, and prints each bullet prefixed with its unique ID. Output is terminal-readable; no file is modified.

3. **Knowledge map in CLAUDE.md**: A `## Knowledge map` section shows the 3-level reading hierarchy (CLAUDE.md → agent file → DOMAIN.md) with abbreviations in brackets, making the full axiom namespace visible without loading any agent file.

## Consequences

- Prompts and commit messages can reference axioms by ID (e.g., "this violates CLAUDE-4" instead of quoting the full rule).
- `make axioms` gives any developer or AI agent a complete, numbered axiom listing with a single command — no context-loading required.
- Adding a new axiom to any file changes the IDs of all subsequent axioms in that file. Treat IDs as session-stable references, not permanent permalinks; run `make axioms` to verify current IDs.
- The abbreviation map is the single source of truth for IDs — it lives in CLAUDE.md's Knowledge map section.

## Token efficiency note

Referencing `CLAUDE-4` instead of quoting "Never route around Traefik — all service-to-service calls go through `https://gateway`..." saves ~20 tokens per reference. In a session with 10 axiom citations that is ~200 tokens saved, plus eliminates the risk of misquoting an axiom that has since been updated.
