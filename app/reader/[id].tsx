/**
 * Reader Screen — US-007
 *
 * Era-appropriate visual rendering: parchment background, Cormorant Garamond
 * body text, ornate chapter headings, zero modern sans-serif chrome within
 * the reading canvas.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors, FontFamily, FontSize, Spacing, Radius } from '@theme';
import { useBookStore } from '@store/bookStore';
import { readCachedBook, splitIntoChapters } from '@services/bookDownload';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Chapter {
  title: string;
  content: string;
}

// ── Ornamental divider between paragraphs in chapter headings ─────────────────

function OrnamentalRule() {
  return (
    <View style={st.ornamentalRule}>
      <View style={st.ruleLeft} />
      <Text style={st.ruleGlyph}>✦</Text>
      <View style={st.ruleRight} />
    </View>
  );
}

// ── Chapter heading rendered with Victorian ornate treatment ──────────────────

function ChapterHeading({ title }: { title: string }) {
  return (
    <View style={st.chapterHeadingContainer}>
      <OrnamentalRule />
      <Text style={st.chapterTitle}>{title}</Text>
      <OrnamentalRule />
    </View>
  );
}

// ── Single paragraph of body text ─────────────────────────────────────────────

function BodyParagraph({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return <Text style={st.bodyText}>{trimmed}</Text>;
}

// ── Chapter content broken into paragraphs ────────────────────────────────────

function ChapterContent({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/);
  return (
    <>
      {paragraphs.map((para, idx) => (
        <BodyParagraph key={idx} text={para} />
      ))}
    </>
  );
}

// ── Chapter navigation pill row ───────────────────────────────────────────────

interface ChapterNavProps {
  chapters: Chapter[];
  activeIdx: number;
  onSelect: (idx: number) => void;
}

function ChapterNav({ chapters, activeIdx, onSelect }: ChapterNavProps) {
  const scrollRef = useRef<ScrollView>(null);
  return (
    <View style={st.chapterNavWrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={st.chapterNavContent}
      >
        {chapters.map((ch, idx) => (
          <TouchableOpacity
            key={idx}
            style={[st.chapterPill, activeIdx === idx && st.chapterPillActive]}
            onPress={() => onSelect(idx)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                st.chapterPillText,
                activeIdx === idx && st.chapterPillTextActive,
              ]}
              numberOfLines={1}
            >
              {ch.title.length > 24 ? ch.title.slice(0, 22) + '…' : ch.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const book = useBookStore((s) => s.getBook(id));

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  // Load and split cached text into chapters
  useEffect(() => {
    if (!book) return;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const text = await readCachedBook(book.gutenbergId);
        const split = splitIntoChapters(text);
        setChapters(split);
      } catch (_e) {
        setLoadError(
          'The text could not be found in local storage. Please download the book first.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [book]);

  // Reset scroll position when chapter changes
  const selectChapter = useCallback((idx: number) => {
    setActiveChapter(idx);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  // ── Not found ─────────────────────────────────────────────────────────────

  if (!book) {
    return (
      <SafeAreaView style={st.parchment}>
        <View style={st.centred}>
          <Text style={st.errorText}>Book not found.</Text>
          <TouchableOpacity style={st.backButton} onPress={() => router.back()}>
            <Text style={st.backButtonText}>← Return to Library</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={st.parchment}>
        <View style={st.centred}>
          <Text style={st.hourglassGlyph}>⧗</Text>
          <Text style={st.loadingText}>Preparing the manuscript…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <SafeAreaView style={st.parchment}>
        <View style={st.centred}>
          <Text style={st.errorText}>{loadError}</Text>
          <TouchableOpacity style={st.backButton} onPress={() => router.back()}>
            <Text style={st.backButtonText}>← Return to Library</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentChapter = chapters[activeChapter];

  // ── Reading canvas ────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={st.parchment}>
      {/* Top bar — stays within theme, no modern chrome */}
      <View style={st.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={st.topBarBack}>← Library</Text>
        </TouchableOpacity>
        <Text style={st.topBarTitle} numberOfLines={1}>
          {book.title}
        </Text>
        <View style={st.topBarSpacer} />
      </View>

      {/* Chapter navigation pills */}
      {chapters.length > 1 && (
        <ChapterNav
          chapters={chapters}
          activeIdx={activeChapter}
          onSelect={selectChapter}
        />
      )}

      {/* Reading canvas — the parchment scroll */}
      <ScrollView
        ref={scrollRef}
        style={st.canvas}
        contentContainerStyle={st.canvasContent}
        showsVerticalScrollIndicator={false}
      >
        {currentChapter && (
          <>
            <ChapterHeading title={currentChapter.title} />
            <ChapterContent content={currentChapter.content} />
          </>
        )}

        {/* Chapter pagination at the foot of the scroll */}
        <View style={st.chapterFooter}>
          {activeChapter > 0 && (
            <TouchableOpacity
              style={st.footerNav}
              onPress={() => selectChapter(activeChapter - 1)}
            >
              <Text style={st.footerNavText}>← Previous Chapter</Text>
            </TouchableOpacity>
          )}
          {activeChapter < chapters.length - 1 && (
            <TouchableOpacity
              style={[st.footerNav, st.footerNavNext]}
              onPress={() => selectChapter(activeChapter + 1)}
            >
              <Text style={st.footerNavText}>Next Chapter →</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  // ── Canvas: the parchment "paper"
  parchment: {
    flex: 1,
    backgroundColor: Colors.parchment,
  },
  canvas: {
    flex: 1,
  },
  canvasContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },

  // ── Top bar — Victorian header, no modern chrome
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  topBarBack: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySmall,
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  topBarTitle: {
    flex: 1,
    fontFamily: FontFamily.semiBoldItalic,
    fontSize: FontSize.ui,
    color: Colors.inkDark,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
    letterSpacing: 0.3,
  },
  topBarSpacer: {
    width: 60, // mirrors back button width for centring
  },

  // ── Chapter navigation pills
  chapterNavWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.oldLace,
  },
  chapterNavContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chapterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.vellum,
  },
  chapterPillActive: {
    backgroundColor: Colors.inkDark,
    borderColor: Colors.inkDark,
  },
  chapterPillText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.small,
    color: Colors.inkMedium,
    letterSpacing: 0.3,
  },
  chapterPillTextActive: {
    color: Colors.parchment,
  },

  // ── Chapter heading — ornate Victorian treatment
  chapterHeadingContainer: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  chapterTitle: {
    fontFamily: FontFamily.boldItalic,
    fontSize: FontSize.h2,
    color: Colors.inkDark,
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: FontSize.h2 * 1.4,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },

  // ── Ornamental rule ✦ ─── ✦ ──
  ornamentalRule: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
  },
  ruleLeft: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gold,
    opacity: 0.6,
  },
  ruleRight: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gold,
    opacity: 0.6,
  },
  ruleGlyph: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.small,
    color: Colors.gold,
    marginHorizontal: Spacing.sm,
  },

  // ── Body text — Cormorant Garamond, generous leading
  bodyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.inkDark,
    lineHeight: FontSize.body * 1.85,
    marginBottom: Spacing.md,
    textAlign: 'justify',
    letterSpacing: 0.2,
  },

  // ── Chapter footer navigation
  chapterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: Spacing.xxl,
  },
  footerNav: {
    paddingVertical: Spacing.sm,
  },
  footerNavNext: {
    marginLeft: 'auto',
  },
  footerNavText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.gold,
    letterSpacing: 0.6,
  },

  // ── States: loading / error / not found
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  hourglassGlyph: {
    fontSize: 48,
    color: Colors.gold,
    marginBottom: Spacing.md,
  },
  loadingText: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.body,
    color: Colors.inkMedium,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.inkMedium,
    textAlign: 'center',
    lineHeight: FontSize.body * 1.6,
    marginBottom: Spacing.lg,
  },
  backButton: {
    marginTop: Spacing.md,
  },
  backButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.gold,
    letterSpacing: 0.6,
  },
});
