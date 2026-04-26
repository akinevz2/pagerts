# STOP: Tooling Hiccup Memory (Read Before Running Diagnostics)

## What happened

A prior run used `execution_subagent` for a diagnostics/search workflow and got a non-actionable/incorrect completion response ("task_complete tool is disabled"), which interrupted the normal flow and slowed fixes.

## Why this matters

This repo relies on fast warning triage (`lint`, `type-check`, `test --coverage`, `audit`). If the tool wrapper is unstable, we lose reliable output and can miss real problems.

## Future-safe rule

For warning/error triage in this repo:

1. Prefer `run_in_terminal` for deterministic command output.
2. Use `execution_subagent` only for broad execution summaries when exact raw logs are not required.
3. When collecting diagnostics, run commands directly and keep stderr/stdout visible.

## Recommended command sequence

```bash
npm run lint
npm run type-check -- --pretty false
npm run test -- --coverage
npm run build
npm audit --json
```

## If a tool hiccup appears again

1. Stop using the failing wrapper for that task.
2. Switch to direct terminal commands immediately.
3. Record the exact symptom and fallback used in this file.

## Last updated

2026-04-24
