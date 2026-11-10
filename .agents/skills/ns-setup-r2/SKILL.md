---
name: ns-setup-r2
description: Configures Cloudflare R2 file uploads for the Convex backend. Provisions the bucket, S3 credentials, and public URL, sets the five R2_* vars on Convex, and proves a round-trip. Use when setting up image or file uploads, configuring R2, Cloudflare storage, or when uploads fail.
argument-hint: "[--prod]"
disable-model-invocation: true
---

# Setup Cloudflare R2

Default: current dev Convex deployment via the provisioning script. `--prod`: a production bucket with its own bucket-scoped token, set manually with `--prod` (the script only targets the current dev deployment). Never reuse dev R2 credentials in production.

`convex/storage/r2.ts` reads `R2_ENDPOINT` (`https://<account-id>.r2.cloudflarestorage.com`), `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` (custom domain or `https://pub-<hash>.r2.dev`). They live on Convex only, never in `web-app`/`mobile-app` `.env`.

## 1. Inspect

```bash
npx convex env list | sed 's/=.*$/=<set>/'
```

All five set and no failure reported: skip to Prove.

## 2. Provision (dev)

Need the account ID (dashboard URL `dash.cloudflare.com/<account-id>/...`) and a provisioning token from this pre-filled link (R2 edit, Account API Tokens edit, Zone read, DNS edit):
`https://dash.cloudflare.com/?to=/:account/api-tokens&permissionGroupKeys=%5B%7B%22key%22%3A%22workers_r2%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22account_api_tokens%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22zone%22%2C%22type%22%3A%22read%22%7D%2C%7B%22key%22%3A%22dns%22%2C%22type%22%3A%22edit%22%7D%5D&name=NowStack%20R2%20Provisioning`

The token goes through the process environment only, never argv or `.env`:

```bash
read -rsp "Cloudflare provisioning token: " CLOUDFLARE_API_TOKEN; echo
export CLOUDFLARE_API_TOKEN
node .agents/skills/ns-setup-r2/scripts/setup-cloudflare-r2.mjs \
  --account-id <id> --bucket <app-slug>-storage --confirm-public-access
unset CLOUDFLARE_API_TOKEN
```

Idempotent: reuses the bucket/token, mints a bucket-scoped token, attaches a custom domain when the `site-config.ts` domain has a Cloudflare zone. Pass `--confirm-public-access` (enables `r2.dev`) only after explicit user confirmation. Options: `--help`.

## 3. Provision manually (`--prod`, or no provisioning token)

1. `wrangler r2 bucket create <app-slug>-storage-prod` (or dashboard).
2. R2 → **Manage R2 API Tokens** → Object Read & Write scoped to the bucket. Copy the secret once; never print or commit it.
3. Public access: connect a custom domain (production) or enable `r2.dev` (dev only).
4. Set all five in bash (add `--prod` for production):

```bash
read -rp "R2 endpoint: " R2_ENDPOINT
read -rp "R2 access key id: " R2_ACCESS_KEY_ID
read -rsp "R2 secret access key: " R2_SECRET_ACCESS_KEY; echo
read -rp "R2 bucket name: " R2_BUCKET_NAME
read -rp "R2 public URL: " R2_PUBLIC_URL
for key in R2_ENDPOINT R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET_NAME R2_PUBLIC_URL; do
  printf '%s' "${!key}" | npx convex env set "$key"
done
unset R2_ENDPOINT R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET_NAME R2_PUBLIC_URL
```

## 4. Prove

```bash
npx convex run storage/r2:internalUploadBuffer '{"key":"test/hello.txt","base64":"aGk=","contentType":"text/plain"}'
```

Fetch the returned URL, then `npx convex run storage/r2:internalDeleteObject '{"key":"test/hello.txt"}'`. Run `npm run check-setup` (add `-- --prod`). Failures: 403/SignatureDoesNotMatch → wrong `R2_ENDPOINT` or token lacks write; 404 on read → public access or `R2_PUBLIC_URL` wrong; browser PUT CORS error → add a bucket CORS rule for the web origin and `PUT`.

Return target, bucket, public URL, env names set, round-trip result, and blockers.
