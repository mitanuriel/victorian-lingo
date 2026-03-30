/**
 * Unit tests for collectionStore — US-021, US-022, US-023
 */

import { useCollectionStore } from '@store/collectionStore';
import type { SavedQuote, VocabWord } from '@models';

beforeEach(() => {
  useCollectionStore.setState({ quotes: [], vocabWords: [], isLoaded: false });
});

function makeQuote(overrides: Partial<SavedQuote> = {}): SavedQuote {
  return {
    id: 'q-1',
    text: 'It is a truth universally acknowledged',
    bookId: 'book-pride',
    bookTitle: 'Pride and Prejudice',
    author: 'Austen, Jane',
    chapter: 'Chapter I',
    charOffset: 0,
    savedAt: new Date().toISOString(),
    tags: [],
    ...overrides,
  };
}

function makeWord(overrides: Partial<VocabWord> = {}): VocabWord {
  return {
    id: 'w-1',
    word: 'vapours',
    partOfSpeech: 'noun',
    phonetic: '/ˈveɪpərz/',
    categoryLabel: 'Archaic',
    categoryNote: 'Historical term for general nervous ailment.',
    eraDefinition: 'Depression, low spirits, or nervous agitation.',
    modernDefinition: null,
    exampleSentence: 'She has the vapours and cannot receive visitors.',
    bookId: null,
    bookTitle: null,
    savedAt: new Date().toISOString(),
    isSaved: true,
    tags: [],
    ...overrides,
  };
}

// ── saveQuote ─────────────────────────────────────────────────────────────────

describe('collectionStore.saveQuote', () => {
  it('prepends a new quote to the list', async () => {
    const quote = makeQuote();
    const { id: _id, savedAt: _s, tags: _t, ...partial } = quote;
    await useCollectionStore.getState().saveQuote(partial);
    const { quotes } = useCollectionStore.getState();
    expect(quotes).toHaveLength(1);
    expect(quotes[0].text).toBe(quote.text);
    expect(quotes[0].id).toBeTruthy();
    expect(quotes[0].tags).toEqual([]);
  });

  it('assigns a new unique id on each save', async () => {
    const partial = { text: 'Test', bookId: 'b', bookTitle: 'B', author: 'A', chapter: null, charOffset: 0 };
    await useCollectionStore.getState().saveQuote(partial);
    await useCollectionStore.getState().saveQuote(partial);
    const { quotes } = useCollectionStore.getState();
    expect(quotes[0].id).not.toBe(quotes[1].id);
  });
});

// ── deleteQuote ───────────────────────────────────────────────────────────────

describe('collectionStore.deleteQuote', () => {
  it('removes the quote by id', async () => {
    const q = makeQuote({ id: 'del-1' });
    useCollectionStore.setState({ quotes: [q] });
    await useCollectionStore.getState().deleteQuote('del-1');
    expect(useCollectionStore.getState().quotes).toHaveLength(0);
  });

  it('leaves other quotes intact', async () => {
    const q1 = makeQuote({ id: 'keep' });
    const q2 = makeQuote({ id: 'del-2' });
    useCollectionStore.setState({ quotes: [q1, q2] });
    await useCollectionStore.getState().deleteQuote('del-2');
    const { quotes } = useCollectionStore.getState();
    expect(quotes).toHaveLength(1);
    expect(quotes[0].id).toBe('keep');
  });
});

// ── saveWord / removeWord ─────────────────────────────────────────────────────

describe('collectionStore.saveWord', () => {
  it('adds a new word to the notebook', async () => {
    const word = makeWord();
    await useCollectionStore.getState().saveWord(word);
    expect(useCollectionStore.getState().vocabWords).toHaveLength(1);
    expect(useCollectionStore.getState().vocabWords[0].word).toBe('vapours');
  });

  it('deduplicates — does not add the same word twice', async () => {
    const word = makeWord();
    await useCollectionStore.getState().saveWord(word);
    await useCollectionStore.getState().saveWord(word);
    expect(useCollectionStore.getState().vocabWords).toHaveLength(1);
  });
});

describe('collectionStore.removeWord', () => {
  it('removes a word from the notebook', async () => {
    const word = makeWord();
    useCollectionStore.setState({ vocabWords: [word] });
    await useCollectionStore.getState().removeWord(word.id);
    expect(useCollectionStore.getState().vocabWords).toHaveLength(0);
  });
});

// ── isWordSaved ───────────────────────────────────────────────────────────────

describe('collectionStore.isWordSaved', () => {
  it('returns false when the word is not in the notebook', () => {
    expect(useCollectionStore.getState().isWordSaved('unknown-id')).toBe(false);
  });

  it('returns true after the word is saved', () => {
    const word = makeWord();
    useCollectionStore.setState({ vocabWords: [word] });
    expect(useCollectionStore.getState().isWordSaved(word.id)).toBe(true);
  });
});

// ── addTag ────────────────────────────────────────────────────────────────────

describe('collectionStore.addTag (quote)', () => {
  it('appends a new tag to a quote', async () => {
    const q = makeQuote({ id: 't-q1', tags: [] });
    useCollectionStore.setState({ quotes: [q] });
    await useCollectionStore.getState().addTag('quote', 't-q1', 'Gothic');
    const updated = useCollectionStore.getState().quotes[0];
    expect(updated.tags).toContain('Gothic');
  });

  it('does not duplicate an existing tag', async () => {
    const q = makeQuote({ id: 't-q2', tags: ['Gothic'] });
    useCollectionStore.setState({ quotes: [q] });
    await useCollectionStore.getState().addTag('quote', 't-q2', 'Gothic');
    expect(useCollectionStore.getState().quotes[0].tags).toHaveLength(1);
  });
});

describe('collectionStore.addTag (word)', () => {
  it('appends a new tag to a vocab word', async () => {
    const word = makeWord({ id: 't-w1', tags: [] });
    useCollectionStore.setState({ vocabWords: [word] });
    await useCollectionStore.getState().addTag('word', 't-w1', 'Favourite');
    expect(useCollectionStore.getState().vocabWords[0].tags).toContain('Favourite');
  });
});
