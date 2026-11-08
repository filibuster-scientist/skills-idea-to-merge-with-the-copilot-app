import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodeBookmarks,
  formatBookmark,
  normalizeBookmarkUrl,
} from '../src/lib/bookmarks.js';

test('normalizes URLs with and without https to the same saved value', () => {
  assert.equal(
    normalizeBookmarkUrl('www.example.com'),
    normalizeBookmarkUrl('https://www.example.com'),
  );
  assert.equal(normalizeBookmarkUrl('www.example.com'), 'https://www.example.com/');
});

test('recovers empty, corrupted, legacy, and non-array storage without throwing', () => {
  const invalidStorageValues = [
    null,
    '',
    '{corrupted',
    JSON.stringify(['https://www.example.com']),
    JSON.stringify({ url: 'https://www.example.com', slug: 'mona-7fk2' }),
  ];

  for (const value of invalidStorageValues) {
    assert.doesNotThrow(() => decodeBookmarks(value));
    assert.deepEqual(decodeBookmarks(value), []);
  }
});

test('drops malformed entries while retaining valid bookmarks from storage', () => {
  const serialized = JSON.stringify([
    { url: 'https://www.example.com', slug: 'mona-7fk2' },
    { url: 'javascript://invalid.example', slug: 'mona-4ABz' },
    { url: 'https://www.example.org', slug: 'not-a-slug' },
  ]);

  assert.deepEqual(decodeBookmarks(serialized), [
    { url: 'https://www.example.com/', slug: 'mona-7fk2' },
  ]);
});

test('formats a saved bookmark with the exact visible separator', () => {
  assert.equal(
    formatBookmark({ url: 'https://www.example.com', slug: 'mona-7fk2' }),
    'https://www.example.com :: mona-7fk2',
  );
});
