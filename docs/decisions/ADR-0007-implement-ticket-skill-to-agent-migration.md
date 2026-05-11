# ADR-0007: Migrate `implement-ticket` from skill to agent

**Date**: 2026-04-15
**Status**: Accepted
**Session context**: User asked whether the 7-phase implement-ticket skill was better structured as a sub-agent.

## Context

`implement-ticket` was a skill (`.claude/skills/implement-ticket/SKILL.md`). It implements a 7-phase orchestration pipeline:

1. Explore — read ticket file, load domain context
2. Plan — derive change set, identify layers
3. Implement — dispatch to layer-specialist subagents (DCA, TRK, ANGBLD, ANGFED, etc.)
4. Standards — run simplify/caveman-review passes
5. Verify — invoke e2e agent
6. Update ticket — mark acceptance criteria complete
7. Commit — delegate to git-commit-master

The skill was running inside the main conversation context window. At its worst, a full execution spawned 5–6 subagents, consumed the frontend build output, read multiple domain compose files, ran Playwright results, and held all intermediate state simultaneously.

## Decision

Migrate to a proper sub-agent: `.claude/agents/implement-ticket.md` with `model: sonnet` and `color: purple`. The old `.claude/skills/implement-ticket/SKILL.md` is replaced with a one-liner stub that delegates to the agent.

The CLAUDE.md knowledge map is updated to include the entry:

```
│   ├── implement-ticket.md         [IMPL]
```

## Consequences

**Easier:**
- Main conversation context is isolated from implement-ticket's multi-file, multi-subagent workload — no contamination of the primary session's context window.
- Other agents can delegate to `implement-ticket` via `subagent_type: "implement-ticket"` without pulling the full 7-phase orchestration inline.
- Agent frontmatter (`model`, `color`, examples) gives Claude Code correct routing metadata that skills lack.
- The stub skill remains for backward compatibility — invocations via `/implement-ticket` continue to work.

**Harder:**
- Agent files require frontmatter maintenance (model pin, color) that skills do not.
- The agent knowledge map in CLAUDE.md must be kept current when agents are added.

## Rule

**Multi-phase orchestration workflows that spawn multiple subagents must be agents, not skills.** Skills are appropriate for single-pass automation. If a workflow has phases, branches, or itself invokes other agents, it belongs in `.claude/agents/`.

## Token efficiency note

Moving implement-ticket out of the main context prevents ~5–6 subagent result payloads (build logs, Playwright output, compose diffs) from accumulating in the primary session window. This is the highest-cost category of token waste in this repo — one implement-ticket run previously consumed as much context as the rest of the session combined.
