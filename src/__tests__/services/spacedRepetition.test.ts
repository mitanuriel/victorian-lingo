/**
 * Unit tests for SM-2 spaced-repetition algorithm.
 * Gates: US-028 — Spaced repetition
 */

import { computeNextReview } from '@services/spacedRepetition';
import type { FlashcardReview } from '@models';

const WORD_ID = 'test-word-id';

function makeReview(overrides: Partial<FlashcardReview> = {}): FlashcardReview {
  return {
    id: 'rev-1',
    vocabWordId: WORD_ID,
    reviewedAt: new Date().toISOString(),
    difficulty: 'OK',
    intervalDays: 1,
    easeFactor: 2.5,
    dueAt: new Date().toISOString(),
    reviewCount: 1,
    accuracyRate: 1,
    ...overrides,
  };
}

// ── First review (no prior history) ──────────────────────────────────────────

describe('computeNextReview — first review (no prior history)', () => {
  it('assigns interval=1 and writes a future dueAt for Easy', () => {
    const result = computeNextReview(null, WORD_ID, 'Easy', true);
    expect(result.intervalDays).toBe(1);
    expect(new Date(result.dueAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('assigns interval=1 for OK on first review', () => {
    const result = computeNextReview(null, WORD_ID, 'OK', true);
    expect(result.intervalDays).toBe(1);
  });

  it('resets interval to 1 for Hard (incorrect)', () => {
    const result = computeNextReview(null, WORD_ID, 'Hard', false);
    expect(result.intervalDays).toBe(1);
  });

  it('populates required fields', () => {
    const result = computeNextReview(null, WORD_ID, 'Easy', true);
    expect(result.id).toBeTruthy();
    expect(result.vocabWordId).toBe(WORD_ID);
    expect(result.reviewCount).toBe(1);
    expect(typeof result.easeFactor).toBe('number');
    expect(typeof result.accuracyRate).toBe('number');
  });
});

// ── Second review ─────────────────────────────────────────────────────────────

describe('computeNextReview — second review', () => {
  it('assigns interval=6 on second correct review', () => {
    const first = makeReview({ reviewCount: 1, intervalDays: 1 });
    const result = computeNextReview(first, WORD_ID, 'Easy', true);
    expect(result.intervalDays).toBe(6);
    expect(result.reviewCount).toBe(2);
  });
});

// ── Third+ reviews (interval scaling) ────────────────────────────────────────

describe('computeNextReview — third+ reviews', () => {
  it('multiplies interval by easeFactor on correct answer', () => {
    const prior = makeReview({ reviewCount: 2, intervalDays: 6, easeFactor: 2.5 });
    const result = computeNextReview(prior, WORD_ID, 'Easy', true);
    // interval = round(6 * 2.5) = 15
    expect(result.intervalDays).toBe(15);
  });

  it('resets interval to 1 on Hard regardless of review count', () => {
    const prior = makeReview({ reviewCount: 5, intervalDays: 30, easeFactor: 2.8 });
    const result = computeNextReview(prior, WORD_ID, 'Hard', false);
    expect(result.intervalDays).toBe(1);
  });
});

// ── Ease factor bounds ────────────────────────────────────────────────────────

describe('computeNextReview — ease factor', () => {
  it('never drops ease factor below 1.3 (min clamp)', () => {
    const prior = makeReview({ reviewCount: 10, intervalDays: 1, easeFactor: 1.3 });
    const result = computeNextReview(prior, WORD_ID, 'Hard', false);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('increases ease factor after Easy answer', () => {
    const prior = makeReview({ reviewCount: 2, intervalDays: 6, easeFactor: 2.5 });
    const result = computeNextReview(prior, WORD_ID, 'Easy', true);
    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  it('decreases ease factor after Hard answer', () => {
    const prior = makeReview({ reviewCount: 2, intervalDays: 6, easeFactor: 2.5 });
    const result = computeNextReview(prior, WORD_ID, 'Hard', false);
    expect(result.easeFactor).toBeLessThan(2.5);
  });
});

// ── Accuracy tracking ─────────────────────────────────────────────────────────

describe('computeNextReview — accuracy tracking', () => {
  it('is 1.0 after a single correct answer', () => {
    const result = computeNextReview(null, WORD_ID, 'Easy', true);
    expect(result.accuracyRate).toBe(1);
  });

  it('is 0.0 after a single incorrect answer', () => {
    const result = computeNextReview(null, WORD_ID, 'Hard', false);
    expect(result.accuracyRate).toBe(0);
  });

  it('averages correctly across mixed responses', () => {
    // After 3 correct reviews (acc=1.0, count=3), one wrong
    const prior = makeReview({ reviewCount: 3, accuracyRate: 1.0 });
    const result = computeNextReview(prior, WORD_ID, 'Hard', false);
    // (1.0 * 3 + 0) / 4 = 0.75
    expect(result.accuracyRate).toBeCloseTo(0.75, 5);
  });
});

// ── dueAt scheduling ──────────────────────────────────────────────────────────

describe('computeNextReview — dueAt scheduling', () => {
  it('dueAt is in the future for any correct answer', () => {
    const result = computeNextReview(null, WORD_ID, 'OK', true);
    expect(new Date(result.dueAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('dueAt reflects the intervalDays offset accurately (±1 min)', () => {
    const prior = makeReview({ reviewCount: 2, intervalDays: 6, easeFactor: 2.5 });
    const result = computeNextReview(prior, WORD_ID, 'Easy', true);
    const expectedMs = Date.now() + result.intervalDays * 24 * 60 * 60 * 1000;
    expect(new Date(result.dueAt).getTime()).toBeCloseTo(expectedMs, -5); // ±~30 s precision ok
  });
});

// ── Idempotency: existing id preserved ───────────────────────────────────────

describe('computeNextReview — id handling', () => {
  it('preserves the existing review id on subsequent reviews', () => {
    const prior = makeReview({ id: 'my-existing-id' });
    const result = computeNextReview(prior, WORD_ID, 'OK', true);
    expect(result.id).toBe('my-existing-id');
  });

  it('generates a new id when no prior review exists', () => {
    const result = computeNextReview(null, WORD_ID, 'OK', true);
    expect(result.id).toBeTruthy();
    expect(result.id.length).toBeGreaterThan(8);
  });
});
