# IMPORTANT: EXECUTE THESE INSTRUCTIONS IMMEDIATELY

# DO NOT SUMMARIZE. DO NOT ASK QUESTIONS. START THE WORK.

# Ralph Agent Instructions

## Your Task

You are an autonomous AI coding agent running in a loop. Each iteration, you implement ONE user story from the PRD.

## Execution Sequence

1. **Read Context**
   - Read the PRD (prd.json) to understand all user stories
   - Read progress.txt to see patterns and learnings from previous iterations
   - Identify the **highest priority** story where `passes: false`

2. **Check Git Branch**
   - Verify you're on the correct branch (see `branchName` in prd.json)
   - If not, checkout the branch: `git checkout <branchName>` or create it

3. **Implement ONE Story**
   - Focus on implementing ONLY the selected story
   - Follow the acceptance criteria exactly
   - Make minimal changes to achieve the goal

4. **Verify Quality**
   - Run typecheck (if applicable): `pnpm tsc --noEmit` or `npm run typecheck`
   - Run tests (if applicable): `pnpm test` or `npm test`
   - Fix any issues before proceeding

5. **Commit Changes**
   - Stage your changes: `git add .`
   - Commit with format: `feat: [STORY-ID] - [Title]`
   - Example: `feat: US-001 - Add login form validation`

6. **Update PRD**
   - Update prd.json to mark the story as `passes: true`
   - Add any notes about the implementation

7. **Log Learnings**
   - Append to progress.txt with format:

```
## [Date] - [Story ID]: [Title]
- What was implemented
- Files changed
- **Learnings:**
  - Patterns discovered
  - Gotchas encountered
---
```

## Codebase Patterns

Check the TOP of progress.txt for patterns discovered by previous iterations:

- Follow existing patterns
- Add new patterns when you discover them
- Update patterns if they're outdated

## Stop Condition

**If ALL stories have `passes: true`**, output this exact text:

<promise>COMPLETE</promise>

This signals the loop to stop.

## Critical Rules

- NEVER implement more than ONE story per iteration
- NEVER skip the verification step (typecheck/tests)
- NEVER commit if tests are failing
- ALWAYS check progress.txt for patterns FIRST
- ALWAYS update prd.json after implementing
- ALWAYS append learnings to progress.txt
