---
name: brainstorm
description: Run deep iterative research through explore, challenge, synthesize, and action. Use for thorough topic exploration, decision research, or battle-tested conclusions.
disable-model-invocation: true
user-invocable: true
---

Parse flags from the input, then treat the rest as the topic:
- `-e` / `--economy` → call WebSearch, Grep, and Read directly; do not launch subagents
- `-f` / `--fast` → skip challenge and use 3 perspectives in synthesize
- `--file` → write the session to `.claude/output/brainstorm/{topic-slug}-{date}.md`

Load one step file at a time and follow its `next_step`:

1. `steps/step-01-explore.md`
2. `steps/step-02-challenge.md` unless fast
3. `steps/step-03-synthesize.md`
4. `steps/step-04-action.md`

Carry topic, flags, session path, and each phase's findings into the next step. Return a recommendation with a confidence level, a steelmanned contrarian view, and concrete next actions.
