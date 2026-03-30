/**
 * Collection Store — saved quotes and vocabulary notebook.
 */

import { create } from 'zustand';
import type { SavedQuote, VocabWord } from '@models';
import * as db from '@services/database';
import { randomUUID } from '@services/uuid';

interface CollectionStore {
  quotes: SavedQuote[];
  vocabWords: VocabWord[];
  isLoaded: boolean;

  load: () => Promise<void>;

  saveQuote: (quote: Omit<SavedQuote, 'id' | 'savedAt' | 'tags'>) => Promise<SavedQuote>;
  deleteQuote: (id: string) => Promise<void>;

  saveWord: (word: VocabWord) => Promise<void>;
  removeWord: (id: string) => Promise<void>;
  isWordSaved: (wordId: string) => boolean;

  addTag: (type: 'quote' | 'word', id: string, tag: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  quotes: [],
  vocabWords: [],
  isLoaded: false,

  load: async () => {
    const [quotes, vocabWords] = await Promise.all([
      db.getAllQuotes(),
      db.getSavedVocabWords(),
    ]);
    set({ quotes, vocabWords, isLoaded: true });
  },

  saveQuote: async (partial) => {
    const quote: SavedQuote = {
      id: randomUUID(),
      savedAt: new Date().toISOString(),
      tags: [],
      ...partial,
    };
    await db.saveQuote(quote);
    set((state) => ({ quotes: [quote, ...state.quotes] }));
    return quote;
  },

  deleteQuote: async (id) => {
    await db.deleteQuote(id);
    set((state) => ({ quotes: state.quotes.filter((q) => q.id !== id) }));
  },

  saveWord: async (word) => {
    const saved = { ...word, isSaved: true, savedAt: new Date().toISOString() };
    await db.upsertVocabWord(saved);
    await db.setWordSaved(word.id, true);
    set((state) => {
      const existing = state.vocabWords.find((w) => w.id === word.id);
      if (existing) {
        return {
          vocabWords: state.vocabWords.map((w) => w.id === word.id ? saved : w),
        };
      }
      return { vocabWords: [saved, ...state.vocabWords] };
    });
  },

  removeWord: async (id) => {
    await db.setWordSaved(id, false);
    set((state) => ({ vocabWords: state.vocabWords.filter((w) => w.id !== id) }));
  },

  isWordSaved: (wordId) => get().vocabWords.some((w) => w.id === wordId),

  addTag: async (type, id, tag) => {
    if (type === 'quote') {
      const quote = get().quotes.find((q) => q.id === id);
      if (!quote || quote.tags.includes(tag)) return;
      const updated = { ...quote, tags: [...quote.tags, tag] };
      await db.saveQuote(updated);
      set((state) => ({
        quotes: state.quotes.map((q) => q.id === id ? updated : q),
      }));
    } else {
      const word = get().vocabWords.find((w) => w.id === id);
      if (!word || word.tags.includes(tag)) return;
      const updated = { ...word, tags: [...word.tags, tag] };
      await db.upsertVocabWord(updated);
      set((state) => ({
        vocabWords: state.vocabWords.map((w) => w.id === id ? updated : w),
      }));
    }
  },
}));
