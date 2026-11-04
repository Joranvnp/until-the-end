# Patterns & Gotchas

Lessons learned from building and shipping a production app with this stack. Read this before you start building.

---

## Payments

### iOS requires Apple IAP - no exceptions

Apple rejects apps that use Stripe or any other payment processor for in-app purchases. You MUST use Apple IAP on iOS production builds.

```tsx
// This pattern is in app/(flow)/paywall.tsx
const useIosIAP = Platform.OS === "ios" && !__DEV__;

if (useIosIAP) {
  // Apple IAP flow
} else {
  // Stripe PaymentSheet flow
}
```

Dev mode on iOS still uses Stripe (or free bypass) for testing convenience.

### StoreKit 2 JWT validation, not legacy receipts

The IAP validation in `convex/payments/iap.ts` uses StoreKit 2's JWS (JSON Web Signature) format. It decodes the JWT payload and verifies:
- `productId` matches your configured product
- `bundleId` matches your app
- `transactionId` is present and unique

Xcode local testing uses a special `environment: "Xcode"` flag that bypasses Apple's server validation.

### Always call finishTransaction

After validating a purchase, you MUST call `finishCurrentTransaction()`. Unfinished transactions will re-appear on next app launch and confuse users.

```tsx
await iap.purchase(async (receiptData) => {
  await validateReceipt({ receiptData }); // server-side validation
});
await iap.finishCurrentTransaction(); // CRITICAL: always call this
```

### Dev mode bypass

The paywall has a "Dev Generate (Free)" button in `__DEV__` mode. It creates a payment with `paymentIntentId: "dev_xxx"`. Useful for testing the full flow without real payments.

---

## Auth

### Provider stack order is fragile

The provider order in `app/_layout.tsx` MUST be followed exactly. Each provider depends on its parent being initialized:

1. `GestureHandlerRootView` - must wrap everything for gesture support
2. `PostHogProvider` - analytics needs to be ready before auth events fire
3. `StripeProvider` - needs publishable key from env
4. `ConvexProvider` - backend connection
5. `ConvexBetterAuthProvider` - bridges better-auth sessions to Convex tokens
6. `AuthProvider` - custom context that combines both auth states

Swapping order causes silent failures or crashes.

### Double-call prevention in strict mode

React 18 strict mode calls effects twice in development. The `AuthProvider` uses a `useRef` flag to prevent double-calling `ensureUser`:

```tsx
const hasCalledEnsure = useRef(false);
useEffect(() => {
  if (hasCalledEnsure.current) return;
  hasCalledEnsure.current = true;
  ensureUser({});
}, [session]);
```

Without this, you'd see duplicate user creation attempts in dev mode.

### isAuthenticated requires BOTH sessions

`useAuth().isAuthenticated` is `true` only when:
1. better-auth has a valid session (`authClient.useSession()`)
2. Convex has a valid user (`useQuery(api.users.account.getMe)`)

Both must be true. This prevents rendering authenticated UI before the Convex user row exists.

---

## Convex

### Always use auth middleware, never raw functions

Never export a raw `query()` or `mutation()`. Always use the wrappers from `convex/functions.ts`:

```tsx
// GOOD
export const list = authQuery({ ... });
export const snapshot = adminQuery({ ... });

// BAD - no auth check
export const list = query({ ... });
```

The middleware automatically:
- Checks `ctx.auth.getUserIdentity()`
- Looks up the user row
- Provides `ctx.user` to your handler
- Returns 401 if not authenticated

### "skip" pattern for conditional queries

When a query shouldn't run (e.g., user not loaded yet), pass `"skip"` as the second argument:

```tsx
const data = useQuery(api.users.account.getMe, isAuthenticated ? {} : "skip");
```

This tells Convex to not execute the query until the condition is met.

### Convex can't import site-config.ts

Convex bundles its functions independently from your frontend. It can't import files from outside the `convex/` directory. For values that need to be in Convex functions (trusted origins, bundle IDs, admin emails), hardcode them in the Convex files and document them in SETUP.md. Admin emails ship as `[user-email]` in `convex/admin/auth.ts`.

---

## NativeWind / Styling

### Custom CVA implementation

The npm `class-variance-authority` package has export resolution issues with Metro bundler. The boilerplate includes a custom minimal implementation in `lib/cva.ts` that works reliably.

```tsx
import { cva, type VariantProps } from "@/lib/cva";

const buttonVariants = cva("rounded-full px-4 py-2", {
  variants: {
    variant: {
      default: "bg-primary",
      outline: "border border-border",
    },
  },
  defaultVariants: { variant: "default" },
});
```

### cn() utility

`lib/utils.ts` exports `cn()` (clsx + tailwind-merge). Use it everywhere for conditional classes:

```tsx
<View className={cn("flex-1", isActive && "bg-primary")} />
```

### CSS variables for theming

Colors are defined as CSS custom properties in `global.css` and referenced via Tailwind:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 10%;
}
```

```tsx
<View className="bg-background text-foreground" />
```

---

## PostHog Analytics

### safeCapture prevents crashes

Never call `posthog.capture()` directly. Use the `safeCapture()` wrapper from `lib/posthog.ts`:

```tsx
import { safeCapture } from "@/lib/posthog";
safeCapture("event_name", { property: "value" });
```

It wraps the call in `InteractionManager.runAfterInteractions()` to prevent blocking animations, and try-catches to prevent crashes if PostHog is misconfigured.

### Graceful degradation

PostHog is disabled when the API key is missing or is the placeholder value. Analytics is fully optional - the app works fine without it.

---

## Storage (Cloudflare R2)

### Presigned URL expiry

Upload URLs from `convex/storage/r2.ts` expire after 3600 seconds (1 hour). If a user takes too long, the upload will fail. The download function provides both signed and public URLs - prefer public URLs for display.

### Direct client uploads

The pattern is:
1. Client calls Convex action to get a presigned upload URL
2. Client PUTs the file directly to R2 (no server relay)
3. Client tells Convex the upload is done with the R2 key

This avoids sending large files through your backend.

---

## GDPR / Account Deletion

### Manual cascade, not automatic

`convex/users/account.ts` has an `anonymizeAccount` mutation that:
- Replaces email with a placeholder
- Sets `anonymizedAt` timestamp
- Preserves the row for data integrity (foreign keys)

If your app has more tables referencing the user, you need to add cleanup logic for each one manually. Convex doesn't have cascading deletes.

---

## Platform-Specific Patterns

### NOOP pattern for unavailable features

When a feature is platform-specific (like Apple IAP on Android), return a no-op object instead of crashing:

```tsx
const NOOP_IAP = {
  connected: false,
  product: null,
  loading: false,
  purchase: async () => {},
  finishCurrentTransaction: async () => {},
  error: null,
};

export function useAppleIAP() {
  if (Platform.OS !== "ios") return NOOP_IAP;
  return useAppleIAPInternal();
}
```

This lets you call `iap.purchase()` on any platform without conditional checks everywhere.

### expo-image + cssInterop

`expo-image` needs `cssInterop` to work with NativeWind className:

```tsx
import { Image as ExpoImage } from "expo-image";
import { cssInterop } from "nativewind";
cssInterop(ExpoImage, { className: "style" });
```

This is done once in `app/_layout.tsx` and applies globally.

---

## File Conventions

- **kebab-case** for all file names (`auth-store.tsx`, not `AuthStore.tsx`)
- **No index.ts barrel exports** - import directly from the file
- **No comments** unless the code is genuinely non-obvious
- **Convex functions**: one file per domain (e.g. `users/account.ts`, `admin/queries.ts`)
- **Components**: one component per file, exports the component + its variant function
