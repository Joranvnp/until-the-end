# Architecture

## Overview

Two frontend apps sharing one Convex backend and one config file.

```
site-config.ts  <---- Single source of truth
       |
       |---> mobile-app/    (Expo, reads via @site-config alias)
       |---> web-app/       (TanStack Start, reads via @site-config alias)
       |
convex/  <---- Shared backend (deployed once, used by both apps)
```

This is NOT a monorepo. No workspaces, no Turborepo, no shared packages. Each app has its own `package.json` and `node_modules`. The only shared pieces are `site-config.ts` and `convex/`, accessed via TypeScript path aliases.

## How Apps Access Shared Code

### mobile-app

`metro.config.js` has `watchFolders` pointing to the parent directory so Metro can resolve `../convex` and `../site-config.ts`.

`tsconfig.json` paths:
```json
{
  "@/*": ["./*"],
  "@convex/*": ["../convex/*"],
  "@site-config": ["../site-config"]
}
```

### web-app

`vite.config.ts` has `resolve.alias` entries for `@convex` and `@site-config`.

## Backend Architecture (Convex)

### Auth Middleware

`convex/functions.ts` defines four middleware wrappers:

```
authQuery    - Requires authenticated user, provides ctx.user
authMutation - Same for mutations
adminQuery   - Requires authenticated user with isAdmin: true
adminMutation - Same for mutations
```

Built with `convex-helpers/server/customFunctions`. Every query/mutation uses one of these - never raw `query()` or `mutation()`.

### Schema

Tables:

- `users` - email, name, tokenIdentifier, authId, isAdmin, createdAt, anonymizedAt, bannedAt
- `adminSessions` - userId, token, createdAt (legacy, used by admin auth)
- `entitlements` - userId, key, status, source, productId, ... (payments)

### Auth Flow

```
Client                    Convex
  |                         |
  |-- better-auth login --->|
  |   (email OTP or Apple)  |
  |<-- session token -------|
  |                         |
  |-- ConvexProvider ------>|
  |   (token in headers)    |
  |                         |
  |-- authQuery ----------->| ctx.auth.getUserIdentity()
  |                         | -> lookup user by tokenIdentifier
  |                         | -> return ctx.user on every call
```

better-auth handles sessions. Convex verifies the token on every function call via `ctx.auth.getUserIdentity()`. The `ensureUser` mutation creates the Convex user row on first login.

### Payment Flow

```
                 iOS (production)              Android / Web
                       |                           |
              Apple IAP (expo-iap)         Stripe PaymentSheet
                       |                           |
              StoreKit 2 receipt           PaymentIntent created
                       |                   on Convex (server-side)
                       |                           |
              Validate receipt             Client presents sheet
              on Convex (server)                   |
                       |                   confirmPayment
                       |                           |
                 paymentIntentId = "apple_xxx"    = "pi_xxx"
                       |                           |
                       +---------> Store on entity <---------+
```

Dev mode bypasses both with `paymentIntentId = "dev_xxx"`.

## Mobile App Architecture

### Provider Stack (ORDER MATTERS)

```tsx
<GestureHandlerRootView>      // Must be outermost for gestures
  <PostHogProvider>            // Analytics (before Convex for setup tracking)
    <StripeProvider>           // Payment sheet (needs publishable key)
      <ConvexProvider>         // Realtime backend
        <ConvexBetterAuthProvider>  // Bridges better-auth <-> Convex auth
          <AuthProvider>       // Custom auth state (useAuth hook)
            <SafeAreaProvider> // Safe area insets
              <Stack />        // Expo Router
```

Wrong order = runtime crashes. This order is tested.

### Navigation Structure

```
app/
  index.tsx              -> Auth gate: redirect to /onboarding or /(app)/(tabs)/home
  onboarding/            -> 5-step flow: welcome, 3 slides, hype
  (auth)/signup.tsx       -> Standalone email OTP screen
  (flow)/paywall.tsx      -> Payment screen
  (app)/
    (tabs)/
      home.tsx            -> Blank home screen (build your feature here)
      settings.tsx        -> Account, tutorials, admin, logout
    tutorials/            -> 4 in-app tutorial screens
```

### Component Library

15+ components in `components/ui/`, all using NativeWind + custom CVA:

- Layout: `Screen`, `Header`, `FooterBar`, `Separator`
- Content: `Text` (8 variants), `Card`, `Badge`, `Banner`, `Timeline`
- Input: `Button` (6 variants, 8 sizes), `Input`, `OptionButton`, `TagButton`
- Feedback: `LoadingScreen`, `LoadingSpinner`, `StatusDot`, `ContinueButton`
- Composition: `ListItem`, `Slot` (asChild pattern)

## Web App Architecture (TanStack Start)

### Route Structure

```
__root.tsx                   -> HTML shell, providers
index.tsx                    -> Public landing page at /
cgv.tsx                      -> Terms and conditions
privacy.tsx                  -> Privacy policy
support.tsx                  -> Support page
app/route.tsx                -> User auth gate
app/index.tsx                -> Signed-in user web app
admin/route.tsx              -> Admin auth gate
admin/index.tsx              -> Redirects to /admin/users
admin/users.tsx              -> Users table
admin/users.$userId.tsx      -> User detail + ban/unban
```

### Auth Gates

`app/route.tsx` handles the normal user session with the same Better Auth credentials as mobile. `admin/route.tsx` handles admin-only access and verifies `isAdmin`.

Each gate handles 5 states:

1. Loading session -> spinner
2. No session -> OTP login form
3. Convex not authenticated -> spinner
4. User or admin check failed -> error + sign out
5. Ready -> render the user app or admin shell

### Design System

Follows the NowStack admin pattern:
- Shell: shadcn SidebarProvider + SidebarInset
- Tables: Card > search input > Table
- Stats: grid of metric cards
- Detail pages: Layout > back button > Card sections
- Status badges: outline badge with colored dot
