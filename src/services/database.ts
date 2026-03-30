/**
 * SQLite Database Service
 *
 * Manages all local persistent data using expo-sqlite.
 * Handles books, vocabulary notebook, saved quotes, flashcard decks,
 * review history, reading sessions, and achievements.
 */

import * as SQLite from 'expo-sqlite';
import type {
  Book,
  VocabWord,
  SavedQuote,
  FlashcardDeck,
  FlashcardReview,
  Achievement,
  ReadingSession,
  UserSettings,
} from '@models';
import { DefaultSettings } from '@models';

const DB_NAME = 'victorian_lingo.db';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await initSchema(_db);
  return _db;
}

// ── Schema ────────────────────────────────────────────────────────────────────

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      gutenberg_id INTEGER UNIQUE NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      author_birth_year INTEGER,
      author_death_year INTEGER,
      subjects TEXT,           -- JSON array
      bookshelves TEXT,        -- JSON array
      synopsis TEXT,
      publication_year INTEGER,
      difficulty TEXT,
      cached_text_path TEXT,
      is_downloaded INTEGER DEFAULT 0,
      read_progress REAL DEFAULT 0,
      last_read_at TEXT,
      added_at TEXT NOT NULL,
      cover_color TEXT DEFAULT '#722F37'
    );

    CREATE TABLE IF NOT EXISTS vocab_words (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL,
      part_of_speech TEXT,
      phonetic TEXT,
      category_label TEXT NOT NULL,
      category_note TEXT,
      era_definition TEXT NOT NULL,
      modern_definition TEXT,
      example_sentence TEXT NOT NULL,
      book_id TEXT,
      book_title TEXT,
      saved_at TEXT NOT NULL,
      is_saved INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]'   -- JSON array
    );

    CREATE TABLE IF NOT EXISTS saved_quotes (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      book_id TEXT NOT NULL,
      book_title TEXT NOT NULL,
      author TEXT NOT NULL,
      chapter TEXT,
      char_offset INTEGER DEFAULT 0,
      saved_at TEXT NOT NULL,
      tags TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS flashcard_decks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      book_id TEXT,
      word_ids TEXT NOT NULL DEFAULT '[]', -- JSON array
      created_at TEXT NOT NULL,
      is_auto_generated INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS flashcard_reviews (
      id TEXT PRIMARY KEY,
      vocab_word_id TEXT NOT NULL,
      reviewed_at TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      interval_days INTEGER DEFAULT 1,
      ease_factor REAL DEFAULT 2.5,
      due_at TEXT NOT NULL,
      review_count INTEGER DEFAULT 0,
      accuracy_rate REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reading_sessions (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      type TEXT UNIQUE NOT NULL,
      earned_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default settings if not present
  await db.runAsync(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
    ['user_settings', JSON.stringify(DefaultSettings)]
  );
}

// ── Books ─────────────────────────────────────────────────────────────────────

export async function upsertBook(book: Book): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO books
      (id, gutenberg_id, title, author, author_birth_year, author_death_year,
       subjects, bookshelves, synopsis, publication_year, difficulty,
       cached_text_path, is_downloaded, read_progress, last_read_at, added_at, cover_color)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      book.id,
      book.gutenbergId,
      book.title,
      book.author,
      book.authorBirthYear ?? null,
      book.authorDeathYear ?? null,
      JSON.stringify(book.subjects),
      JSON.stringify(book.bookshelves),
      book.synopsis ?? null,
      book.publicationYear ?? null,
      book.difficulty ?? null,
      book.cachedTextPath ?? null,
      book.isDownloaded ? 1 : 0,
      book.readProgress,
      book.lastReadAt ?? null,
      book.addedAt,
      book.coverColor,
    ]
  );
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM books ORDER BY added_at DESC');
  return rows.map(rowToBook);
}

export async function getBookById(id: string): Promise<Book | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM books WHERE id = ?', [id]);
  return row ? rowToBook(row) : null;
}

export async function updateReadProgress(id: string, progress: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE books SET read_progress = ?, last_read_at = ? WHERE id = ?',
    [progress, new Date().toISOString(), id]
  );
}

export async function markBookDownloaded(id: string, path: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE books SET is_downloaded = 1, cached_text_path = ? WHERE id = ?',
    [path, id]
  );
}

