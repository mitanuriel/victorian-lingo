/**
 * Unit tests for Flashcards screen helpers — US-025, US-026, US-027
 */

import { buildStudyQueue, SESSION_LIMIT } from '@utils/flashcards';
import { computeNextReview } from '@services/spacedRepetition';
import type { VocabWord } from '@models';

function makeWord(id: string, bookId: string | null = null): VocabWord {
  return {
    id,
    word: `word-${id}`,
    partOfSpeech: 'noun',
    phonetic: null,
    categoryLabel: 'Archaic',
    categoryNote: 'Test',
    eraDefinition: 'Victorian era meaning.',
    modernDefinition: null,
    exampleSentence: 'She used this word.',
    bookId,
    bookTitle: bookId ? `Book ${bookId}` : null,
    savedAt: new Date().toISOString(),
    isSaved: true,
    tags: [],
  };
}

// ── buildStudyQueue ───────────────────────────────────────────────────────────

describe('buildStudyQueue', () => {
  it('places due words before new words', () => {
    const words = [makeWord('new1'), makeWord('due1'), makeWord('new2'), makeWord('due2')];
    const dueIds = new Set(['due1', 'due2']);
    const queue = buildStudyQueue(words, dueIds);
    expect(queue[0].id).toBe('due1');
    expect(queue[1].id).toBe('due2');
    expect(queue[2].id).toBe('new1');
    expect(queue[3].id).toBe('new2');
  });

  it('returns all words when none are due', () => {
    const words = [makeWord('a'), makeWord('b'), makeWord('c')];
    const queue = buildStudyQueue(words, new Set());
    expect(queue).toHaveLength(3);
    expect(queue.map((w: VocabWord) => w.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns only due words when all are due', () => {
    const words = [makeWord('x'), makeWord('y')];
    const dueIds = new Set(['x', 'y']);
    const queue = buildStudyQueue(words, dueIds);
    expect(queue).toHaveLength(2);
  });

  it(`caps the queue at SESSION_LIMIT (${SESSION_LIMIT})`, () => {
    const words = Array.from({ length: 30 }, (_, i) => makeWord(`w${i}`));
    const queue = buildStudyQueue(words, new Set());
    expect(queue).toHaveLength(SESSION_LIMIT);
  });

  it('respects a custom limit', () => {
    const words = Array.from({ length: 10 }, (_, i) => makeWord(`l${i}`));
    const queue = buildStudyQueue(words, new Set(), 5);
    expect(queue).toHaveLength(5);
  });

  it('returns empty array for empty input', () => {
    expect(buildStudyQueue([], new Set())).toHaveLength(0);
  });
});

// ── SM-2 session flow (US-027) ────────────────────────────────────────────────

describe('flashcard session — SM-2 progression', () => {
  it('increases interval after two Easy reviews', () => {
    const first = computeNextReview(null, 'w1', 'Easy', true);
    const second = computeNextReview(first, 'w1', 'Easy', true);
    expect(second.intervalDays).toBeGreaterThan(first.intervalDays);
  });

  it('resets interval after a Hard response', () => {
    const first = computeNextReview(null, 'w1', 'Easy', true);
    const second = computeNextReview(first, 'w1', 'Easy', true);
    const reset = computeNextReview(second, 'w1', 'Hard', false);
    expect(reset.intervalDays).toBe(1);
  });

  it('increments reviewCount on each call', () => {
    const r1 = computeNextReview(null, 'w1', 'OK', true);
    const r2 = computeNextReview(r1, 'w1', 'OK', true);
    const r3 = computeNextReview(r2, 'w1', 'OK', true);
    expect(r1.reviewCount).toBe(1);
    expect(r2.reviewCount).toBe(2);
    expect(r3.reviewCount).toBe(3);
  });

  it('sets dueAt in the future for a correct response', () => {
    const review = computeNextReview(null, 'w1', 'OK', true);
    expect(new Date(review.dueAt).getTime()).toBeGreaterThan(Date.now());
  });
});
