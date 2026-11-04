# TypeScript And Code Style

Focused rules that are not just formatter output.

## When this applies

- Editing TypeScript, React, Convex, Expo, or web UI files.

## Rules

- NEVER use `any`. Use proper types, generics, `unknown`, or generated Convex types.
- Use `as unknown as X` only as an absolute last resort, and explain why in a comment.
- Prefer `type` aliases unless an interface is clearly better for extension; if a type is complex, give it a name rather than inlining it.
- Use kebab-case file names and avoid new `index.ts` barrel exports.
- Keep comments rare and only for non-obvious logic.
- Use existing path aliases: `@/*` inside app folders, `@convex/*` for backend, `@site-config` for shared config.
- Do not add raw relative imports into `convex/` from web or mobile code.
- Use Lucide icons for web UI when an icon exists.
- Avoid emojis in product UI unless explicitly requested.
- Avoid gradients/orbs as default decoration.
- Keep UI text inside buttons/cards from overflowing at mobile widths.

## File Moves

- Preserve nearby naming and route conventions when moving files.
- After route moves in `web-app`, let TanStack regenerate `app/routeTree.gen.ts` via build/typecheck.
