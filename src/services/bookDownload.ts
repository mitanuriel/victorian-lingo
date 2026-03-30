/**
 * Book Download Service
 *
 * Handles downloading plain-text book content from Project Gutenberg mirrors
 * and caching it to the local filesystem via expo-file-system.
 *
 * Respects PG's ToS: minimum 2-second delay between requests,
 * and uses proper User-Agent identification.
 */

import * as FileSystem from 'expo-file-system';
import { resolveTextUrl } from './gutendex';
import type { GutendexBook } from '@models';

const BOOKS_DIR = `${FileSystem.documentDirectory}books/`;
const MIN_REQUEST_DELAY_MS = 2000;

let lastRequestTime = 0;

async function respectRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_DELAY_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_DELAY_MS - elapsed)
    );
  }
  lastRequestTime = Date.now();
}

async function ensureBooksDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(BOOKS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(BOOKS_DIR, { intermediates: true });
  }
}

function localPathForBook(gutenbergId: number): string {
  return `${BOOKS_DIR}${gutenbergId}.txt`;
}

/**
 * Check whether a book is already cached locally.
 */
export async function isBookCached(gutenbergId: number): Promise<boolean> {
  const path = localPathForBook(gutenbergId);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists && (info as FileSystem.FileInfo & { size?: number }).size !== undefined
    ? ((info as FileSystem.FileInfo & { size: number }).size > 0)
    : false;
}

/**
 * Get the local file path for a cached book, or null if not cached.
 */
export async function getCachedPath(gutenbergId: number): Promise<string | null> {
  const cached = await isBookCached(gutenbergId);
  return cached ? localPathForBook(gutenbergId) : null;
}

/**
 * Download a book's plain text and cache it locally.
 * Reports download progress via the onProgress callback (0–1).
 *
 * Throws if no plain-text URL is available or download fails.
 */
export async function downloadBook(
  book: GutendexBook,
  onProgress?: (progress: number) => void
): Promise<string> {
  await ensureBooksDir();
  await respectRateLimit();

  const textUrl = resolveTextUrl(book.formats);
  if (!textUrl) {
    throw new Error(`No plain-text format available for book ${book.id}: ${book.title}`);
  }

  const localPath = localPathForBook(book.id);

  const downloadResumable = FileSystem.createDownloadResumable(
    textUrl,
    localPath,
    {
      headers: {
        'User-Agent':
          'VictorianLingo/1.0 (language learning app; contact via github.com/mitanuriel/victorian-lingo)',
      },
    },
    (downloadProgress) => {
      const progress =
        downloadProgress.totalBytesExpectedToWrite > 0
          ? downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite
          : 0;
      onProgress?.(progress);
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result || result.status !== 200) {
    // Clean up partial file
    await FileSystem.deleteAsync(localPath, { idempotent: true });
    throw new Error(`Download failed for book ${book.id} (status ${result?.status})`);
  }

  return localPath;
}

/**
 * Read a cached book's full text from the local filesystem.
 */
export async function readCachedBook(gutenbergId: number): Promise<string> {
  const path = localPathForBook(gutenbergId);
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    throw new Error(`Book ${gutenbergId} is not cached locally.`);
  }
  return FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

/**
 * Delete a cached book to free storage.
 */
export async function deleteCachedBook(gutenbergId: number): Promise<void> {
  const path = localPathForBook(gutenbergId);
  await FileSystem.deleteAsync(path, { idempotent: true });
}

/**
 * Split raw Gutenberg plain text into chapters/sections.
 * Gutenberg texts use "CHAPTER" or Roman numeral headings.
 */
export function splitIntoChapters(text: string): Array<{ title: string; content: string }> {
  // Strip PG header/footer boilerplate
  const startMarker = /\*\*\* START OF THE PROJECT GUTENBERG/i;
  const endMarker = /\*\*\* END OF THE PROJECT GUTENBERG/i;

  let body = text;
  const startMatch = startMarker.exec(text);
  if (startMatch) {
    body = text.slice(startMatch.index + startMatch[0].length);
    const nextLine = body.indexOf('\n');
    body = body.slice(nextLine + 1);
  }
  const endMatch = endMarker.exec(body);
  if (endMatch) {
    body = body.slice(0, endMatch.index);
  }

  // Split on chapter headings
  const chapterRegex =
    /^(CHAPTER\s+[IVXLCDM\d]+\.?.*|CHAPTER\s+(?:THE\s+)?\w+.*|PART\s+[IVXLCDM\d]+\.?.*)/im;

  const parts = body.split(chapterRegex).filter((p) => p.trim().length > 0);

  if (parts.length < 2) {
    // No clear chapters — return as single section
    return [{ title: 'Text', content: body.trim() }];
  }

  const chapters: Array<{ title: string; content: string }> = [];
  for (let i = 0; i < parts.length - 1; i += 2) {
    chapters.push({
      title: parts[i].trim(),
      content: parts[i + 1]?.trim() ?? '',
    });
  }

  return chapters;
}
