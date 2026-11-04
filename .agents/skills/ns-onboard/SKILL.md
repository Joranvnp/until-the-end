---
name: ns-onboard
description: Runs the NowStack Mobile first-run wizard. Chains toolchain install, dependencies, accounts and Convex, a new Git repo, the product brief, and the rebrand by delegating to the owning skills. Use for `/ns onboard`, a fresh clone, or "set up my project".
disable-model-invocation: true
---

# ns-onboard

Sequence first-run setup. Delegate every step except dependencies and the Git repo, which this skill owns.

## Inspect

Find what is done so finished steps are skipped:

- Tools, accounts, Convex: `npm run check-setup -- --accounts`.
- Dependencies: `node_modules/.bin/convex`, `web-app/node_modules/.bin/vite`, `mobile-app/node_modules/.bin/expo`.
- Repo: `git remote -v`.
- Brief and brand: `.agents/plan/PRD.md`; `site-config.ts` title still NowStack.

Every question and confirmation is blocking (AGENTS.md > User Questions): stop until the user answers; never auto-resolve or pick a default.

Show the plan with what each step mutates (installs, account logins, `.git` rewrite, new GitHub repo, Convex env). Get one confirmation for the wizard.

## Act

1. Tools: `$ns-doctor`.
2. Dependencies: `npm install` in the repo root, `web-app/`, and `mobile-app/`; skip a folder whose `node_modules/.bin` is populated. Verify the exit code and the binary path, not a chained `echo`. Keep `mobile-app/.npmrc` (`legacy-peer-deps=true`); use `npm ci` for a stale tree.
3. Accounts and Convex: `$ns-setup-accounts`. Convex is required; every other account is skippable. Paid signups get their own confirmation.
4. Own Git repo (own confirmation):
   - Show `git remote -v`. If origin is `Melvynx/nowstack-mobile` and the user has not confirmed this clone becomes their project, stop.
   - `gh auth status` must pass.
   - Fresh history (default): `trash .git`, then `git init && git add -A && git commit -m "chore: init from NowStack Mobile"`. Keep history: `git remote remove origin`. Never `rm -rf`.
   - `gh repo create <name> --private --source=. --remote=origin --push` with a name the user confirmed.
5. Product brief and rebrand:
   - No PRD: `$ns-create-app` for the full plan (it ends with `$ns-init-project`), or `$ns-prd` then `$ns-init-project` for a quick brief.
   - PRD present: `$ns-init-project` only.
6. Finish: `$ns-check-setup`; clean or only expected warnings.

After each step report done / skipped / failed.

## Return

Accounts connected or skipped (and what each skip blocks), repo URL, Convex deployment, branding state. Run: `npm run start-all -- --port 3003 --ios` (development build; payments and Apple Sign In do not work in Expo Go). Next: `$ns-web-deploy`, `$ns-ios-testflight`, `$ns-android-beta`. Stop.
