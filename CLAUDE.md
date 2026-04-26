<!-- nexusgraphai:start -->
# NexusGraphAI — Code Intelligence

This project is indexed by NexusGraphAI as **Sidharth Gold Inventory Site** (3466 symbols, 7438 relationships, 212 execution flows). Use the NexusGraphAI MCP tools to understand code, assess impact, and navigate safely.

> If any NexusGraphAI tool warns the index is stale, run `npx nexus-graph-ai analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `nexusgraphai_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `nexusgraphai_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `nexusgraphai_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `nexusgraphai_context({name: "symbolName"})`.

## When Debugging

1. `nexusgraphai_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `nexusgraphai_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ nexusgraphai://repo/Sidharth Gold Inventory Site/process/{processName}` — trace the full execution flow step by step
4. For regressions: `nexusgraphai_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `nexusgraphai_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `nexusgraphai_context({name: "target"})` to see all incoming/outgoing refs, then `nexusgraphai_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `nexusgraphai_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `nexusgraphai_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `nexusgraphai_rename` which understands the call graph.
- NEVER commit changes without running `nexusgraphai_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `nexusgraphai_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `nexusgraphai_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `nexusgraphai_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `nexusgraphai_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `nexusgraphai_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `nexusgraphai_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `nexusgraphai://repo/Sidharth Gold Inventory Site/context` | Codebase overview, check index freshness |
| `nexusgraphai://repo/Sidharth Gold Inventory Site/clusters` | All functional areas |
| `nexusgraphai://repo/Sidharth Gold Inventory Site/processes` | All execution flows |
| `nexusgraphai://repo/Sidharth Gold Inventory Site/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `nexusgraphai_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `nexusgraphai_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the NexusGraphAI index becomes stale. Re-run analyze to update it:

```bash
npx nexus-graph-ai analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx nexus-graph-ai analyze --embeddings
```

To check whether embeddings exist, inspect `.nexusgraphai/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/nexusgraphai/nexusgraphai-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/nexusgraphai/nexusgraphai-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/nexusgraphai/nexusgraphai-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/nexusgraphai/nexusgraphai-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/nexusgraphai/nexusgraphai-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/nexusgraphai/nexusgraphai-cli/SKILL.md` |

<!-- nexusgraphai:end -->