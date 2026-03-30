/**
 * Pure helpers for flashcard study session logic.
 * These live outside the React component so they can be unit-tested in Node.
 */

import type { VocabWord } from '@models';

export const SESSION_LIMIT = 20;

/**
 * Sorts the given words into study order — due-first — and caps to `limit`.
 *
 * @param words    All words in the deck.
 * @param dueIds   Set of word IDs whose SM-2 review is due today.
 * @param limit    Maximum queue length (default: SESSION_LIMIT).
 */
export function buildStudyQueue(
  words: VocabWord[],
  dueIds: Set<string>,
  limit: number = SESSION_LIMIT
): VocabWord[] {
  const due   = words.filter((w) => dueIds.has(w.id));
  const fresh = words.filter((w) => !dueIds.has(w.id));
  return [...due, ...fresh].slice(0, limit);
}
