# Mobile Security Audit Controls

Audit in this order. Each bullet is a check; a miss is a candidate finding.

## Payments and entitlements

- Client purchase state (Apple, Google, Stripe) is untrusted; verify receipts/transactions server-side with the correct provider and environment.
- Product IDs map to a server-owned entitlement table; grants bind to the canonical user and are idempotent; renewals, refunds, revocations, and expiry are handled.
- Reject sandbox/test Stripe evidence in production.
- Never grant from a success screen, callback, local flag, product ID, price, or client-reported result.
- Plan quotas are enforced atomically in Convex on every write path.

## Authorization and data exposure

- Inventory every public Convex function and HTTP route; public names are not authorization.
- Require auth, then role and object ownership; load client IDs through ownership-scoped indexes.
- Strict per-operation validators; no generic patches for role, owner, plan, entitlement, verification, or payment state.
- Purpose-built DTOs exclude tokens, receipts, provider IDs, storage paths, full auth rows, and unneeded personal data.
- Admin checks are server-side; a hidden route is not access control.

## Client/secret boundary

- `EXPO_PUBLIC_*`, app config, assets, source maps, OTA updates, web bundles, and native code are public.
- Better Auth, Stripe secret, Apple/Google verification, R2, Lumail, and admin credentials live only in Convex or the provider.
- No logging of session/refresh tokens, OTPs, receipts, push tokens, emails, or raw provider responses.
- Untrusted input cannot switch environment; EAS update channels/runtime versions cannot ship dev updates to production.

## Auth and sessions

- Session material only in platform secure storage; never AsyncStorage, URLs, analytics, or crash reports.
- Exact trusted origins for web, custom schemes, Universal Links, and App Links; callbacks validated server-side.
- Records bind to stable user IDs, not emails; privileged actions require verified identity.
- Rate-limit OTP send/verify, reset, device and push-token registration, and public writes.
- Recovery tokens are short-lived and single-use; sessions revoke after identity changes; no useful enumeration responses.

## Native links, WebViews, platform APIs

- Allowlist deep-link schemes, hosts, routes, and nested redirects; navigation alone never triggers privileged actions.
- AASA / Android intent filters do not claim broad domains or export unsafe activities.
- Sensitive flows avoid WebViews; otherwise restrict origins, navigation, file access, injected JS, and bridges.
- Push payloads are attacker input; validate before navigation or mutation.
- Minimum permissions; no sensitive values in clipboard, screenshots, backups, or notification previews.

## Uploads and outbound requests

- Upload creation authorized server-side; object keys scoped to the user; no overwrite or traversal.
- Size and type limits verified from content, not filename/MIME.
- Untrusted content served from a separate non-cookie origin with `nosniff`; never execute uploaded HTML/SVG under the app origin.
- URLs, webhooks, previews, and imports are SSRF inputs: revalidate DNS and redirects, reject private ranges, bound time/redirects/size.

## Web defense in depth

- Credentialed CORS only for explicit origins.
- CSP, `frame-ancestors`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Sanitize attacker HTML/Markdown and URL schemes; client-safe errors, details in server logs only.

## Abuse without live abuse

OTP bombing, trial churn, receipt replay, entitlement races, push-token abuse, storage cost amplification, analytics poisoning, and public AI/media generation are proven by source analysis and isolated tests only. Production-only proof is `NOT VERIFIABLE`.

## Status, evidence, severity

- Status: `CONFIRMED` (reachable attacker path and impact proven), `FIXED` (root cause repaired, regression passed), `CANDIDATE`, `NOT REPRODUCED`, `NOT VERIFIABLE`. Do not confirm a missing guard when a framework, provider, proxy, or shared helper may supply it.
- Evidence level (use the strongest achieved, never promote): `static`, `automated`, `local runtime`, `staging`, `production`. A Simulator is not a store binary.
- Severity: `Critical` practical unauthenticated takeover, broad sensitive access, or reliable payment bypass; `High` privilege, paid-feature, stored-XSS, identity, or token compromise with limited prerequisites; `Medium` scoped exposure, cost abuse, missing quota, constrained SSRF, unsafe link/WebView; `Low` limited disclosure or defense-in-depth gap; `Info` no impact.

```markdown
### [SEVERITY] Short title - STATUS

- Boundary: component and trust boundary (no live secrets or PII)
- Impact: what an attacker could achieve
- Evidence: redacted file/line, test, or runtime observation
- Root cause: missing trusted value or invariant
- Remediation: shared enforcement point and regression coverage
- Verification: static | automated | local runtime | staging | production
- Residual risk: remaining limitation or NOT VERIFIABLE evidence
```

Redact tokens, cookies, receipts, keys, webhook secrets, full provider IDs, push tokens, personal data, private URLs, full rows, and reusable payloads.
