---
name: ns-create-app
description: Turns an app idea into a build-ready plan. Chains PRD, architecture, tasks, optional pricing, and the site-config rebrand for NowStack Mobile. Use when the user says `/ns create-app`, "create app", "plan a new app", "I have an app idea", or starts a product from scratch.
disable-model-invocation: true
---

# ns-create-app

Sequence the planning chain. Each step skill owns its content; this file only orders them. Each step reads the previous document, so pass file paths and never re-ask what a document records.

## Inspect

Check which outputs exist: `.agents/plan/PRD.md`, `.agents/plan/ARCHITECTURE.md`, `.agents/plan/tasks/README.md`, `.agents/plan/PRICING.md`, and whether `site-config.ts` still says NowStack. Show the remaining steps and what each writes, then get one confirmation for the chain.

## Act

Skip finished steps; for an existing document offer refine vs keep.

1. `$ns-prd`: the only discovery step. Hand it the idea the user already gave.
2. `$ns-architecture`: reads the PRD.
3. `$ns-tasks`: reads the PRD and architecture.
4. Paid product (PRD model is not free): offer `$ns-plan-pricing`. Skip for free apps.
5. `$ns-init-project`: point it at the PRD Config Brief (and approved `PRICING.md` product ids) as the product brief. Writing `site-config.ts` gets its own confirmation.

After each step report written / skipped / needs input.

## Return

Summarize the documents written, the build order, and the first 1-2 task files. Run loop: `npm run start-all -- --port 3003 --ios` (see `.agents/rules/launch-app.md`). Build one `.agents/plan/tasks/*.md` slice at a time and prove each with `$ns-verify`. Stop; do not implement here.
