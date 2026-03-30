/**
 * Collection Screen — saved quotes and vocabulary notebook.
 * US-021: Save favourite quotes
 * US-022: Save words to Vocabulary Notebook
 * US-023: Organize saved items with tags
 * US-024: Export/share quotes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow, LetterSpacing } from '@theme';
import { useCollectionStore } from '@store/collectionStore';
import type { SavedQuote, VocabWord } from '@models';

// ── Tab toggle ─────────────────────────────────────────────────────────────────

type CollectionTab = 'quotes' | 'notebook';

// ── Quote Card ─────────────────────────────────────────────────────────────────

function QuoteCard({
  quote,
  onDelete,
  onShare,
  onAddTag,
}: {
  quote: SavedQuote;
  onDelete: (id: string) => void;
  onShare: (quote: SavedQuote) => void;
  onAddTag: (id: string) => void;
}) {
  return (
    <View style={styles.quoteCard}>
      {/* Wax-seal accent */}
      <View style={styles.waxSeal}>
        <Text style={styles.waxSealGlyph}>✦</Text>
      </View>

      <Text style={styles.quoteText}>"{quote.text}"</Text>
      <Text style={styles.quoteAttribution}>
        — {quote.author}, <Text style={styles.quoteTitle}>{quote.bookTitle}</Text>
        {quote.chapter ? `, ${quote.chapter}` : ''}
      </Text>

      {/* Tags */}
      {quote.tags.length > 0 && (
        <View style={styles.tagRow}>
          {quote.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        <Pressable style={styles.actionPill} onPress={() => onAddTag(quote.id)}>
          <Text style={styles.actionPillText}>+ Tag</Text>
        </Pressable>
        <Pressable style={styles.actionPill} onPress={() => onShare(quote)}>
          <Text style={styles.actionPillText}>Share</Text>
        </Pressable>
        <Pressable
          style={[styles.actionPill, styles.actionPillDanger]}
          onPress={() => onDelete(quote.id)}
        >
          <Text style={[styles.actionPillText, styles.actionPillTextDanger]}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Vocab Card ─────────────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  Archaic: Colors.burgundy,
  PeriodSlang: Colors.green,
  FalseFriend: Colors.blue,
};

function VocabCard({
  word,
  onRemove,
  onAddTag,
}: {
  word: VocabWord;
  onRemove: (id: string) => void;
  onAddTag: (id: string) => void;
}) {
  const badgeColor = CATEGORY_COLOR[word.categoryLabel] ?? Colors.inkMedium;

  return (
    <View style={styles.vocabCard}>
      <View style={styles.vocabHeader}>
        <Text style={styles.vocabWord}>{word.word}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: badgeColor }]}>
          <Text style={styles.categoryBadgeText}>{word.categoryLabel}</Text>
        </View>
      </View>

      {word.phonetic && (
        <Text style={styles.phonetic}>{word.phonetic}</Text>
      )}

      <Text style={styles.partOfSpeech}>{word.partOfSpeech}</Text>
      <Text style={styles.eraDefinition}>{word.eraDefinition}</Text>

      {word.exampleSentence ? (
        <Text style={styles.exampleSentence}>
          <Text style={styles.exampleLabel}>Example: </Text>
          {word.exampleSentence}
        </Text>
      ) : null}

      {word.tags.length > 0 && (
        <View style={styles.tagRow}>
          {word.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardActions}>
        <Pressable style={styles.actionPill} onPress={() => onAddTag(word.id)}>
          <Text style={styles.actionPillText}>+ Tag</Text>
        </Pressable>
        <Pressable
          style={[styles.actionPill, styles.actionPillDanger]}
          onPress={() => onRemove(word.id)}
        >
          <Text style={[styles.actionPillText, styles.actionPillTextDanger]}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Tag Modal ──────────────────────────────────────────────────────────────────

function TagModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (tag: string) => void;
}) {
  const [value, setValue] = useState('');

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onConfirm(trimmed);
      setValue('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Add a Tag</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="e.g. Gothic, Favourite…"
            placeholderTextColor={Colors.inkGhost}
            value={value}
            onChangeText={setValue}
            autoFocus
            onSubmitEditing={handleConfirm}
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.modalConfirm} onPress={handleConfirm}>
              <Text style={styles.modalConfirmText}>Add</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function CollectionScreen() {
  const { quotes, vocabWords, deleteQuote, removeWord, addTag } = useCollectionStore();
  const [activeTab, setActiveTab] = useState<CollectionTab>('quotes');
  const [tagTargetId, setTagTargetId] = useState<string | null>(null);
  const [tagTargetType, setTagTargetType] = useState<'quote' | 'word'>('quote');

  const handleShare = async (quote: SavedQuote) => {
    try {
      await Share.share({
        message: `"${quote.text}"\n\n— ${quote.author}, ${quote.bookTitle}\n\nShared via Victorian Lingo · Project Gutenberg`,
      });
    } catch (_err) {
      // Share dialog dismissed — no action needed
    }
  };

  const handleDeleteQuote = (id: string) => {
    Alert.alert(
      'Remove Quote',
      'This passage will be removed from your collection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteQuote(id),
        },
      ]
    );
  };

  const handleRemoveWord = (id: string) => {
    Alert.alert(
      'Remove Word',
      'This word will be removed from your Notebook.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeWord(id),
        },
      ]
    );
  };

  const openTagModal = (type: 'quote' | 'word', id: string) => {
    setTagTargetType(type);
    setTagTargetId(id);
  };

  const handleTagConfirm = (tag: string) => {
    if (!tagTargetId) return;
    addTag(tagTargetType, tagTargetId, tag);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collection</Text>
        <Text style={styles.headerSubtitle}>Commonplace Book</Text>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabButton, activeTab === 'quotes' && styles.tabButtonActive]}
          onPress={() => setActiveTab('quotes')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'quotes' && styles.tabButtonTextActive]}>
            Quotes
          </Text>
          {quotes.length > 0 && (
            <View style={styles.tabCount}>
              <Text style={styles.tabCountText}>{quotes.length}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'notebook' && styles.tabButtonActive]}
          onPress={() => setActiveTab('notebook')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'notebook' && styles.tabButtonTextActive]}>
            Notebook
          </Text>
          {vocabWords.length > 0 && (
            <View style={styles.tabCount}>
              <Text style={styles.tabCountText}>{vocabWords.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.rule} />

      {/* Content */}
      {activeTab === 'quotes' ? (
        <FlatList
          data={quotes}
          keyExtractor={(q) => q.id}
          renderItem={({ item }) => (
            <QuoteCard
              quote={item}
              onDelete={handleDeleteQuote}
              onShare={handleShare}
              onAddTag={(id) => openTagModal('quote', id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyGlyph}>✦</Text>
              <Text style={styles.emptyText}>No passages saved yet.</Text>
              <Text style={styles.emptySubtext}>
                Long-press any text in the Reader to save a quote.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={vocabWords}
          keyExtractor={(w) => w.id}
          renderItem={({ item }) => (
            <VocabCard
              word={item}
              onRemove={handleRemoveWord}
              onAddTag={(id) => openTagModal('word', id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyGlyph}>✒</Text>
              <Text style={styles.emptyText}>Your Notebook is empty.</Text>
              <Text style={styles.emptySubtext}>
                Tap any highlighted word in the Reader to save it here.
              </Text>
            </View>
          }
        />
      )}

      <TagModal
        visible={tagTargetId !== null}
        onClose={() => setTagTargetId(null)}
        onConfirm={handleTagConfirm}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.parchment,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h1,
    color: Colors.inkDark,
    letterSpacing: LetterSpacing.wide,
  },
  headerSubtitle: {
    fontFamily: FontFamily.lightItalic,
    fontSize: FontSize.bodySmall,
    color: Colors.inkLight,
    letterSpacing: LetterSpacing.wider,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.oldLace,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.xs,
  },
  tabButtonActive: {
    backgroundColor: Colors.inkDark,
    borderColor: Colors.inkDark,
  },
  tabButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.inkMedium,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  tabButtonTextActive: {
    color: Colors.parchment,
  },
  tabCount: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    minWidth: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tabCountText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.tiny,
    color: Colors.parchment,
  },
  rule: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  quoteCard: {
    backgroundColor: Colors.oldLace,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    marginVertical: Spacing.xs,
    ...Shadow.sm,
  },
  waxSeal: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  waxSealGlyph: {
    fontSize: 16,
    color: Colors.burgundy,
    opacity: 0.5,
  },
  quoteText: {
    fontFamily: FontFamily.semiBoldItalic,
    fontSize: FontSize.body,
    color: Colors.inkDark,
    lineHeight: FontSize.body * 1.7,
    marginBottom: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  quoteAttribution: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySmall,
    color: Colors.inkLight,
  },
  quoteTitle: {
    fontFamily: FontFamily.italic,
    color: Colors.inkMedium,
  },
  vocabCard: {
    backgroundColor: Colors.oldLace,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    marginVertical: Spacing.xs,
    ...Shadow.sm,
  },
  vocabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  vocabWord: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h3,
    color: Colors.inkDark,
    flexShrink: 1,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  categoryBadgeText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.tiny,
    color: Colors.oldLace,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  phonetic: {
    fontFamily: FontFamily.lightItalic,
    fontSize: FontSize.bodySmall,
    color: Colors.inkLight,
    marginBottom: 2,
  },
  partOfSpeech: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.bodySmall,
    color: Colors.inkMedium,
    marginBottom: Spacing.xs,
  },
  eraDefinition: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.inkDark,
    lineHeight: FontSize.body * 1.6,
  },
  exampleSentence: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.bodySmall,
    color: Colors.inkLight,
    marginTop: Spacing.xs,
    lineHeight: FontSize.bodySmall * 1.6,
  },
  exampleLabel: {
    fontFamily: FontFamily.semiBold,
    fontStyle: 'normal',
    color: Colors.inkMedium,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.goldPale,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.goldLight,
  },
  tagText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.tiny,
    color: Colors.goldDark,
    letterSpacing: LetterSpacing.wide,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  actionPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.vellum,
  },
  actionPillDanger: {
    borderColor: Colors.burgundyLight,
    backgroundColor: Colors.parchment,
  },
  actionPillText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.tiny,
    color: Colors.inkMedium,
    letterSpacing: LetterSpacing.wide,
  },
  actionPillTextDanger: {
    color: Colors.burgundy,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  emptyGlyph: {
    fontSize: 32,
    color: Colors.border,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h4,
    color: Colors.inkMedium,
  },
  emptySubtext: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.bodySmall,
    color: Colors.inkLight,
    marginTop: Spacing.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: FontSize.bodySmall * 1.6,
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: Colors.parchment,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h3,
    color: Colors.inkDark,
    marginBottom: Spacing.md,
    letterSpacing: LetterSpacing.wide,
  },
  modalInput: {
    backgroundColor: Colors.oldLace,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.inkDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  modalCancel: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  modalCancelText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.inkLight,
  },
  modalConfirm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.inkDark,
    borderRadius: Radius.sm,
  },
  modalConfirmText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.parchment,
  },
});
