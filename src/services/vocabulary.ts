/**
 * Vocabulary Service — US-008
 *
 * Provides word lookup against a curated Victorian/Regency seed dictionary
 * and a tokenizer for splitting reading text into tappable word tokens.
 *
 * The seed data covers three categories:
 *   Archaic     — obsolete words still alive in Victorian prose
 *   PeriodSlang — cant, fashionable expressions, medical slang
 *   FalseFriend — words whose meaning has shifted significantly since the era
 */

import type { VocabCategory, VocabWord } from '@models';

// ── Seed entry type ────────────────────────────────────────────────────────────
// Dictionary fields only; user-state fields (isSaved, tags, etc.) are
// added at runtime by lookupWord so the seed stays lean.

interface VocabEntry {
  id: string;
  word: string;
  partOfSpeech: string;
  phonetic: string | null;
  categoryLabel: VocabCategory;
  categoryNote: string;
  eraDefinition: string;
  modernDefinition: string | null;
  exampleSentence: string;
}

// ── Seed data ──────────────────────────────────────────────────────────────────

const VOCAB_SEED: VocabEntry[] = [
  // ── Archaic ──────────────────────────────────────────────────────────────────
  {
    id: 'vs-001',
    word: 'vexation',
    partOfSpeech: 'noun',
    phonetic: '/vɛkˈseɪʃ(ə)n/',
    categoryLabel: 'Archaic',
    categoryNote:
      'Used far more frequently in polite Victorian discourse than today, particularly in domestic and social contexts.',
    eraDefinition:
      'The state of being troubled, irritated, or annoyed; a cause or source of continual annoyance or distress.',
    modernDefinition:
      'Still used but feels formal or literary; largely replaced by "frustration" or "annoyance" in everyday speech.',
    exampleSentence:
      'She could not speak another word on the subject without betraying the full extent of her vexation.',
  },
  {
    id: 'vs-002',
    word: 'countenance',
    partOfSpeech: 'noun / verb',
    phonetic: "/ˈkaʊnt(ə)n(ə)ns/",
    categoryLabel: 'Archaic',
    categoryNote:
      'In Victorian prose both the noun (meaning face) and the verb (meaning to allow or approve) appear with high frequency.',
    eraDefinition:
      "As a noun: a person's face or facial expression, especially as revealing mood or character. As a verb: to admit as acceptable; to give approval to.",
    modernDefinition:
      'The verbal sense ("I cannot countenance this behaviour") still survives in formal writing; the noun is now rare.',
    exampleSentence:
      'His countenance fell as he read the letter, and nothing in his manner could countenance the hope she had allowed herself to harbour.',
  },
  {
    id: 'vs-003',
    word: 'lassitude',
    partOfSpeech: 'noun',
    phonetic: '/ˈlasɪtjuːd/',
    categoryLabel: 'Archaic',
    categoryNote:
      'A favourite of novelists describing fashionable indolence or genuine exhaustion; now largely displaced by "fatigue" or "lethargy".',
    eraDefinition:
      'Physical or mental weariness; lack of energy, often implying an aristocratic or fashionable disinclination to exert oneself.',
    modernDefinition: 'Survives in medical and literary registers but rare in ordinary speech.',
    exampleSentence:
      'The heat of the afternoon had settled over the drawing-room with an oppressive lassitude that precluded all conversation.',
  },
  {
    id: 'vs-004',
    word: 'impertinent',
    partOfSpeech: 'adjective',
    phonetic: '/ɪmˈpɜːtɪn(ə)nt/',
    categoryLabel: 'Archaic',
    categoryNote:
      'In Victorian usage the word retained the older double sense of "not pertinent" alongside "rude"; both senses appear in Austen.',
    eraDefinition:
      'Not pertinent or relevant to the matter at hand; or, by extension, presumptuous, rude, or failing to observe proper social boundaries.',
    modernDefinition:
      'Only the second sense (rude, insolent) survives in modern usage; the original logical sense is now obsolete.',
    exampleSentence:
      '"Your questions, sir, are wholly impertinent to the business before us," she replied, drawing herself up to her full height.',
  },
  {
    id: 'vs-005',
    word: 'prodigious',
    partOfSpeech: 'adjective',
    phonetic: '/prəˈdɪdʒəs/',
    categoryLabel: 'Archaic',
    categoryNote:
      'Dickens and other Victorian novelists deployed this word hyperbolically for comic or dramatic effect far more than modern writers would.',
    eraDefinition:
      'Remarkably large, powerful, or impressive; extraordinary; sometimes used with mock solemnity for humorous effect.',
    modernDefinition:
      'Still used but only in formal or literary registers; modern substitutes include "enormous" or "extraordinary".',
    exampleSentence:
      'Mr. Micawber consumed a prodigious quantity of punch and declared himself, as usual, entirely confident in the improvement of his affairs.',
  },
  // ── Period Slang ──────────────────────────────────────────────────────────────
  {
    id: 'vs-006',
    word: 'humbug',
    partOfSpeech: 'noun / verb',
    phonetic: '/ˈhʌmbʌɡ/',
    categoryLabel: 'PeriodSlang',
    categoryNote:
      'One of the most characteristic words of Victorian moral vocabulary — Dickens gave Scrooge the immortal line "Bah, humbug!"',
    eraDefinition:
      'As a noun: deliberate deception; dishonest or insincere talk or behaviour; a person who behaves so. As a verb: to deceive or mislead.',
    modernDefinition:
      'Survives primarily as a cultural reference; now used with humorous or nostalgic intent. Also a type of striped peppermint sweet.',
    exampleSentence:
      '"I shall say with Scrooge," he announced to the assembled company, "that the whole business is nothing but humbug."',
  },
  {
    id: 'vs-007',
    word: 'vapours',
    partOfSpeech: 'noun (plural)',
    phonetic: '/ˈveɪpəz/',
    categoryLabel: 'PeriodSlang',
    categoryNote:
      'A fashionable Victorian and Regency diagnosis, especially among ladies of leisure; used both seriously and satirically.',
    eraDefinition:
      'A condition of nervous depression, faintness, or hysterical low spirits, attributed in the period to noxious exhalations in the blood. Also used mockingly of affected or imaginary ailments.',
    modernDefinition:
      'Entirely obsolete as a medical term; now used only humorously to indicate exaggerated emotional prostration.',
    exampleSentence:
      'Mrs. Bennet took to her room with the vapours upon hearing that her daughter had refused Mr. Collins a second time.',
  },
  {
    id: 'vs-008',
    word: 'flummox',
    partOfSpeech: 'verb',
    phonetic: '/ˈflʌməks/',
    categoryLabel: 'PeriodSlang',
    categoryNote:
      'Mid-nineteenth-century colloquial British English; first recorded in the 1830s, it was considered slang in polite company.',
    eraDefinition: 'To confuse, perplex, or bewilder utterly; to put at a loss for words or action.',
    modernDefinition:
      'Survives in informal British English with the same meaning; has lost its slang stigma.',
    exampleSentence:
      "The sergeant was completely flummoxed by the inspector's inquiry and could only scratch his head in bewilderment.",
  },
  {
    id: 'vs-009',
    word: 'bluestocking',
    partOfSpeech: 'noun',
    phonetic: '/ˈbluːstɒkɪŋ/',
    categoryLabel: 'PeriodSlang',
    categoryNote:
      'Originally neutral or celebratory; by the Victorian period it had acquired a faintly satirical edge when applied to highly educated women.',
    eraDefinition:
      'A woman having or affecting literary or intellectual interests; derived from the Blue Stocking Society of 1750s London salons.',
    modernDefinition:
      'Now used only historically or ironically; replaced by neutral terms such as "intellectual" or "academic".',
    exampleSentence:
      'Her neighbours considered her a confirmed bluestocking on account of the Greek volumes that lined her sitting-room shelves.',
  },
  // ── False Friend ──────────────────────────────────────────────────────────────
  {
    id: 'vs-010',
    word: 'awful',
    partOfSpeech: 'adjective',
    phonetic: '/ˈɔːf(ə)l/',
    categoryLabel: 'FalseFriend',
    categoryNote:
      'A classic example of pejoration: the word descended from "awe-inspiring" to merely "very bad" over the course of the nineteenth century.',
    eraDefinition:
      'Inspiring awe, reverential wonder, or solemn dread; impressively grand or terrible in the original, elevated sense.',
    modernDefinition: 'Extremely bad or unpleasant. The elevated Victorian sense is entirely absent from everyday modern usage.',
    exampleSentence:
      'He stood in awful silence before the vast cathedral, overcome by a sense of the sublime he had never before encountered.',
  },
  {
    id: 'vs-011',
    word: 'nice',
    partOfSpeech: 'adjective',
    phonetic: '/nʌɪs/',
    categoryLabel: 'FalseFriend',
    categoryNote:
      'One of the most famous examples of semantic drift in English; Austen repeatedly deploys the precise, older meaning and occasionally mocks the vague modern usage.',
    eraDefinition:
      'Precise; requiring or involving great accuracy, care, or delicacy of discrimination; a nice distinction is a subtle and exact one.',
    modernDefinition:
      'Agreeable, pleasant, kind. The modern sense had already encroached by the Victorian period but the older precise sense was still fully active.',
    exampleSentence:
      '"It is a very nice point," observed the barrister, "upon which the entire case must turn."',
  },
  {
    id: 'vs-012',
    word: 'fond',
    partOfSpeech: 'adjective',
    phonetic: '/fɒnd/',
    categoryLabel: 'FalseFriend',
    categoryNote:
      'The original meaning of "foolish" was still known in the Regency period; Austen uses it deliberately in both senses to create irony.',
    eraDefinition:
      "Foolish, silly, or credulous; excessively or weakly affectionate. The connotation of folly shadows even the affectionate uses.",
    modernDefinition:
      'Simply affectionate or enthusiastic ("fond of music"). The sense of foolishness has entirely vanished.',
    exampleSentence:
      '"What a fond creature she is," said her sister, meaning not that she was loving, but that she was foolishly blind to the man\'s faults.',
  },
  {
    id: 'vs-013',
    word: 'condescend',
    partOfSpeech: 'verb',
    phonetic: '/kɒndɪˈsɛnd/',
    categoryLabel: 'FalseFriend',
    categoryNote:
      'In Victorian usage this word described a social superior graciously lowering themselves — a compliment. Modern readers misread it as an insult.',
    eraDefinition:
      'Of a social superior: to stoop graciously to the level of inferiors; to be affable or obliging to those of lower rank, without loss of dignity.',
    modernDefinition:
      'To behave patronisingly; to treat someone as inferior. The admiring sense has inverted to a critical one.',
    exampleSentence:
      'Lady Catherine was good enough to condescend to dine with them, an honour the family had not enjoyed these three years.',
  },
  {
    id: 'vs-014',
    word: 'disinterested',
    partOfSpeech: 'adjective',
    phonetic: '/dɪsˈɪntrəstɪd/',
    categoryLabel: 'FalseFriend',
    categoryNote:
      'The Victorian distinction between "disinterested" (impartial) and "uninterested" (bored) was sharp and observed; modern confusion conflates the two.',
    eraDefinition:
      'Free from personal interest or bias; impartial; acting without self-interest. A disinterested party had no stake in the outcome.',
    modernDefinition:
      'Often misused to mean "uninterested" (lacking curiosity). The Victorian precise sense survives in legal and formal usage.',
    exampleSentence:
      'He offered his opinion as a disinterested observer, having no financial connection to either party in the dispute.',
  },
  {
    id: 'vs-015',
    word: 'singular',
    partOfSpeech: 'adjective',
    phonetic: '/ˈsɪŋɡjʊlə/',
    categoryLabel: 'FalseFriend',
    categoryNote:
      'Victorian novelists used "singular" to mean remarkable or worthy of notice, a meaning largely lost as the grammatical sense took over.',
    eraDefinition:
      'Remarkable, extraordinary, or strange; worthy of particular notice. A singular occurrence was one that stood out from the common run of events.',
    modernDefinition:
      'Primarily a grammatical term (as opposed to plural). The Victorian sense of "remarkable" survives only in formal or ironic usage.',
    exampleSentence:
      'It was a singular thing, remarked the detective, that the dog had not barked during the night.',
  },
];

