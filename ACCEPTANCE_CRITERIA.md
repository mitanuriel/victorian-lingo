# Victorian Lingo — Acceptance Criteria

> Format: GIVEN [context] / WHEN [action] / THEN [observable outcome].
> References match story IDs in USER_STORIES.md.

---

## Epic 1 — Library & Book Discovery

### US-001 — Browse curated catalog
- **GIVEN** the user opens the Library screen
- **WHEN** the catalog loads
- **THEN** only works whose Gutenberg subjects or bookshelves align with the Victorian
  (1837–1901) or Regency (1811–1820) period are shown by default
- **AND** each entry shows title, author, and a cover illustration (generated or era-appropriate)

### US-002 — Search by title / author / keyword
- **GIVEN** the user is on the Library screen
- **WHEN** the user types in the search field
- **THEN** results update via the Gutendex API query
- **AND** results are restricted to English-language works
- **AND** no result clearly outside 1800–1910 appears unless the user explicitly removes
  the era filter

### US-003 — Automatic Gutenberg fetch
- **GIVEN** the user selects a book not yet cached locally
- **WHEN** the device has an active internet connection
- **THEN** the app fetches the plain-text version from a Project Gutenberg mirror with
  at least a 2-second delay between successive requests
- **AND** the user sees a progress indicator styled as an hourglass or loading wax-seal
- **AND** no raw Gutenberg URL or network-layer language is shown to the user

### US-004 — Local caching
- **GIVEN** a book has been downloaded at least once
- **WHEN** the user opens that book with no internet connection
- **THEN** the full text is available to read with no degradation of functionality
- **AND** vocabulary lookups using locally cached dictionary data still work offline

### US-005 — Era and genre filters
- **GIVEN** the user opens the Library filter panel
- **WHEN** the user selects "Regency" era and "Society Novel" genre
- **THEN** only books matching both criteria appear in the catalog
- **AND** active filters are shown as dismissible badge labels above the results

### US-006 — Book metadata panel
- **GIVEN** a book tile in the catalog
- **WHEN** the user taps the tile
- **THEN** a detail panel shows: full title, author with birth/death years, first publication
  year, a brief synopsis (from Gutenberg auto-summary where available), and a reading
  difficulty band (Easy / Moderate / Demanding) derived from Flesch-Kincaid score

---

## Epic 2 — Reader Experience

### US-007 — Era-appropriate visual rendering
- **GIVEN** the user opens a book to read
- **WHEN** the reader view renders
- **THEN** the background uses a parchment or aged-paper texture
- **AND** body text uses a period-appropriate serif font (Cormorant Garamond or equivalent)
- **AND** chapter headings have ornate decorative treatment
- **AND** no modern sans-serif chrome is visible within the reading canvas

### US-008 — Word tap for definition
- **GIVEN** the user is reading a passage
- **WHEN** the user taps or long-presses a word
- **THEN** a contextual card appears within 300 ms showing:
  - The word with its part of speech
  - A primary era-appropriate definition
  - A modern definition if it differs meaningfully
  - An example usage sentence from the corpus
- **AND** the reading position is preserved when the card is dismissed

### US-009 — Automatic vocabulary highlighting
- **GIVEN** a book has been processed for vocabulary
- **WHEN** the reader loads a chapter
- **THEN** archaic, period-slang, and false-friend words are visually distinguished
  by three different subtle underline styles
- **AND** highlighting can be toggled off in settings without altering the text

### US-010 — Reading progress persistence
- **GIVEN** the user reads partway through a book and closes the app
- **WHEN** the user reopens that book
- **THEN** the reader opens within 1 paragraph of the last reading position
- **AND** a percentage-read indicator is visible on the book's library card

### US-011 — Text size and font options
- **GIVEN** the user opens reader settings
- **WHEN** the user adjusts text size via a slider
- **THEN** font size updates in real time without reloading the chapter
- **AND** only font choices consistent with the Victorian visual theme are offered

### US-012 — Reading modes
- **GIVEN** the user is in the reader
- **WHEN** the user selects "Candlelight", "Sepia", or "Midnight Ink" mode
- **THEN** background colour, text colour, and texture update within 200 ms
- **AND** the selected mode persists across sessions