function rowToBook(row: Record<string, unknown>): Book {
  return {
    id: row.id as string,
    gutenbergId: row.gutenberg_id as number,
    title: row.title as string,
    author: row.author as string,
    authorBirthYear: (row.author_birth_year as number | null) ?? null,
    authorDeathYear: (row.author_death_year as number | null) ?? null,
    subjects: JSON.parse((row.subjects as string | null) ?? '[]'),
    bookshelves: JSON.parse((row.bookshelves as string | null) ?? '[]'),
    synopsis: (row.synopsis as string | null) ?? null,
    publicationYear: (row.publication_year as number | null) ?? null,
    difficulty: (row.difficulty as Book['difficulty']) ?? null,
    cachedTextPath: (row.cached_text_path as string | null) ?? null,
    isDownloaded: (row.is_downloaded as number) === 1,
    readProgress: row.read_progress as number,
    lastReadAt: (row.last_read_at as string | null) ?? null,
    addedAt: row.added_at as string,
    coverColor: (row.cover_color as string) ?? '#722F37',
  };
}

// ── Vocabulary Words ──────────────────────────────────────────────────────────

export async function upsertVocabWord(word: VocabWord): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO vocab_words
      (id, word, part_of_speech, phonetic, category_label, category_note,
       era_definition, modern_definition, example_sentence, book_id, book_title,
       saved_at, is_saved, tags)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      word.id,
      word.word,
      word.partOfSpeech,
      word.phonetic ?? null,
      word.categoryLabel,
      word.categoryNote,
      word.eraDefinition,
      word.modernDefinition ?? null,
      word.exampleSentence,
      word.bookId ?? null,
      word.bookTitle ?? null,
      word.savedAt,
      word.isSaved ? 1 : 0,
      JSON.stringify(word.tags),
    ]
  );
}

export async function getSavedVocabWords(): Promise<VocabWord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM vocab_words WHERE is_saved = 1 ORDER BY saved_at DESC'
  );
  return rows.map(rowToVocabWord);
}

export async function getVocabWordsForBook(bookId: string): Promise<VocabWord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM vocab_words WHERE book_id = ? ORDER BY saved_at ASC',
    [bookId]
  );
  return rows.map(rowToVocabWord);
}

export async function setWordSaved(id: string, saved: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE vocab_words SET is_saved = ? WHERE id = ?', [saved ? 1 : 0, id]);
}

function rowToVocabWord(row: Record<string, unknown>): VocabWord {
  return {
    id: row.id as string,
    word: row.word as string,
    partOfSpeech: row.part_of_speech as string,
    phonetic: (row.phonetic as string | null) ?? null,
    categoryLabel: row.category_label as VocabWord['categoryLabel'],
    categoryNote: row.category_note as string,
    eraDefinition: row.era_definition as string,
    modernDefinition: (row.modern_definition as string | null) ?? null,
    exampleSentence: row.example_sentence as string,
    bookId: (row.book_id as string | null) ?? null,
    bookTitle: (row.book_title as string | null) ?? null,
    savedAt: row.saved_at as string,
    isSaved: (row.is_saved as number) === 1,
    tags: JSON.parse((row.tags as string | null) ?? '[]'),
  };
}

// ── Saved Quotes ──────────────────────────────────────────────────────────────

export async function saveQuote(quote: SavedQuote): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO saved_quotes
      (id, text, book_id, book_title, author, chapter, char_offset, saved_at, tags)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      quote.id,
      quote.text,
      quote.bookId,
      quote.bookTitle,
      quote.author,
      quote.chapter ?? null,
      quote.charOffset,
      quote.savedAt,
      JSON.stringify(quote.tags),
    ]
  );
}

export async function getAllQuotes(): Promise<SavedQuote[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM saved_quotes ORDER BY saved_at DESC'
  );
  return rows.map(rowToQuote);
}

export async function deleteQuote(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM saved_quotes WHERE id = ?', [id]);
}

function rowToQuote(row: Record<string, unknown>): SavedQuote {
  return {
    id: row.id as string,
    text: row.text as string,
    bookId: row.book_id as string,
    bookTitle: row.book_title as string,
    author: row.author as string,
    chapter: (row.chapter as string | null) ?? null,
    charOffset: (row.char_offset as number) ?? 0,
    savedAt: row.saved_at as string,
    tags: JSON.parse((row.tags as string | null) ?? '[]'),
  };
}

