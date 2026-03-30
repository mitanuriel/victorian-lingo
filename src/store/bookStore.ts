/**
 * Book Store
 *
 * Manages the library catalog, download state, and reading progress.
 * Uses Zustand with persistence backed by SQLite.
 */

import { create } from 'zustand';
import type { Book, BookSummary } from '@models';
import * as db from '@services/database';
import { fetchCatalog, fetchFeaturedBooks, type CatalogOptions } from '@services/gutendex';

interface BookStore {
  // State
  books: Record<string, Book>;          // keyed by book.id
  featured: string[];                   // IDs of featured books
  catalogIds: string[];                 // IDs from last catalog fetch
  hasMore: boolean;
  currentPage: number;
  isLoadingCatalog: boolean;
  isLoadingFeatured: boolean;
  catalogError: string | null;
  activeBookId: string | null;          // book currently open in reader

  // Actions
  loadFeatured: () => Promise<void>;
  loadCatalog: (options?: CatalogOptions) => Promise<void>;
  loadNextPage: () => Promise<void>;
  loadFromDb: () => Promise<void>;
  setActiveBook: (id: string | null) => void;
  updateProgress: (id: string, progress: number) => Promise<void>;
  markDownloaded: (id: string, path: string) => Promise<void>;
  upsertBook: (book: Book) => Promise<void>;

  // Selectors (derived)
  getBook: (id: string) => Book | undefined;
  getFeaturedBooks: () => BookSummary[];
  getCatalogBooks: () => BookSummary[];
  getDownloadedBooks: () => Book[];
}

let _lastCatalogOptions: CatalogOptions = {};

export const useBookStore = create<BookStore>((set, get) => ({
  books: {},
  featured: [],
  catalogIds: [],
  hasMore: true,
  currentPage: 1,
  isLoadingCatalog: false,
  isLoadingFeatured: false,
  catalogError: null,
  activeBookId: null,

  loadFeatured: async () => {
    set({ isLoadingFeatured: true });
    try {
      const books = await fetchFeaturedBooks();
      const map: Record<string, Book> = {};
      books.forEach((b) => (map[b.id] = b));

      // Merge with existing (respect local download state)
      const existing = get().books;
      const merged: Record<string, Book> = { ...map };
      books.forEach((b) => {
        if (existing[b.id]) {
          merged[b.id] = {
            ...b,
            isDownloaded: existing[b.id].isDownloaded,
            cachedTextPath: existing[b.id].cachedTextPath,
            readProgress: existing[b.id].readProgress,
            lastReadAt: existing[b.id].lastReadAt,
          };
        }
      });

      set({
        books: { ...existing, ...merged },
        featured: books.map((b) => b.id),
        isLoadingFeatured: false,
      });
    } catch (_e) {
      set({ isLoadingFeatured: false });
    }
  },

  loadCatalog: async (options?: CatalogOptions) => {
    _lastCatalogOptions = options ?? {};
    set({ isLoadingCatalog: true, catalogError: null, currentPage: 1 });
    try {
      const { books, hasMore, nextPage } = await fetchCatalog({ ...options, page: 1 });
      const map: Record<string, Book> = { ...get().books };
      books.forEach((b) => { map[b.id] = b; });

      set({
        books: map,
        catalogIds: books.map((b) => b.id),
        hasMore,
        currentPage: nextPage ? nextPage - 1 : 1,
        isLoadingCatalog: false,
      });
    } catch (_e) {
      set({
        isLoadingCatalog: false,
        catalogError: 'Unable to reach the library. Check your connection.',
      });
    }
  },

  loadNextPage: async () => {
    const { hasMore, isLoadingCatalog, currentPage, catalogIds } = get();
    if (!hasMore || isLoadingCatalog) return;

    set({ isLoadingCatalog: true });
    try {
      const { books, hasMore: more, nextPage } = await fetchCatalog({
        ..._lastCatalogOptions,
        page: currentPage + 1,
      });
      const map: Record<string, Book> = { ...get().books };
      books.forEach((b) => { map[b.id] = b; });

      set({
        books: map,
        catalogIds: [...catalogIds, ...books.map((b) => b.id)],
        hasMore: more,
        currentPage: (nextPage ?? currentPage + 1) - 1,
        isLoadingCatalog: false,
      });
    } catch {
      set({ isLoadingCatalog: false });
    }
  },

  loadFromDb: async () => {
    const dbBooks = await db.getAllBooks();
    if (dbBooks.length === 0) return;
    const map: Record<string, Book> = {};
    dbBooks.forEach((b) => (map[b.id] = b));
    set((state) => ({ books: { ...state.books, ...map } }));
  },

  setActiveBook: (id) => set({ activeBookId: id }),

  updateProgress: async (id, progress) => {
    await db.updateReadProgress(id, progress);
    set((state) => ({
      books: {
        ...state.books,
        [id]: { ...state.books[id], readProgress: progress, lastReadAt: new Date().toISOString() },
      },
    }));
  },

  markDownloaded: async (id, path) => {
    await db.markBookDownloaded(id, path);
    set((state) => ({
      books: {
        ...state.books,
        [id]: { ...state.books[id], isDownloaded: true, cachedTextPath: path },
      },
    }));
  },

  upsertBook: async (book) => {
    await db.upsertBook(book);
    set((state) => ({ books: { ...state.books, [book.id]: book } }));
  },

  getBook: (id) => get().books[id],

  getFeaturedBooks: () =>
    get().featured.map((id) => get().books[id]).filter(Boolean) as BookSummary[],

  getCatalogBooks: () =>
    get().catalogIds.map((id) => get().books[id]).filter(Boolean) as BookSummary[],

  getDownloadedBooks: () =>
    Object.values(get().books).filter((b) => b.isDownloaded),
}));
