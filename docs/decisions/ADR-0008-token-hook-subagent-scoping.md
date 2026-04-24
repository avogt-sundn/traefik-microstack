# ADR-0008: Token usage hook scoped to SubagentStop + inline ticket section

**Date**: 2026-04-16  
**Status**: Accepted  
**Session context**: Branch `feature/partner-infra-consolidation`, commit 120146d — refactor of `write-ticket-tokens.sh`

## Context

The first version of `write-ticket-tokens.sh` fired on the `Stop` event (every session end). It read the most-recent session JSONL regardless of source and wrote totals to a sidecar `<TICKET-ID>.tokens.md` file. Two problems emerged:

1. **Wrong scope:** Tokens from unrelated sessions were counted if `implement-ticket` was not the last agent run.
2. **Split artifact:** Token data lived in `.tokens.md` while the ticket spec lived in `<TICKET-ID>.md` — two files to understand one ticket's cost.

## Decision

- Change the hook event from `Stop` to `SubagentStop`.
- Guard on `meta.json agentType == "implement-ticket"` to scope token counting to implement-ticket subagent runs only.
- Write/replace a `## Token usage` section directly in the ticket `.md` file rather than a sidecar.
- Accumulate across rework sessions using a `<!-- tracked-agents: <id> -->` comment to skip already-counted subagent runs.
- Remove the `.tokens.md` sidecar pattern; add `**/*.tokens.md` to `.gitignore` for stragglers.

## Consequences

- Token cost is now co-located with the ticket spec — single file to review cost vs. scope.
- The hook is immune to unrelated session activity — it only fires when an implement-ticket subagent completes.
- **Fragility:** deduplication depends on the hidden `<!-- tracked-agents: ... -->` comment. If a ticket `.md` is regenerated or the comment is stripped, counts will double. Acceptable for a diagnostic tool.
- **Dependency on meta.json:** If the implement-ticket agent's subagent JSONL lacks a companion `meta.json` declaring `agentType`, the hook silently skips. This is a forward-compatibility risk if Claude Code changes subagent metadata format.

## Token efficiency note

Before this change, the token hook could accumulate counts from sessions that loaded large context (e.g., full Angular workspace reads) into ticket cost reports, inflating numbers and making cost regression detection unreliable. Accurate per-ticket costs allow detecting when an implement-ticket workflow expansion increases cost — the primary feedback loop for workflow compression efforts.
