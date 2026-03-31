/**
 * VocabularyPanel — US-008
 *
 * Bottom-sheet definition card that slides up when the reader taps a word.
 * Shows: word + phonetic + POS, era definition, modern definition (if
 * meaningfully different), category note, and an example sentence.
 * Dismissing the panel preserves the reading position.
 */

import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '@theme';
import { useCollectionStore } from '@store/collectionStore';
import type { VocabWord } from '@models';

// ── Category badge colours (matches Epic 3 spec) ──────────────────────────────

const CATEGORY_COLOUR: Record<string, string> = {
  Archaic: Colors.burgundy,
  PeriodSlang: Colors.green,
  FalseFriend: Colors.blue,
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  word: VocabWord | null;
  onDismiss: () => void;
}

export function VocabularyPanel({ word, onDismiss }: Props) {
  const saveWord = useCollectionStore((s) => s.saveWord);
  const isWordSaved = useCollectionStore((s) => s.isWordSaved);

  const categoryColour = word
    ? (CATEGORY_COLOUR[word.categoryLabel] ?? Colors.inkDark)
    : Colors.inkDark;
  const isSaved = word ? isWordSaved(word.id) : false;

  const handleSave = async () => {
    if (word && !isSaved) {
      await saveWord(word);
    }
  };

  return (
    <Modal
      visible={word !== null}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* Semi-opaque backdrop — tap to dismiss */}
      <Pressable
        style={[st.backdrop, { backgroundColor: Colors.overlay }]}
        onPress={onDismiss}
      />

      {/* Panel card */}
      {word && (
        <View style={st.panel}>
          {/* ── Header row: word, phonetic, close button ── */}
          <View style={st.headerRow}>
            <View style={st.wordBlock}>
              <Text style={st.wordText}>{word.word}</Text>
              {word.phonetic ? (
                <Text style={st.phoneticText}>{word.phonetic}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={onDismiss}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close definition panel"
            >
              <Text style={st.closeGlyph}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Badge row: part of speech + category ── */}
          <View style={st.badgeRow}>
            <View style={st.posBadge}>
              <Text style={st.posBadgeText}>{word.partOfSpeech}</Text>
            </View>
            <View style={[st.categoryBadge, { backgroundColor: categoryColour }]}>
              <Text style={st.categoryBadgeText}>{word.categoryLabel}</Text>
            </View>
          </View>

          {/* ── Ornamental divider ── */}
          <View style={st.divider} />

          {/* ── Scrollable definitions ── */}
          <ScrollView
            contentContainerStyle={st.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Era definition */}
            <Text style={st.defLabel}>Victorian usage</Text>
            <Text style={st.defText}>{word.eraDefinition}</Text>

            {/* Modern definition — only when meaningfully different */}
            {word.modernDefinition ? (
              <>
                <Text style={[st.defLabel, st.defLabelModern]}>Modern usage</Text>
                <Text style={st.defText}>{word.modernDefinition}</Text>
              </>
            ) : null}

            {/* Category note */}
            <Text style={st.categoryNote}>{word.categoryNote}</Text>

            {/* Example sentence */}
            <View style={st.exampleBox}>
              <Text style={st.exampleText}>
                ❝{word.exampleSentence}❞
              </Text>
            </View>
          </ScrollView>

          {/* ── Save to notebook button ── */}
          <TouchableOpacity
            style={[st.saveBtn, isSaved && st.saveBtnSaved]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isSaved}
            accessibilityLabel={
              isSaved ? 'Word already in Vocabulary Notebook' : 'Save word to Vocabulary Notebook'
            }
          >
            <Text style={[st.saveBtnText, isSaved && st.saveBtnTextSaved]}>
              {isSaved ? '✓  In Vocabulary Notebook' : '＋  Save to Vocabulary Notebook'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '65%',
    backgroundColor: Colors.parchment,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    ...Shadow.lg,
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  wordBlock: {
    flex: 1,
    marginRight: Spacing.md,
  },
  wordText: {
    fontFamily: FontFamily.boldItalic,
    fontSize: FontSize.h2,
    color: Colors.inkDark,
    letterSpacing: 1,
  },
  phoneticText: {
    fontFamily: FontFamily.lightItalic,
    fontSize: FontSize.bodySmall,
    color: Colors.inkLight,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  closeGlyph: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.ui,
    color: Colors.inkLight,
    paddingTop: 4,
  },

  // ── Badges ──
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  posBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.vellum,
  },
  posBadgeText: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.small,
    color: Colors.inkMedium,
    letterSpacing: 0.3,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  categoryBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.small,
    color: Colors.parchment,
    letterSpacing: 0.5,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },

  // ── Definitions ──
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  defLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.small,
    color: Colors.gold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  defLabelModern: {
    marginTop: Spacing.md,
    color: Colors.inkLight,
  },
  defText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.inkDark,
    lineHeight: FontSize.body * 1.6,
    marginBottom: Spacing.sm,
  },
  categoryNote: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.bodySmall,
    color: Colors.inkMedium,
    lineHeight: FontSize.bodySmall * 1.55,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingLeft: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.gold,
  },
  exampleBox: {
    backgroundColor: Colors.oldLace,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  exampleText: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.bodySmall,
    color: Colors.inkMedium,
    lineHeight: FontSize.bodySmall * 1.7,
  },

  // ── Save button ──
  saveBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    alignItems: 'center',
  },
  saveBtnSaved: {
    borderColor: Colors.green,
    backgroundColor: Colors.oldLace,
  },
  saveBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.ui,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  saveBtnTextSaved: {
    color: Colors.green,
  },
});
