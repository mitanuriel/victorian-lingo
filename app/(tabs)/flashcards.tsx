/**
 * Flashcards & Study Screen
 * US-025 – US-030: Spaced-repetition deck list, card-flip quiz, rating, summary.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow } from '@theme';
import { useCollectionStore } from '@store/collectionStore';
import { getDueReviews, getReviewForWord, upsertReview } from '@services/database';
import { computeNextReview } from '@services/spacedRepetition';
import { buildStudyQueue } from '@utils/flashcards';
import type { FlashcardReview, QuizDifficulty, VocabWord } from '@models';

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = 'idle' | 'studying' | 'summary';

interface DeckInfo {
  id: string;
  name: string;
  wordIds: string[];
  dueCount: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

// SESSION_LIMIT and buildStudyQueue live in src/utils/flashcards.ts

const CATEGORY_COLOURS: Record<string, string> = {
  Archaic: Colors.burgundy,
  PeriodSlang: Colors.green,
  FalseFriend: Colors.blue,
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface DeckCardProps {
  deck: DeckInfo;
  onStart: () => void;
}

function DeckCard({ deck, onStart }: DeckCardProps) {
  return (
    <TouchableOpacity style={st.deckCard} onPress={onStart} activeOpacity={0.85}>
      <View style={st.deckCardBody}>
        <Text style={st.deckName}>{deck.name}</Text>
        <Text style={st.deckMeta}>
          {deck.wordIds.length} {deck.wordIds.length === 1 ? 'word' : 'words'}
        </Text>
      </View>
      {deck.dueCount > 0 ? (
        <View style={st.dueBadge}>
          <Text style={st.dueBadgeText}>{deck.dueCount} due</Text>
        </View>
      ) : (
        <View style={[st.dueBadge, st.newBadge]}>
          <Text style={[st.dueBadgeText, st.newBadgeText]}>New</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── StudyCard — owns its own flip animation ───────────────────────────────────

interface StudyCardProps {
  word: VocabWord;
  index: number;
  total: number;
  onRate: (d: QuizDifficulty) => void;
}

function StudyCard({ word, index, total, onRate }: StudyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const categoryColour = CATEGORY_COLOURS[word.categoryLabel] ?? Colors.inkDark;

  const flipCard = () => {
    const toValue = isFlipped ? 0 : 180;
    Animated.spring(flipAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['-180deg', '0deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={st.container}>
      {/* Progress bar */}
      <View style={st.studyHeader}>
        <View style={st.progressBarTrack}>
          <View
            style={[st.progressBarFill, { width: `${((index + 1) / total) * 100}%` as `${number}%` }]}
          />
        </View>
        <Text style={st.progressLabel}>{index + 1} / {total}</Text>
      </View>

      {/* Flippable card */}
      <TouchableOpacity
        style={st.cardTouchable}
        onPress={flipCard}
        activeOpacity={1}
      >
        {/* Front — word */}
        <Animated.View
          style={[
            st.card,
            { transform: [{ rotateY: frontRotate }], opacity: frontOpacity },
          ]}
        >
          <View style={[st.categoryBadge, { backgroundColor: categoryColour }]}>
            <Text style={st.categoryBadgeText}>{word.categoryLabel}</Text>
          </View>

          <Text style={st.wordText}>{word.word}</Text>

          {word.phonetic ? (
            <Text style={st.phoneticText}>{word.phonetic}</Text>
          ) : null}

          <Text style={st.partOfSpeechText}>{word.partOfSpeech}</Text>

          <Text style={st.flipHint}>— tap to reveal —</Text>
        </Animated.View>

        {/* Back — definition */}
        <Animated.View
          style={[
            st.card,
            st.cardBack,
            { transform: [{ rotateY: backRotate }], opacity: backOpacity },
          ]}
        >
          <Text style={st.defLabel}>Era Definition</Text>
          <Text style={st.defText}>{word.eraDefinition}</Text>

          {word.modernDefinition ? (
            <>
              <Text style={[st.defLabel, st.defLabelModern]}>Modern Usage</Text>
              <Text style={st.defText}>{word.modernDefinition}</Text>
            </>
          ) : null}

          <Text style={st.exampleText}>"{word.exampleSentence}"</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Rating buttons — only after flip */}
      {isFlipped ? (
        <View style={st.ratingRow}>
          <RatingButton label="Hard" colour={Colors.burgundy} onPress={() => onRate('Hard')} />
          <RatingButton label="OK"   colour={Colors.gold}    onPress={() => onRate('OK')} />
          <RatingButton label="Easy" colour={Colors.green}   onPress={() => onRate('Easy')} />
        </View>
      ) : (
        <View style={st.ratingRowPlaceholder} />
      )}
    </SafeAreaView>
  );
}

