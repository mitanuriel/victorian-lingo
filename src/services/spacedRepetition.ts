/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Implementation of the SM-2 algorithm for scheduling flashcard reviews.
 * Based on the original SuperMemo 2 specification.
 */

import type { FlashcardReview, QuizDifficulty } from '@models';
import { randomUUID } from './uuid';

const MIN_EASE_FACTOR = 1.3;

/**
 * Map user-facing difficulty response to SM-2 quality score (0–5).
 */
function qualityFromDifficulty(d: QuizDifficulty): number {
  switch (d) {
    case 'Easy': return 5;
    case 'OK':   return 3;
    case 'Hard': return 1;
  }
}

/**
 * Compute the next review schedule for a word using SM-2.
 *
 * Returns an updated FlashcardReview with new intervalDays, easeFactor,
 * dueAt, and accuracy fields.
 */
export function computeNextReview(
  existing: FlashcardReview | null,
  wordId: string,
  difficulty: QuizDifficulty,
  wasCorrect: boolean
): FlashcardReview {
  const quality = qualityFromDifficulty(difficulty);
  const now = new Date();

  // SM-2 state from existing review or defaults
  let interval = existing?.intervalDays ?? 1;
  let easeFactor = existing?.easeFactor ?? 2.5;
  const reviewCount = (existing?.reviewCount ?? 0) + 1;
  const prevAccuracy = existing?.accuracyRate ?? 0;
  const newAccuracy =
    (prevAccuracy * (reviewCount - 1) + (wasCorrect ? 1 : 0)) / reviewCount;

  if (quality >= 3) {
    // Correct response
    if (reviewCount === 1) {
      interval = 1;
    } else if (reviewCount === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  } else {
    // Incorrect — reset interval
    interval = 1;
  }

  // Update ease factor
  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + interval);

  return {
    id: existing?.id ?? randomUUID(),
    vocabWordId: wordId,
    reviewedAt: now.toISOString(),
    difficulty,
    intervalDays: interval,
    easeFactor,
    dueAt: dueAt.toISOString(),
    reviewCount,
    accuracyRate: newAccuracy,
  };
}
