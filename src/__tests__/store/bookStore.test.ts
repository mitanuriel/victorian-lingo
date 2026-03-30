/**
 * Unit tests for bookStore — US-003, US-006
 *
 * Tests the store's progress and download state mutations without
 * touching the database (sqlite mock is in place).
 */

import { useBookStore } from '@store/bookStore';
import type { Book } from '@models';

// Reset store state between tests
beforeEach(() => {
  useBookStore.setState({
    books: {},
    featured: [],
    catalogIds: [],
    hasMore: true,
    currentPage: 1,
    isLoadingCatalog: false,
    isLoadingFeatured: false,
    catalogError: null,
    activeBookId: null,
  });
});

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book-1',
    gutenbergId: 1342,
    title: 'Pride and Prejudice',
    author: 'Austen, Jane',
    authorBirthYear: 1775,
    authorDeathYear: 1817,
    subjects: ['England -- Fiction'],
    bookshelves: ['Best Books Ever Listings'],
    synopsis: null,
    publicationYear: 1813,
    difficulty: 'Moderate',
    cachedTextPath: null,
    isDownloaded: false,
    readProgress: 0,
    lastReadAt: null,
    addedAt: new Date().toISOString(),
    coverColor: '#722F37',
    ...overrides,
  };
}

// ── getBook ────────────────────────────────────────────────────────────────────

describe('bookStore.getBook', () => {
  it('returns undefined for an unknown id', () => {
    const result = useBookStore.getState().getBook('nonexistent');
    expect(result).toBeUndefined();
  });

  it('returns the book after it is added to state', () => {
    const book = makeBook();
    useBookStore.setState({ books: { [book.id]: book } });
    const result = useBookStore.getState().getBook(book.id);
    expect(result).toEqual(book);
  });
});

// ── getFeaturedBooks ──────────────────────────────────────────────────────────

describe('bookStore.getFeaturedBooks', () => {
  it('returns an empty array when featured list is empty', () => {
    expect(useBookStore.getState().getFeaturedBooks()).toEqual([]);
  });

  it('returns BookSummary records for each featured id', () => {
    const book = makeBook();
    useBookStore.setState({ books: { [book.id]: book }, featured: [book.id] });
    const results = useBookStore.getState().getFeaturedBooks();
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(book.id);
    expect(results[0].title).toBe(book.title);
  });

  it('silently ignores dangling featured ids with no matching book', () => {
    useBookStore.setState({ books: {}, featured: ['ghost-id'] });
    expect(useBookStore.getState().getFeaturedBooks()).toHaveLength(0);
  });
});

// ── getCatalogBooks ───────────────────────────────────────────────────────────

describe('bookStore.getCatalogBooks', () => {
  it('returns catalog books in insertion order', () => {
    const b1 = makeBook({ id: 'a', title: 'Alpha' });
    const b2 = makeBook({ id: 'b', title: 'Beta' });
    useBookStore.setState({ books: { a: b1, b: b2 }, catalogIds: ['a', 'b'] });
    const results = useBookStore.getState().getCatalogBooks();
    expect(results.map((b) => b.id)).toEqual(['a', 'b']);
  });
});

// ── getDownloadedBooks ────────────────────────────────────────────────────────

describe('bookStore.getDownloadedBooks', () => {
  it('returns only books with isDownloaded=true', () => {
    const downloaded = makeBook({ id: 'd1', isDownloaded: true, cachedTextPath: '/books/1.txt' });
    const notDownloaded = makeBook({ id: 'd2', isDownloaded: false });
    useBookStore.setState({ books: { d1: downloaded, d2: notDownloaded } });
    const results = useBookStore.getState().getDownloadedBooks();
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('d1');
  });
});

// ── setActiveBook ─────────────────────────────────────────────────────────────

describe('bookStore.setActiveBook', () => {
  it('sets activeBookId', () => {
    useBookStore.getState().setActiveBook('book-1');
    expect(useBookStore.getState().activeBookId).toBe('book-1');
  });

  it('clears activeBookId when set to null', () => {
    useBookStore.setState({ activeBookId: 'book-1' });
    useBookStore.getState().setActiveBook(null);
    expect(useBookStore.getState().activeBookId).toBeNull();
  });
});

// ── updateProgress (state only) ───────────────────────────────────────────────

describe('bookStore.updateProgress', () => {
  it('updates readProgress and lastReadAt in state', async () => {
    const book = makeBook();
    useBookStore.setState({ books: { [book.id]: book } });
    await useBookStore.getState().updateProgress(book.id, 0.5);
    const updated = useBookStore.getState().getBook(book.id);
    expect(updated?.readProgress).toBe(0.5);
    expect(updated?.lastReadAt).not.toBeNull();
  });
});

// ── markDownloaded (state only) ───────────────────────────────────────────────

describe('bookStore.markDownloaded', () => {
  it('marks isDownloaded and stores the path', async () => {
    const book = makeBook();
    useBookStore.setState({ books: { [book.id]: book } });
    await useBookStore.getState().markDownloaded(book.id, '/local/path.txt');
    const updated = useBookStore.getState().getBook(book.id);
    expect(updated?.isDownloaded).toBe(true);
    expect(updated?.cachedTextPath).toBe('/local/path.txt');
  });
});
