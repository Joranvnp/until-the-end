# Launch App

Rules for starting the local NowStack Mobile stack.

## When this applies

- Launching local dev servers for web, Convex, iOS, Android, or Metro.
- Giving another agent or the user commands to run the app locally.

## Port 3003

- **ALWAYS use `http://localhost:3003` for the TanStack web app.**
- Before starting a new web server, inspect port `3003`: `lsof -nP -iTCP:3003 -sTCP:LISTEN`.
- If `3003` is already running NowStack Mobile from this repo for another chat, agent, or user, reuse it and continue against `http://localhost:3003`; do not kill or restart it.
- Identify the owner before deciding: `ps -p <PID> -o pid,ppid,command` and, when needed, `lsof -a -p <PID> -d cwd -Fn`.
- If `3003` is occupied by an unrelated process, report what owns it and ask before stopping it or using another web port.
- Do not let launch commands silently move the web app to `3004+`; inspect first, then either reuse `3003` or get approval.

## Launch Commands

- Full stack: `npm run start-all -- --port 3003` (Convex + web + mobile Metro).
- Full stack with iOS simulator: `npm run start-all -- --port 3003 --ios`.
- Full stack with Android emulator: `npm run start-all -- --port 3003 --android`.
- Physical phone with Expo Go preview: `npm run expo-go` (add `-- --tunnel` only when LAN fails).
- Convex only: `npm run dev:convex`.
- Web only: `cd web-app && npx vite dev --port 3003`.
- Mobile Metro only: `cd mobile-app && npx expo start --port 8081`.
- Install or refresh the iOS development build: `cd mobile-app && npm run ios`.
- Install or refresh the Android development build: `cd mobile-app && npm run android`.

## Notes

- `npm` needs the `--` separator before launcher flags; `npm run start-all --ios` will not pass `--ios`.
- Native iOS/Android work uses a development build, not Expo Go.
- `npm run expo-go` is an intentionally limited boilerplate preview: it keeps UI, navigation, Convex, and email auth usable while disabling native IAP/social callbacks. Use a development build for full feature verification.
- Metro ports are separate from the web port; for parallel agents, use dedicated Metro ports/devices per `.agents/rules/verification.md`.
- `npm run start-all` writes service logs to `logs/convex.log`, `logs/web.log`, and `logs/mobile.log`.
