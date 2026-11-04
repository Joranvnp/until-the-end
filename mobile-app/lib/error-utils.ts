/**
 * Type-safe error code extraction for native module errors (Apple auth,
 * IAP) without casting beyond a guarded property access.
 */
export function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as Record<string, unknown>).code;
    if (typeof code === 'string') {
      return code;
    }
  }
  return undefined;
}

/**
 * Safely extract the packageNameAndroid property from an IAP purchase.
 * Returns the fallback if the property is missing or not a string.
 */
export function getPackageName(purchase: unknown, fallback: string): string {
  if (typeof purchase === 'object' && purchase !== null && 'packageNameAndroid' in purchase) {
    const packageName = (purchase as Record<string, unknown>).packageNameAndroid;
    if (typeof packageName === 'string') {
      return packageName;
    }
  }
  return fallback;
}
