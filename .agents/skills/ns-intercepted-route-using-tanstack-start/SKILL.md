---
name: ns-intercepted-route-using-tanstack-start
description: Implement masked modal detail routes in the NowStack Mobile web-app with TanStack Router masks. Use for intercepted routes, shareable detail URLs, back-to-close, and refresh-to-full-page behavior.
disable-model-invocation: true
---

# Intercepted Route - TanStack Start

Scope: `web-app/` only. Goal: clicking a row opens the detail as a modal over the list while the URL shows the real detail route; refresh or direct visit renders the full page.

## Inspect

Admin list/detail routes follow this shape (example: users; payments uses `$entitlementId` the same way):

- `web-app/app/routes/admin/users/route.tsx` - layout, renders only `<Outlet />` + `pendingComponent`.
- `web-app/app/routes/admin/users/index.tsx` - list, `createFileRoute("/admin/users/")`. Rows link from `web-app/app/components/admin/users/users-table.tsx`.
- `web-app/app/routes/admin/users/$userId.tsx` - full detail page. Keep it real and directly visitable.
- The admin guard lives in `web-app/app/routes/admin/route.tsx`; do not bypass it.

## Act

1. Source (index) route owns modal state in search:
   ```tsx
   export const Route = createFileRoute("/admin/users/")({
     validateSearch: (s: Record<string, unknown>): { userId?: string } => ({
       userId: typeof s.userId === "string" && s.userId.length > 0 ? s.userId : undefined,
     }),
     component: UsersPage,
     pendingComponent: AdminUsersPageSkeleton,
   });
   ```
2. Link to the source with a mask of the destination:
   ```tsx
   <Link
     to="/admin/users/"
     search={{ userId: user._id }}
     mask={{ to: "/admin/users/$userId", params: { userId: user._id }, unmaskOnReload: true }}
     resetScroll={false}
   >
   ```
3. Render the modal/sheet (via the project dialog/sheet primitives) when `userId` is set; reuse the detail page's cards, not a copy.
4. Close:
   ```tsx
   const router = useRouter();
   const location = useLocation();
   const closeModal = () => {
     if (location.maskedLocation) return router.history.back();
     void router.navigate({ to: "/admin/users/", search: {}, replace: true });
   };
   ```
   "Open full page" navigates straight to `{ to: "/admin/users/$userId", params, replace: true }` without calling `closeModal` first.

Never expose modal state as a visible `?modal=` URL.

## Verify

`cd web-app && npm run typecheck && npm run build`, then with `dev-browser`: open the list, click a row, confirm the URL is the detail URL and the modal sits over the list, Back/close returns to the list, and refresh on the detail URL renders the full page.

Return the files changed and the browser evidence.
