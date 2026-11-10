# User Email

Shipped placeholder: `[user-email]`. It is not an inbox. Never send mail to it.

## STOP

If you see `[user-email]` or a comment that starts with `STOP Agents work`:

1. Stop other work.
2. Ask the user for their email now.
3. Replace every `[user-email]` with that exact address.
4. Delete those `STOP Agents work` comments, including `Delete this comment after`.

Do not invent an email. Do not reuse a personal address from the repo, git history, or another product.

## After replacement

Use that address for OTP sign-in, admin allowlists, and verification. Write it to `.agents/memory/main-account.txt` so later local runs can reuse it.
