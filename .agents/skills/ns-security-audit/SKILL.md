---
name: ns-security-audit
description: Audits and fixes NowStack Mobile trust-boundary flaws. Covers auth/session abuse, Apple or Stripe payment bypass, Convex authorization, data leaks, deep links, R2 uploads, client secrets, SSRF, and XSS. Use for security review or pentest follow-up.
disable-model-invocation: true
---

# NS Security Audit

## Mode

Pick the narrowest mode from the request:

- `audit` (default, and always when called by `$ns-launch-audit`): inspect and report only; no edits.
- `audit and fix` / `remediate`: smallest complete repairs, regression tests, local verification.
- `production verification`: only explicitly authorized, low-impact read-only checks.

Repo edit permission covers local source and local tests only, never deploys, provider changes, production writes, account creation, emails, payments, builds, or store uploads.

## Hard boundaries

1. Never create or use disposable, catch-all, generated, or agent-controlled inboxes; never invoke AgentMail.
2. Never register accounts with third-party, guessed, or unverified emails; never test enumeration or pre-hijacking against real people.
3. Never trigger repeated signup/OTP/reset emails, brute-force, spray, fuzz at volume, load test, race production, replay live tokens, or attempt takeover.
4. Never complete a production payment, mutate with a live receipt, refund, grant entitlements, or create provider resources without approval for that exact mutation.
5. Never print, commit, or report secrets, cookies, tokens, receipts, API keys, full personal data, or raw production rows. Redact.
6. Never mutate or delete production data; no destructive shell/Git commands; preserve unrelated worktree changes.

If safe proof needs a forbidden action, report `NOT VERIFIABLE`.

## Workflow

1. Read `AGENTS.md`, matching `.agents/rules/*`, and `convex/_generated/ai/guidelines.md` before any Convex work. Read [references/audit-controls.md](references/audit-controls.md).
2. `git status --short`, then `bash .agents/skills/ns-security-audit/scripts/security-audit-scan.sh .` (candidate paths only; inspect each manually).
3. Map trust boundaries: Expo routes/native modules, TanStack public/`/app`/`/admin` routes, public vs internal Convex functions, Better Auth, Apple IAP, Stripe actions, R2, deep links, push tokens, client DTOs.
4. Trace high-risk chains first: purchase proof -> server verification -> stable user -> server price -> idempotent entitlement; session -> identity -> role -> ownership -> minimal DTO; public config -> bundle -> server-only secrets; deep link -> trusted scheme/host -> validated route; upload -> ownership -> size/type/content -> safe key; user URL -> SSRF validation -> bounded fetch.
5. Confirm: reachable entrypoint, attacker control, missing server guard, impact, no compensating control. A pattern alone is `CANDIDATE`. Use a second user only in local/isolated state with project-owned fixtures.
6. Fix (when authorized) at the shared choke point (`convex/functions.ts` builders, domain services), search sibling call sites, and add a regression test for the exploit and a neighboring valid path.
7. Verify with `.agents/rules/development-commands.md` gates; web via `dev-browser`, native via `$ns-ios-verification`. Green local tests are not production proof.
8. After code changes, update `CHANGELOG.md`. Do not commit, push, deploy, or open a PR unless asked.

## Output

Lead with the verdict and whether fixes were made. Per item use the template and severity scale in `references/audit-controls.md`. List tested secure boundaries, residual risks, and skipped checks. Never include reusable exploit payloads, live identifiers, tokens, receipts, or personal data.
