# Convex

Rules for any change under `convex/` or any client code importing generated Convex APIs.

## When this applies

- Editing `convex/**/*.ts` or `convex/**/*.tsx`.
- Calling `api.*` or `internal.*` from web/mobile code.
- Changing auth, schema, indexes, HTTP routes, payments, or storage.

## Rules

- **CRITICAL**: Read `convex/_generated/ai/guidelines.md` before editing Convex code.
- Use Convex as the only backend/database. Do not add Prisma, PostgreSQL, Supabase, Firebase, or server-side DB mirrors.
- Use project builders from `convex/functions.ts`: `authQuery`, `authMutation`, `authAction`, `adminQuery`, `adminMutation`, `adminAction`.
- Derive user identity server-side from Convex auth. Never trust a client-passed `userId` for authorization.
- Import generated APIs with aliases: `@convex/_generated/api`, `@convex/_generated/dataModel`. Do not use relative imports into `../convex`.
- Define validators for every public/internal Convex function argument.
- Add schema indexes for fields you query. Prefer `.withIndex()`, `.take(n)`, and pagination over `.filter()` or unbounded `.collect()`.
- Never use `.collect().length` for scalable counts. Maintain counters if a real count is needed.
- Keep Convex env in Convex. If a deploy/setup step needs a transient env file, delete it after applying.

## Verification

- Run `npx convex dev --once` after Convex changes.
- If generated API types change, also run the relevant web/mobile TypeScript check.
