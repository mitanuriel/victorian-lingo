/**
 * Unit tests for splitIntoChapters — the text-processing logic behind
 * the Reader screen chapter view (US-007).
 */

import { splitIntoChapters } from '@services/bookDownload';

// ── Helpers ───────────────────────────────────────────────────────────────────

function pgWrap(body: string): string {
  return [
    '*** START OF THE PROJECT GUTENBERG EBOOK TEST ***',
    '',
    body,
    '',
    '*** END OF THE PROJECT GUTENBERG EBOOK TEST ***',
  ].join('\n');
}

// ── PG header / footer stripping ──────────────────────────────────────────────

describe('splitIntoChapters — PG boilerplate stripping', () => {
  it('strips the PG start marker line', () => {
    const text = pgWrap('CHAPTER I.\n\nIt was a dark and stormy night.');
    const chapters = splitIntoChapters(text);
    const allContent = chapters.map((c) => c.title + ' ' + c.content).join(' ');
    expect(allContent).not.toMatch(/START OF THE PROJECT GUTENBERG/i);
  });

  it('strips the PG end marker', () => {
    const text = pgWrap('CHAPTER I.\n\nSome text here.');
    const chapters = splitIntoChapters(text);
    const allContent = chapters.map((c) => c.content).join(' ');
    expect(allContent).not.toMatch(/END OF THE PROJECT GUTENBERG/i);
  });
});

// ── Chapter heading detection ─────────────────────────────────────────────────

describe('splitIntoChapters — chapter heading detection', () => {
  it('splits on "CHAPTER I." style headings', () => {
    const text = pgWrap(
      'CHAPTER I.\n\nFirst chapter content.\n\nCHAPTER II.\n\nSecond chapter content.'
    );
    const chapters = splitIntoChapters(text);
    expect(chapters.length).toBeGreaterThanOrEqual(2);
    expect(chapters[0].title).toMatch(/CHAPTER I/i);
    expect(chapters[1].title).toMatch(/CHAPTER II/i);
  });

  it('splits on "CHAPTER THE FIRST" style headings', () => {
    const text = pgWrap(
      'CHAPTER THE FIRST\n\nOpening.\n\nCHAPTER THE SECOND\n\nContinuation.'
    );
    const chapters = splitIntoChapters(text);
    expect(chapters.length).toBeGreaterThanOrEqual(2);
  });

  it('splits on "PART I." style headings', () => {
    const text = pgWrap(
      'PART I.\n\nFirst part.\n\nPART II.\n\nSecond part.'
    );
    const chapters = splitIntoChapters(text);
    expect(chapters.length).toBeGreaterThanOrEqual(2);
    expect(chapters[0].title).toMatch(/PART I/i);
  });

  it('preserves chapter title in the title field', () => {
    const text = pgWrap('CHAPTER IV. The Arrival\n\nShe arrived at last.');
    const chapters = splitIntoChapters(text);
    expect(chapters[0].title).toMatch(/CHAPTER IV/i);
  });

  it('preserves chapter body text in the content field', () => {
    const text = pgWrap('CHAPTER I.\n\nIt was a dark and stormy night.');
    const chapters = splitIntoChapters(text);
    expect(chapters[0].content).toContain('dark and stormy night');
  });
});

// ── Fallback for undivided texts ──────────────────────────────────────────────

describe('splitIntoChapters — fallback for texts without chapters', () => {
  it('returns a single "Text" section when no chapter headings are found', () => {
    const text = pgWrap('A continuous prose passage with no headings at all.');
    const chapters = splitIntoChapters(text);
    expect(chapters).toHaveLength(1);
    expect(chapters[0].title).toBe('Text');
    expect(chapters[0].content).toContain('continuous prose');
  });

  it('returns an array even for empty input', () => {
    const chapters = splitIntoChapters('');
    expect(Array.isArray(chapters)).toBe(true);
  });
});

// ── Content integrity ─────────────────────────────────────────────────────────

describe('splitIntoChapters — content integrity', () => {
  it('does not lose chapter body text between headings', () => {
    const body =
      'CHAPTER I.\n\nParagraph one. Paragraph two.\n\nCHAPTER II.\n\nParagraph three.';
    const chapters = splitIntoChapters(pgWrap(body));
    expect(chapters[0].content).toContain('Paragraph one');
    expect(chapters[1].content).toContain('Paragraph three');
  });

  it('trims leading/trailing whitespace from each chapter title', () => {
    const text = pgWrap('  CHAPTER I.  \n\nSome text.');
    const chapters = splitIntoChapters(text);
    expect(chapters[0].title).toBe(chapters[0].title.trim());
  });
});