// ── Flashcard Reviews (SM-2) ──────────────────────────────────────────────────

export async function upsertReview(review: FlashcardReview): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO flashcard_reviews
      (id, vocab_word_id, reviewed_at, difficulty, interval_days,
       ease_factor, due_at, review_count, accuracy_rate)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      review.id,
      review.vocabWordId,
      review.reviewedAt,
      review.difficulty,
      review.intervalDays,
      review.easeFactor,
      review.dueAt,
      review.reviewCount,
      review.accuracyRate,
    ]
  );
}

export async function getReviewForWord(vocabWordId: string): Promise<FlashcardReview | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM flashcard_reviews WHERE vocab_word_id = ?',
    [vocabWordId]
  );
  if (!row) return null;
  return {
    id: row.id as string,
    vocabWordId: row.vocab_word_id as string,
    reviewedAt: row.reviewed_at as string,
    difficulty: row.difficulty as FlashcardReview['difficulty'],
    intervalDays: row.interval_days as number,
    easeFactor: row.ease_factor as number,
    dueAt: row.due_at as string,
    reviewCount: row.review_count as number,
    accuracyRate: row.accuracy_rate as number,
  };
}

export async function getDueReviews(deckWordIds: string[]): Promise<FlashcardReview[]> {
  if (deckWordIds.length === 0) return [];
  const db = await getDb();
  const now = new Date().toISOString();
  const placeholders = deckWordIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM flashcard_reviews
     WHERE vocab_word_id IN (${placeholders}) AND due_at <= ?
     ORDER BY due_at ASC`,
    [...deckWordIds, now]
  );
  return rows.map((row) => ({
    id: row.id as string,
    vocabWordId: row.vocab_word_id as string,
    reviewedAt: row.reviewed_at as string,
    difficulty: row.difficulty as FlashcardReview['difficulty'],
    intervalDays: row.interval_days as number,
    easeFactor: row.ease_factor as number,
    dueAt: row.due_at as string,
    reviewCount: row.review_count as number,
    accuracyRate: row.accuracy_rate as number,
  }));
}

// ── Flashcard Decks ───────────────────────────────────────────────────────────

export async function upsertDeck(deck: FlashcardDeck): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO flashcard_decks
      (id, name, book_id, word_ids, created_at, is_auto_generated)
     VALUES (?,?,?,?,?,?)`,
    [deck.id, deck.name, deck.bookId ?? null, JSON.stringify(deck.wordIds), deck.createdAt, deck.isAutoGenerated ? 1 : 0]
  );
}

export async function getAllDecks(): Promise<FlashcardDeck[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM flashcard_decks ORDER BY created_at DESC'
  );
  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    bookId: (row.book_id as string | null) ?? null,
    wordIds: JSON.parse((row.word_ids as string) ?? '[]'),
    createdAt: row.created_at as string,
    isAutoGenerated: (row.is_auto_generated as number) === 1,
  }));
}

// ── Reading Sessions & Progress ───────────────────────────────────────────────

export async function recordReadingSession(session: ReadingSession): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO reading_sessions (id, book_id, duration_seconds, date) VALUES (?,?,?,?)`,
    [session.id, session.bookId, session.durationSeconds, session.date]
  );
}

export async function getTotalReadingSeconds(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(duration_seconds), 0) as total FROM reading_sessions'
  );
  return row?.total ?? 0;
}

export async function getReadingDates(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT DISTINCT date FROM reading_sessions ORDER BY date DESC'
  );
  return rows.map((r) => r.date);
}

// ── Achievements ──────────────────────────────────────────────────────────────

export async function grantAchievement(achievement: Achievement): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO achievements (id, type, earned_at) VALUES (?,?,?)`,
    [achievement.id, achievement.type, achievement.earnedAt]
  );
}

export async function getAllAchievements(): Promise<Achievement[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM achievements ORDER BY earned_at ASC'
  );
  return rows.map((row) => ({
    id: row.id as string,
    type: row.type as Achievement['type'],
    earnedAt: row.earned_at as string,
  }));
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'user_settings'"
  );
  if (!row) return DefaultSettings;
  try {
    return JSON.parse(row.value) as UserSettings;
  } catch {
    return DefaultSettings;
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('user_settings', ?)`,
    [JSON.stringify(settings)]
  );
}
