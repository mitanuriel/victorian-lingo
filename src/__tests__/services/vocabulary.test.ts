import { lookupWord, tokenizeText } from '@services/vocabulary';

// ── lookupWord ────────────────────────────────────────────────────────────────

describe('lookupWord', () => {
  it('returns a VocabWord for a known PeriodSlang word', () => {
    const result = lookupWord('humbug');
    expect(result).not.toBeNull();
    expect(result!.word).toBe('humbug');
    expect(result!.categoryLabel).toBe('PeriodSlang');
    expect(result!.partOfSpeech).toBeTruthy();
    expect(result!.eraDefinition).toBeTruthy();
    expect(result!.exampleSentence).toBeTruthy();
  });

  it('returns a VocabWord for a known Archaic word', () => {
    const result = lookupWord('vexation');
    expect(result).not.toBeNull();
    expect(result!.categoryLabel).toBe('Archaic');
  });

  it('returns a VocabWord for a known FalseFriend word', () => {
    const result = lookupWord('awful');
    expect(result).not.toBeNull();
    expect(result!.categoryLabel).toBe('FalseFriend');
  });

  it('returns null for a word not in the seed dictionary', () => {
    expect(lookupWord('glibbertysnitch')).toBeNull();
    expect(lookupWord('smartphone')).toBeNull();
    expect(lookupWord('')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(lookupWord('HUMBUG')).not.toBeNull();
    expect(lookupWord('Humbug')).not.toBeNull();
    expect(lookupWord('HuMbUg')).not.toBeNull();
  });

  it('strips trailing punctuation before matching', () => {
    expect(lookupWord('humbug.')).not.toBeNull();
    expect(lookupWord('humbug,')).not.toBeNull();
    expect(lookupWord('humbug!')).not.toBeNull();
    expect(lookupWord('"humbug"')).not.toBeNull();
  });

  it('returns user-state fields at safe defaults', () => {
    const result = lookupWord('vexation');
    expect(result!.isSaved).toBe(false);
    expect(result!.tags).toEqual([]);
    expect(result!.bookId).toBeNull();
    expect(result!.bookTitle).toBeNull();
  });

  it('includes both eraDefinition and modernDefinition for FalseFriend words', () => {
    const result = lookupWord('nice');
    expect(result!.eraDefinition).toBeTruthy();
    expect(result!.modernDefinition).toBeTruthy();
  });

  it('returns phonetic spelling when available', () => {
    const result = lookupWord('lassitude');
    expect(result!.phonetic).toBeTruthy();
  });
});

// ── tokenizeText ──────────────────────────────────────────────────────────────

describe('tokenizeText', () => {
  it('identifies word tokens and separator tokens', () => {
    const tokens = tokenizeText('Hello, world!');
    const words = tokens.filter((t) => t.type === 'word').map((t) => t.value);
    const seps = tokens.filter((t) => t.type === 'sep').map((t) => t.value);
    expect(words).toEqual(['Hello', 'world']);
    expect(seps).toEqual([', ', '!']);
  });

  it('all tokens concatenate back to the original string', () => {
    const text = 'It was the best of times, it was the worst of times.';
    const tokens = tokenizeText(text);
    expect(tokens.map((t) => t.value).join('')).toBe(text);
  });

  it('preserves contractions as single word tokens', () => {
    const tokens = tokenizeText("it's a singular thing");
    const words = tokens.filter((t) => t.type === 'word').map((t) => t.value);
    expect(words).toContain("it's");
    expect(words).toContain('singular');
  });

  it('returns empty array for an empty string', () => {
    expect(tokenizeText('')).toEqual([]);
  });

  it('returns only separator tokens for punctuation-only strings', () => {
    const tokens = tokenizeText('... !!!');
    expect(tokens.every((t) => t.type === 'sep')).toBe(true);
  });

  it('returns only word tokens for a single undecorated word', () => {
    const tokens = tokenizeText('vexation');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({ type: 'word', value: 'vexation' });
  });
});
