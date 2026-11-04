const CF_RESIZING_PREFIX = '/cdn-cgi/image/';

type ImageSize = {
  width: number;
  height?: number;
  quality?: number;
};

export function getOptimizedUrl(url: string | null | undefined, size: ImageSize): string | null {
  if (!url) return null;
  if (!url.startsWith('http')) return url;

  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes(CF_RESIZING_PREFIX)) return url;

    const params = [
      `width=${size.width}`,
      size.height ? `height=${size.height}` : null,
      `fit=cover`,
      `format=webp`,
      `quality=${size.quality ?? 80}`,
    ]
      .filter(Boolean)
      .join(',');

    parsed.pathname = `${CF_RESIZING_PREFIX}${params}${parsed.pathname}`;
    return parsed.toString();
  } catch {
    return url;
  }
}