// ── RatingButton ──────────────────────────────────────────────────────────────

interface RatingButtonProps {
  label: string;
  colour: string;
  onPress: () => void;
}

function RatingButton({ label, colour, onPress }: RatingButtonProps) {
  return (
    <TouchableOpacity
      style={[st.ratingBtn, { borderColor: colour }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[st.ratingBtnText, { color: colour }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── SummaryCell ───────────────────────────────────────────────────────────────

function SummaryCell({ label, count, colour }: { label: string; count: number; colour: string }) {
  return (
    <View style={st.summaryCell}>
      <Text style={[st.summaryCellCount, { color: colour }]}>{count}</Text>
      <Text style={st.summaryCellLabel}>{label}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function FlashcardsScreen() {
  const { vocabWords } = useCollectionStore();

  const [decks, setDecks] = useState<DeckInfo[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(false);

  const [mode, setMode] = useState<Mode>('idle');
  const [studyQueue, setStudyQueue] = useState<VocabWord[]>([]);
  const [reviewMap, setReviewMap] = useState<Record<string, FlashcardReview | null>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionRatings, setSessionRatings] = useState<QuizDifficulty[]>([]);

  // Build deck list whenever saved words change
  useEffect(() => {
    if (vocabWords.length === 0) {
      setDecks([]);
      return;
    }

    setIsLoadingDecks(true);

    const build = async () => {
      try {
        // Single batched fetch for all word IDs, then aggregate in memory
        const allIds = vocabWords.map((w) => w.id);
        const allDue = await getDueReviews(allIds);
        const dueIdSet = new Set(allDue.map((r) => r.vocabWordId));

        const result: DeckInfo[] = [
          {
            id: '__all__',
            name: 'My Vocabulary',
            wordIds: allIds,
            dueCount: allDue.length,
          },
        ];

        // Per-book decks — count due from the already-fetched set
        const bookGroups = new Map<string, VocabWord[]>();
        for (const w of vocabWords) {
          if (w.bookId) {
            bookGroups.set(w.bookId, [...(bookGroups.get(w.bookId) ?? []), w]);
          }
        }

        for (const [bookId, words] of bookGroups.entries()) {
          const ids = words.map((w) => w.id);
          result.push({
            id: bookId,
            name: words[0].bookTitle ?? 'Unknown Book',
            wordIds: ids,
            dueCount: ids.filter((id) => dueIdSet.has(id)).length,
          });
        }

        setDecks(result);
      } finally {
        setIsLoadingDecks(false);
      }
    };

    build();
  }, [vocabWords]);

  const startDeck = async (deck: DeckInfo) => {
    const words =
      deck.id === '__all__'
        ? vocabWords
        : vocabWords.filter((w) => w.bookId === deck.id);

    const due = await getDueReviews(deck.wordIds);
    const dueIds = new Set(due.map((r) => r.vocabWordId));

    // Due words first, then new words, capped at SESSION_LIMIT
    const queue = buildStudyQueue(words, dueIds);

    // Pre-fetch existing SM-2 records so computeNextReview has full context
    const rMap: Record<string, FlashcardReview | null> = {};
    await Promise.all(
      queue.map(async (w) => {
        rMap[w.id] = await getReviewForWord(w.id);
      })
    );

    setStudyQueue(queue);
    setReviewMap(rMap);
    setCurrentIdx(0);
    setSessionRatings([]);
    setMode('studying');
  };

  const rateCard = async (difficulty: QuizDifficulty) => {
    const word = studyQueue[currentIdx];
    const existing = reviewMap[word.id] ?? null;
    const next = computeNextReview(
      existing,
      word.id,
      difficulty,
      difficulty !== 'Hard'
    );

    try {
      await upsertReview(next);
    } catch (_e) {
      // Non-fatal — continue session even if persistence fails
    }

    const newRatings = [...sessionRatings, difficulty];
    setSessionRatings(newRatings);

    const nextIdx = currentIdx + 1;
    if (nextIdx >= studyQueue.length) {
      setMode('summary');
    } else {
      setCurrentIdx(nextIdx);
    }
  };

  // ── Studying ──────────────────────────────────────────────────────────────

  if (mode === 'studying') {
    const word = studyQueue[currentIdx];
    return (
      // key forces StudyCard to remount (reset animation) on card advance
      <StudyCard
        key={word.id + currentIdx}
        word={word}
        index={currentIdx}
        total={studyQueue.length}
        onRate={rateCard}
      />
    );
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  if (mode === 'summary') {
    const easyCount = sessionRatings.filter((r) => r === 'Easy').length;
    const okCount   = sessionRatings.filter((r) => r === 'OK').length;
    const hardCount = sessionRatings.filter((r) => r === 'Hard').length;

    return (
      <SafeAreaView style={st.container}>
        <View style={st.summaryContainer}>
          <Text style={st.summaryGlyph}>✦</Text>
          <Text style={st.summaryTitle}>Session Complete</Text>
          <Text style={st.summarySubtitle}>
            {sessionRatings.length} {sessionRatings.length === 1 ? 'card' : 'cards'} reviewed
          </Text>

          <View style={st.summaryGrid}>
            <SummaryCell label="Easy" count={easyCount} colour={Colors.green} />
            <SummaryCell label="OK"   count={okCount}   colour={Colors.gold} />
            <SummaryCell label="Hard" count={hardCount} colour={Colors.burgundy} />
          </View>

          <TouchableOpacity style={st.doneButton} onPress={() => setMode('idle')}>
            <Text style={st.doneButtonText}>Return to Study Room</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Idle — deck list ──────────────────────────────────────────────────────

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Study Room</Text>
        <Text style={st.headerSubtitle}>
          {vocabWords.length} {vocabWords.length === 1 ? 'word' : 'words'} in notebook
        </Text>
      </View>

      {vocabWords.length === 0 ? (
        <View style={st.emptyState}>
          <Text style={st.emptyGlyph}>📜</Text>
          <Text style={st.emptyTitle}>No words saved yet</Text>
          <Text style={st.emptyBody}>
            Tap vocabulary words whilst reading to save them to your notebook, then return here to study.
          </Text>
        </View>
      ) : isLoadingDecks ? (
        <View style={st.emptyState}>
          <Text style={st.emptyBody}>Preparing your decks…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={st.deckList}>
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} onStart={() => startDeck(deck)} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.parchment,
  },

  // ── Header
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h1,
    color: Colors.inkDark,
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySmall,
    color: Colors.inkMedium,
    marginTop: Spacing.xs,
  },

  // ── Deck list
  deckList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.vellum,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.sm,
  },
  deckCardBody: {
    flex: 1,
  },
  deckName: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.inkDark,
    letterSpacing: 0.4,
  },
  deckMeta: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySmall,
    color: Colors.inkMedium,
    marginTop: 2,
  },
  dueBadge: {
    backgroundColor: Colors.burgundy,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  dueBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.tiny,
    color: Colors.parchment,
    letterSpacing: 0.5,
  },
  newBadge: {
    backgroundColor: Colors.green,
  },
  newBadgeText: {
    color: Colors.parchment,
  },

  // ── Study header
  studyHeader: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
  },
  progressLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySmall,
    color: Colors.inkMedium,
    textAlign: 'right',
  },

  // ── Card flip
  cardTouchable: {
    flex: 1,
    margin: Spacing.lg,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.vellum,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: Colors.oldLace,
  },
  categoryBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  categoryBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.tiny,
    color: Colors.parchment,
    letterSpacing: 0.5,
  },
  wordText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.display,
    color: Colors.inkDark,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  phoneticText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.inkMedium,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  partOfSpeechText: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.bodySmall,
    color: Colors.inkMedium,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  flipHint: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.bodySmall,
    color: Colors.inkGhost,
    textAlign: 'center',
    marginTop: 'auto' as never,
  },
  defLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.tiny,
    color: Colors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  defLabelModern: {
    marginTop: Spacing.md,
    color: Colors.inkMedium,
  },
  defText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.inkDark,
    lineHeight: 24,
    alignSelf: 'stretch',
    marginBottom: Spacing.sm,
  },
  exampleText: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.bodySmall,
    color: Colors.inkMedium,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.md,
  },

  // ── Rating buttons
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  ratingRowPlaceholder: {
    height: 60,
  },
  ratingBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  ratingBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySmall,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Summary
  summaryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  summaryGlyph: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h1,
    color: Colors.inkDark,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  summarySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.inkMedium,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  summaryCell: {
    alignItems: 'center',
    minWidth: 72,
    backgroundColor: Colors.vellum,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryCellCount: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h1,
  },
  summaryCellLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySmall,
    color: Colors.inkMedium,
    marginTop: 2,
  },
  doneButton: {
    backgroundColor: Colors.inkDark,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  doneButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.parchment,
    letterSpacing: 0.8,
  },

  // ── Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  emptyGlyph: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h3,
    color: Colors.inkDark,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.inkMedium,
    textAlign: 'center',
    lineHeight: 24,
  },
});
