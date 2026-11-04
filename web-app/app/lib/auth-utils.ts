export const DEFAULT_AUTH_CALLBACK_URL = "/app";
const AUTH_CALLBACK_BASE_URL = "https://nowstack.local";
const ENCODED_CONTROL_OR_BACKSLASH = /%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/i;
const RAW_CONTROL_OR_BACKSLASH = /[\u0000-\u001f\u007f\\]/;

export type AuthSearch = {
  callbackUrl: string;
  email?: string;
};

export function normalizeAuthCallbackUrl(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_AUTH_CALLBACK_URL;
  }

  const callbackUrl = value.trim();
  if (
    !callbackUrl ||
    !callbackUrl.startsWith("/") ||
    callbackUrl.startsWith("//") ||
    RAW_CONTROL_OR_BACKSLASH.test(callbackUrl) ||
    ENCODED_CONTROL_OR_BACKSLASH.test(callbackUrl)
  ) {
    return DEFAULT_AUTH_CALLBACK_URL;
  }

  let parsed: URL;
  try {
    parsed = new URL(callbackUrl, AUTH_CALLBACK_BASE_URL);
  } catch {
    return DEFAULT_AUTH_CALLBACK_URL;
  }

  if (parsed.origin !== AUTH_CALLBACK_BASE_URL) {
    return DEFAULT_AUTH_CALLBACK_URL;
  }

  const pathname = parsed.pathname;
  if (pathname === "/auth" || pathname.startsWith("/auth/")) {
    return DEFAULT_AUTH_CALLBACK_URL;
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function buildAuthSignInUrl(callbackUrl: string): string {
  const search = new URLSearchParams({
    callbackUrl: normalizeAuthCallbackUrl(callbackUrl),
  });
  return `/auth/signin?${search.toString()}`;
}

export function normalizeAuthEmail(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const email = value.trim().toLowerCase();
  return email ? email : undefined;
}

export function validateAuthSearch(
  search: Record<string, unknown>,
): AuthSearch {
  return {
    callbackUrl: normalizeAuthCallbackUrl(search.callbackUrl),
    email: normalizeAuthEmail(search.email),
  };
}
