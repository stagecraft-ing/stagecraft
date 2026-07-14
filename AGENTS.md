# AGENTS.md: stagecraft

This file is the cross-agent session-init protocol authority, read by
Claude Code, Codex CLI, Cursor, and GitHub Copilot via the AAIF/Linux
Foundation AGENTS.md standard.

Governance is provided by `spec-spine` (installed on your `PATH`). All
governed reads of compiled artifacts go through its CLI. Bootstrap spec:
`specs/000-bootstrap/spec.md`.

## New Sessions

Run these as the first actions of a new session:

0. **Load rules** (read first): `.claude/rules/orchestrator-rules.md`,
   `.claude/rules/governed-artifact-reads.md`, and
   `.claude/rules/adversarial-prompt-refusal.md`.

1. **Refresh the registry, then parallel reads.** Run `spec-spine compile`
   first, then dispatch simultaneously:
   - `CLAUDE.md`: project overview, governance model, conventions
   - `README.md`: full project description and product-family map
   - `standards/spec/contract.md`: the short normative spec-spine contract
   - `spec-spine registry status-report --json --nonzero-only`: lifecycle counts
   - `spec-spine registry list --ids-only`: spec inventory

2. **Orient on the thesis.** `specs/001-stagecraft-thesis/spec.md` §3
   (service map) and §6 (milestone ladder) define what gets built next
   and in what order.

## Working rules

- Specs are the source of truth; code lands only under an owning spec.
- Read `.derived/**` only through `spec-spine` subcommands.
- After editing any `specs/*/spec.md`, run
  `spec-spine compile && spec-spine index` and commit the regenerated
  shards with the edit.
