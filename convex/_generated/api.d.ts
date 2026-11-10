/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_auth from "../admin/auth.js";
import type * as admin_metrics from "../admin/metrics.js";
import type * as admin_mutations from "../admin/mutations.js";
import type * as admin_queries from "../admin/queries.js";
import type * as admin_queries_helpers from "../admin/queries_helpers.js";
import type * as auth from "../auth.js";
import type * as email from "../email.js";
import type * as emailActions from "../emailActions.js";
import type * as emailTags from "../emailTags.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as emails_logoAsset from "../emails/logoAsset.js";
import type * as functions from "../functions.js";
import type * as http from "../http.js";
import type * as markdownEmail from "../markdownEmail.js";
import type * as payments_entitlements from "../payments/entitlements.js";
import type * as payments_iap from "../payments/iap.js";
import type * as payments_stripe from "../payments/stripe.js";
import type * as siteConfig from "../siteConfig.js";
import type * as storage_r2 from "../storage/r2.js";
import type * as users_account from "../users/account.js";
import type * as users_emails from "../users/emails.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/auth": typeof admin_auth;
  "admin/metrics": typeof admin_metrics;
  "admin/mutations": typeof admin_mutations;
  "admin/queries": typeof admin_queries;
  "admin/queries_helpers": typeof admin_queries_helpers;
  auth: typeof auth;
  email: typeof email;
  emailActions: typeof emailActions;
  emailTags: typeof emailTags;
  emailTemplates: typeof emailTemplates;
  "emails/logoAsset": typeof emails_logoAsset;
  functions: typeof functions;
  http: typeof http;
  markdownEmail: typeof markdownEmail;
  "payments/entitlements": typeof payments_entitlements;
  "payments/iap": typeof payments_iap;
  "payments/stripe": typeof payments_stripe;
  siteConfig: typeof siteConfig;
  "storage/r2": typeof storage_r2;
  "users/account": typeof users_account;
  "users/emails": typeof users_emails;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
  lumail: import("@lumail/convex/_generated/component.js").ComponentApi<"lumail">;
};