// ── Tokenizer ──────────────────────────────────────────────────────────────────

export interface Token {
  type: 'word' | 'sep';
  value: string;
}

/**
 * Split a text string into alternating word and separator tokens.
 * Preserves contractions (it's, won't) and hyphenated compounds.
 * Separator tokens hold spaces, punctuation, and any non-letter run.
 */
export function tokenizeText(text: string): Token[] {
  // Splits on sequences of letters, possibly joined by apostrophes or hyphens
  const parts = text.split(/((?:[A-Za-z]+(?:['\u2019-][A-Za-z]+)*))/);
  return parts
    .filter((p) => p.length > 0)
    .map((p) => ({
      type: /[A-Za-z]/.test(p) ? ('word' as const) : ('sep' as const),
      value: p,
    }));
}

// ── Lookup ─────────────────────────────────────────────────────────────────────

/**
 * Look up a word (case-insensitive, trailing-punctuation-stripped) against the
 * seed dictionary. Returns a VocabWord with user-state fields at defaults,
 * or null if the word is not in the seed.
 */
export function lookupWord(rawWord: string): VocabWord | null {
  const key = rawWord.replace(/[^A-Za-z]/g, '').toLowerCase();
  if (!key) return null;
  const entry = VOCAB_SEED.find((e) => e.word.toLowerCase() === key);
  if (!entry) return null;
  return {
    ...entry,
    bookId: null,
    bookTitle: null,
    savedAt: new Date().toISOString(),
    isSaved: false,
    tags: [],
  };
}