---

## Epic 3 — Vocabulary & Word Learning

### US-013 — Era-specific definitions
- **GIVEN** a word definition panel is displayed
- **WHEN** the word has a documented Victorian/Regency-era meaning that differs from its
  modern meaning
- **THEN** the era-specific definition appears first, labelled "Victorian usage"
- **AND** the modern definition is shown second, labelled "Modern usage"

### US-014 — Vocabulary category flags
- **GIVEN** a word is highlighted in the reader
- **WHEN** the user opens its definition panel
- **THEN** the word is labelled with exactly one of: Archaic / Period Slang / False Friend
- **AND** a one-sentence explanation of why it bears that label is shown
- **AND** the three categories are visually distinguished by different badge colours

### US-015 — Word of the Era
- **GIVEN** the user opens the app on a new calendar day
- **WHEN** the home screen loads
- **THEN** a "Word of the Era" card shows: word, phonetic spelling, category label,
  era-specific definition, and one example sentence from the corpus
- **AND** the word can be saved directly from this card to the Vocabulary Notebook

### US-016 — Etymology chain
- **GIVEN** a word definition panel is open
- **WHEN** the user taps "Etymology"
- **THEN** a visual timeline renders showing each language stage (e.g., Latin → Old French
  → Middle English) with dates and brief glosses
- **AND** root morphemes are highlighted in the current word's spelling where identifiable

### US-017 — Anachronism flags
- **GIVEN** text analysis has identified a candidate anachronism in a passage
- **WHEN** the user taps the flagged phrase
- **THEN** a panel explains why the word or phrasing may be unusual for the stated period
- **AND** the explanation distinguishes: editorial anachronism, translation artefact, or
  deliberate archaism/modernism

---

## Epic 4 — Etymology & Historical Context

### US-018 — Inline contextual footnotes
- **GIVEN** a passage contains a culturally significant reference (e.g., "the Season",
  "entail", "calling card")
- **WHEN** the user taps the reference
- **THEN** a footnote card appears with a 2–4 sentence cultural gloss
- **AND** the gloss is sourced content, not generated speculation

### US-019 — Etymology morpheme cards
- **GIVEN** a word has classical (Latin/Greek) roots
- **WHEN** the etymology panel is opened
- **THEN** each root morpheme is shown as a discrete card with: the morpheme, language
  of origin, literal translation, and one other English word sharing the same root

### US-020 — Related works and allusions
- **GIVEN** a passage contains a textual allusion to another work in the corpus
- **WHEN** the allusion is tapped
- **THEN** the app shows the source work title and author
- **AND** offers a shortcut to open that work in the Library if available

---

## Epic 5 — Collection (Quotes & Words)

### US-021 — Save favourite quotes
- **GIVEN** the user is reading
- **WHEN** the user long-selects a passage and taps "Save Quote"
- **THEN** the passage is saved with: text, book title, author, and chapter identifier
- **AND** a visual confirmation styled as a wax-seal impression is shown
- **AND** the saved quote appears immediately in the Collection screen

### US-022 — Save words to Vocabulary Notebook
- **GIVEN** a word definition panel is open
- **WHEN** the user taps "Add to Notebook"
- **THEN** the word is saved with its definition, category label, and exact context sentence
- **AND** the button changes state to "Saved" and cannot create a duplicate

### US-023 — Organize saved items
- **GIVEN** the user is in the Collection screen
- **WHEN** the user applies a tag to a saved quote or word
- **THEN** the tag is stored and the item appears when filtering by that tag
- **AND** system-generated tags (book title, category label) are applied automatically
  and cannot be deleted

### US-024 — Export quotes
- **GIVEN** the user is viewing a saved quote
- **WHEN** the user taps "Share"
- **THEN** the app generates a styled shareable image with the quote text, attribution,
  and a Victorian decorative frame
- **AND** the attribution includes author, title, and a brief Project Gutenberg notice

---

## Epic 6 — Flashcards & Quizzes

### US-025 — Auto-generated reading decks
- **GIVEN** the user has encountered at least 5 highlighted vocabulary words in a book
- **WHEN** the user navigates to Flashcards for that book
- **THEN** a deck is pre-populated with those words
- **AND** the deck is labelled with the book title

