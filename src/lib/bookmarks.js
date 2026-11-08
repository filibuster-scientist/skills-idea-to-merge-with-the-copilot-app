const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BOOKMARK_SLUG_PATTERN = /^mona-[0-9a-zA-Z]{4}$/;

export const STORAGE_KEY = 'mona-bookmarks';

export function normalizeBookmarkUrl(input) {
  if (typeof input !== 'string') {
    throw new TypeError('Bookmark URL must be a string.');
  }

  const value = input.trim();
  if (!value) {
    throw new TypeError('Bookmark URL cannot be empty.');
  }

  const protocol = value.match(/^([a-z][a-z\d+.-]*):\/\//i)?.[1]?.toLowerCase();
  if (protocol && protocol !== 'http' && protocol !== 'https') {
    throw new TypeError('Bookmark URL must use HTTP or HTTPS.');
  }

  const withoutProtocolRelativePrefix = value.startsWith('//') ? value.slice(2) : value;
  const candidate = protocol ? value : `https://${withoutProtocolRelativePrefix}`;
  const url = new URL(candidate);
  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || !url.hostname) {
    throw new TypeError('Bookmark URL must be a valid web address.');
  }

  return url.href;
}

export function createBookmarkSlug() {
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  let suffix = '';

  for (const byte of bytes) {
    suffix += BASE62[byte % BASE62.length];
  }

  return `mona-${suffix}`;
}

export function decodeBookmarks(serialized) {
  if (typeof serialized !== 'string' || serialized.length === 0) {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const bookmarks = [];
  const seenSlugs = new Set();
  for (const entry of parsed) {
    if (
      entry === null
      || typeof entry !== 'object'
      || Array.isArray(entry)
      || typeof entry.url !== 'string'
      || typeof entry.slug !== 'string'
      || !BOOKMARK_SLUG_PATTERN.test(entry.slug)
      || seenSlugs.has(entry.slug)
    ) {
      continue;
    }

    try {
      const url = normalizeBookmarkUrl(entry.url);
      bookmarks.push({ url, slug: entry.slug });
      seenSlugs.add(entry.slug);
    } catch {
      // Discard malformed storage entries and continue loading valid ones.
    }
  }

  return bookmarks;
}

export function formatBookmark({ url, slug }) {
  return `${url} :: ${slug}`;
}
