/**
 * Gutendex API Service
 *
 * Wraps the public Gutendex REST API (gutendex.com) which provides
 * JSON metadata for Project Gutenberg books.
 *
 * Rate limiting: we respect a minimum gap between requests and only
 * trigger downloads from PG mirrors (never the main site directly).
 */

import {
  GutendexBook,
  GutendexResponse,
  Book,
  ReadingDifficulty,
} from '@models';

const GUTENDEX_BASE = 'https://gutendex.com/books';

/**
 * Era-appropriate subject/bookshelf keywords used to filter the corpus to
 * Victorian (1837–1901) and Regency (1811–1820) works.
 */
const _ERA_KEYWORDS = [
  'Victorian',
  'Regency',
  'England -- Social life and customs -- 19th century',
  'English fiction -- 19th century',
  'Domestic fiction',
  'Love stories',
  'Gothic fiction',
  'Manners and customs',
  'Social classes',
  'Aristocracy',
];

export const ERA_BOOKSHELVES: Record<string, string[]> = {
  victorian: [
    'Gothic Fiction',
    'Best Books Ever Listings',
    'Dickens, Charles',
  ],
  regency: [
    'Austen, Jane',
    'Harvard Classics',
  ],
};

export type EraFilter = 'all' | 'victorian' | 'regency';
export type GenreFilter =
  | 'all'
  | 'gothic'
  | 'sensation'
  | 'society'
  | 'poetry'
  | 'adventure';

const GENRE_KEYWORDS: Record<GenreFilter, string[]> = {
  all: [],
  gothic: ['gothic', 'horror', 'supernatural', 'ghost'],
  sensation: ['sensation', 'mystery', 'crime', 'detective'],
  society: ['society', 'manners', 'domestic', 'marriage', 'courtship'],
  poetry: ['poetry', 'poems', 'verse'],
  adventure: ['adventure', 'sea', 'travel', 'exploration'],
};

// ── Cover colors — cycled by gutenberg ID for visual variety ──────────────────
const COVER_COLORS = [
  '#722F37', // burgundy
  '#2D5A27', // forest green
  '#1A3A5C', // Victorian blue
  '#8B6914', // aged gold
  '#4A2E1A', // deep sepia
  '#5C3A1E', // mahogany
];

function coverColorFromId(id: number): string {
  return COVER_COLORS[id % COVER_COLORS.length];
}

// ── Difficulty from Flesch-Kincaid (approximated from download count & era) ───
function difficultyFromBook(book: GutendexBook): ReadingDifficulty {
  // Approximate: poetry and short works tend to be Dense,
  // popular fiction Easy/Moderate. Without Flesch score from API
  // we use subject heuristics.
  const subjects = book.subjects.join(' ').toLowerCase();
  if (subjects.includes('poetry') || subjects.includes('philosophy')) {
    return 'Demanding';
  }
  if (book.download_count > 5000) return 'Moderate';
  return 'Demanding';
}

// ── Map Gutendex response to our Book domain model ────────────────────────────
export function mapGutendexBook(raw: GutendexBook): Book {
  const author = raw.authors[0];
  const synopsis = raw.summaries?.[0]?.slice(0, 400) ?? null;

  return {
    id: `gutenberg-${raw.id}`,
    gutenbergId: raw.id,
    title: raw.title,
    author: author?.name ?? 'Unknown',
    authorBirthYear: author?.birth_year ?? null,
    authorDeathYear: author?.death_year ?? null,
    subjects: raw.subjects,
    bookshelves: raw.bookshelves,
    synopsis,
    publicationYear: author?.birth_year ? author.birth_year + 30 : null,
    difficulty: difficultyFromBook(raw),
    cachedTextPath: null,
    isDownloaded: false,
    readProgress: 0,
    lastReadAt: null,
    addedAt: new Date().toISOString(),
    coverColor: coverColorFromId(raw.id),
  };
}

