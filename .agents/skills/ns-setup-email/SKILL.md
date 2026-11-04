---
name: ns-setup-email
description: Configures Lumail transactional email for Convex auth. Sets a verified sender and a deployment-specific API token, then proves a real OTP delivery. Use when setting up email, LUMAIL_API_KEY or EMAIL_FROM, sender domains, OTP delivery failures, or production email.
argument-hint: "[--prod]"
disable-model-invocation: true
---

# Setup Email

Lumail is the only mailer (`.agents/rules/auth-payments-storage.md`); never add Resend, SMTP, or a second provider. Default: current dev Convex deployment. `--prod`: production; add `--prod` to every `npx convex` command and never copy a dev token into production.

## 1. Inspect

Read `convex/auth.ts`, `convex/email.ts`, `convex/emailActions.tsx`, and `convex/emailTemplates.ts`. Then:

```bash
npx convex env list | sed 's/=.*$/=<set>/'
npx lumail auth login && npx lumail auth test
```

`EMAIL_FROM` falls back to `SiteConfig.company.contactEmail`; a bare address is wrapped as `{team} from {title} <address>`.

## 2. Configure Lumail

1. Confirm the sender domain and From address belong to the product.
2. Get the domain DNS records from Lumail and present them exactly. Changing DNS needs separate user authorization.
3. Create a deployment-specific token in the same Lumail org as the verified domain: `npx lumail tokens create --name "<product> <dev|prod>"`.

## 3. Set Convex env

```bash
read -rsp "Lumail API key: " LUMAIL_API_KEY; echo
printf '%s' "$LUMAIL_API_KEY" | npx convex env set LUMAIL_API_KEY
unset LUMAIL_API_KEY
printf '%s' 'Product <hello@example.com>' | npx convex env set EMAIL_FROM
```

## 4. Prove

1. Read back domain verification from Lumail. Local DNS lookups alone do not prove propagation.
2. Trigger an email OTP through the real signed-out app or web flow to the account from `.agents/rules/user-email.md` (never `[user-email]`). Verify the Lumail send, Convex logs, inbox delivery, code, sender, subject, and that no secret or PII is logged.
3. Run `$ns-check-setup` for the target (`npm run check-setup`, or `-- --prod`).

App Review credentials are a separate private no-delivery path and never reuse a delivery token. Production proof without Lumail access is `NOT VERIFIABLE`.

Return target, sender, domain status, env names set, delivery evidence, and blockers.