### US-026 — Custom decks from Notebook
- **GIVEN** the user has saved words to the Vocabulary Notebook
- **WHEN** the user selects words and taps "Create Deck"
- **THEN** a named custom deck is created containing those words
- **AND** the deck can be renamed, reordered, and have words added or removed at any time

### US-027 — Multiple quiz formats
- **GIVEN** the user starts a quiz session and selects a format
- **WHEN** questions render
- **THEN** the correct format is enforced:
  - *Definition match*: 1 word + 4 definition options, 1 correct
  - *Word from definition*: 1 definition + 4 word options, 1 correct
  - *Fill in the blank*: real corpus sentence with 1 word removed, 4 options
  - *Odd one out*: 4 words, 3 from the era, 1 anachronistic
- **AND** all distractors are plausible words from the same era and category

### US-028 — Spaced repetition
- **GIVEN** a word has been reviewed in flashcard mode
- **WHEN** the user marks it "Easy", "OK", or "Hard"
- **THEN** the next review interval is adjusted per SM-2-compatible algorithm
- **AND** due cards appear at the start of any deck review session

### US-029 — Quiz visual theming
- **GIVEN** the user starts a quiz session
- **WHEN** the quiz UI renders
- **THEN** questions are displayed on an aged-paper examination-paper layout with sepia
  ink typography
- **AND** correct/incorrect feedback uses era-appropriate micro-animations (ink blot,
  gold seal) rather than modern alert components

### US-030 — Score history and accuracy
- **GIVEN** the user has completed at least one quiz session on a word
- **WHEN** the user views that word in the Notebook or Flashcard deck
- **THEN** an accuracy percentage and review count are visible
- **AND** the Progress dashboard shows a vocabulary consolidation trend over time

---

## Epic 7 — Visual Design & UX

### US-031 — Core aesthetic
- **GIVEN** any screen in the app
- **WHEN** it renders
- **THEN** the design adheres to: aged-paper or vellum backgrounds, a serif/copperplate
  type hierarchy, muted ink-wash palette (sepia, deep burgundy, forest green, aged gold),
  ornamental dividers, and period-consistent iconography (quill, inkwell, wax seal, key)
- **AND** no flat modern iconography is used

### US-032 — Era-consistent animations
- **GIVEN** the user navigates between screens or opens a panel
- **WHEN** the transition animates
- **THEN** the animation uses a page turn, paper unfold, or wax-seal reveal metaphor and
  completes within 350 ms
- **AND** all animations respect the OS-level "reduce motion" accessibility setting

### US-033 — Optional sound design
- **GIVEN** sound is enabled in Settings (off by default)
- **WHEN** a page turn, saved-word confirmation, or quiz result occurs
- **THEN** a contextually appropriate ambient sound plays at low volume
- **AND** sound settings are accessible within two taps from any screen

---

## Epic 8 — Progress & Profile

### US-034 — Reading and learning dashboard
- **GIVEN** the user opens the Progress screen
- **WHEN** it loads
- **THEN** the following metrics are visible: books started, books completed, words
  encountered, words consolidated (≥80% quiz accuracy), total reading time, and
  current daily streak
- **AND** data is presented using Victorian-styled charts (ledger graphs, illustrated
  progress indicators)

### US-035 — Achievements
- **GIVEN** the user completes a qualifying milestone (finishes first book, saves 50 words,
  achieves a 7-day streak)
- **WHEN** the milestone is reached
- **THEN** a notification appears styled as an illuminated certificate or Victorian medal
- **AND** the achievement is permanently stored in a "Trophy Case" in the Profile screen
- **AND** achievement names reference Victorian institutions (e.g., "Fellow of the Gothic
  Society", "Keeper of the Commonplace Book")

### US-036 — Reading streak
- **GIVEN** the user reads for at least 5 minutes on a calendar day
- **WHEN** the next app session begins
- **THEN** the streak counter increments and is shown on the home screen
- **AND** the streak is represented as an inkwell filling or candle burning progress graphic
- **AND** a missed day resets the streak to zero with a gentle contextual message
  (no punitive language)
