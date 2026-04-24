# ADR-0003: Axioms Block in Every Agent Definition File

**Date**: 2026-04-08  
**Status**: Accepted  
**Session context**: CLAUDE.md was restructured; agent files lacked explicit non-negotiable rules

## Context

Agent definition files in `.claude/agents/` contained detailed narrative context, patterns, and examples — but no explicit statement of what rules must never be broken. This led to situations where agents could produce technically-working output that violated project conventions (e.g., mounting Docker socket directly, using implicit Traefik priority, creating `ports:` on Java backend services).

CLAUDE.md was simultaneously restructured from 170+ lines of narrative to a compact axioms + commands + compose table format, removing the detailed architecture prose that had lived there.

## Decision

Every agent definition file opens with a `## Axioms` section — typically 8–14 bullet points — that contains the non-negotiable rules for that domain. These are derived from:

1. Cross-cutting axioms in CLAUDE.md (every agent includes the applicable ones)
2. Domain-specific constraints discovered through debugging sessions

Example from `docker-compose-architect.md`:
- Never mount the Docker socket directly
- Every service must have a healthcheck — no exceptions
- `depends_on` always uses `condition: service_healthy`
- Root compose contains only `include:` lines and the external network

## Consequences

**Easier:**
- For simple tasks, reading only the Axioms section (first 20 lines of an agent file) is often sufficient
- New agent invocations have an immediate correctness contract visible before any reasoning
- Code review can verify axiom compliance mechanically

**Harder:**
- Axioms sections must be kept in sync with CLAUDE.md cross-cutting rules
- Adding a new project-wide axiom requires updating all agent files

## Token efficiency note

Reading only the `## Axioms` block (20 lines) vs. the full agent file (200+ lines) is a 10x token reduction for quick decisions. When the answer to "is this approach valid?" appears in the axioms, the rest of the file need not be loaded. Estimated saving: ~1,500 tokens per session for simple validation queries.