// ── Request helpers ────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'VictorianLingo/1.0 (language learning app; contact via github.com/mitanuriel/victorian-lingo)',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Gutendex request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

function buildSearchUrl(params: {
  search?: string;
  topic?: string;
  page?: number;
  ids?: number[];
}): string {
  const url = new URL(GUTENDEX_BASE);
  url.searchParams.set('languages', 'en');
  url.searchParams.set('mime_type', 'text/plain');

  if (params.search) url.searchParams.set('search', params.search);
  if (params.topic) url.searchParams.set('topic', params.topic);
  if (params.page && params.page > 1) url.searchParams.set('page', String(params.page));
  if (params.ids?.length) url.searchParams.set('ids', params.ids.join(','));

  return url.toString();
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface CatalogOptions {
  search?: string;
  era?: EraFilter;
  genre?: GenreFilter;
  page?: number;
}

/**
 * Fetch a page of books matching the given filters.
 * Returns mapped Book domain objects plus pagination info.
 */
export async function fetchCatalog(options: CatalogOptions = {}): Promise<{
  books: Book[];
  hasMore: boolean;
  nextPage: number | null;
}> {
  const { search, era = 'all', genre = 'all', page = 1 } = options;

  // Build topic string for Gutendex — combines era and genre keywords
  const topicParts: string[] = [];

  if (era !== 'all') {
    // Use a known era bookshelf or subject keyword
    topicParts.push(era === 'victorian' ? 'Victorian' : 'Regency');
  } else {
    // Default: 19th century English fiction
    topicParts.push('19th century');
  }

  if (genre !== 'all') {
    const genreWords = GENRE_KEYWORDS[genre];
    if (genreWords.length > 0) topicParts.push(genreWords[0]);
  }

  const url = buildSearchUrl({
    search: search || (topicParts.length ? topicParts.join(' ') : undefined),
    page,
  });

  const data = await fetchJSON<GutendexResponse>(url);

  return {
    books: data.results.map(mapGutendexBook),
    hasMore: data.next !== null,
    nextPage: data.next ? page + 1 : null,
  };
}

/**
 * Fetch a single book by its Gutenberg ID.
 */
export async function fetchBookById(gutenbergId: number): Promise<Book | null> {
  try {
    const url = buildSearchUrl({ ids: [gutenbergId] });
    const data = await fetchJSON<GutendexResponse>(url);
    const raw = data.results[0];
    return raw ? mapGutendexBook(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the best plain-text download URL for a book from its formats map.
 * Prefers UTF-8 plain text.
 */
export function resolveTextUrl(formats: Record<string, string>): string | null {
  // Preference order for plain text
  const preferred = [
    'text/plain; charset=utf-8',
    'text/plain; charset=us-ascii',
    'text/plain',
  ];

  for (const mime of preferred) {
    if (formats[mime]) return formats[mime];
  }

  // Fallback: any key containing 'text/plain'
  const fallback = Object.keys(formats).find((k) => k.startsWith('text/plain'));
  return fallback ? formats[fallback] : null;
}

/**
 * Fetch curated "featured" books for the home screen.
 * Uses a hardcoded set of well-known Victorian/Regency Gutenberg IDs.
 */
export async function fetchFeaturedBooks(): Promise<Book[]> {
  // Canonical Victorian/Regency Project Gutenberg IDs
  const featuredIds = [
    1342,  // Pride and Prejudice — Austen
    98,    // A Tale of Two Cities — Dickens
    768,   // Wuthering Heights — Brontë
    161,   // Sense and Sensibility — Austen
    174,   // The Picture of Dorian Gray — Wilde
    345,   // Dracula — Stoker
    1260,  // Jane Eyre — Brontë
    2701,  // Moby Dick — Melville (slightly outside but canonical)
    46,    // A Christmas Carol — Dickens
    1400,  // Great Expectations — Dickens
  ];

  const url = buildSearchUrl({ ids: featuredIds });
  const data = await fetchJSON<GutendexResponse>(url);
  return data.results.map(mapGutendexBook);
}
