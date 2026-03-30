/**
 * Book Detail Modal — US-003, US-006
 *
 * Shows full metadata for a selected book and triggers the download flow.
 * Presented as a card modal from the Library screen.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow, LetterSpacing } from '@theme';
import { useBookStore } from '@store/bookStore';
import { fetchBookById } from '@services/gutendex';
import { downloadBook } from '@services/bookDownload';
import type { Book } from '@models';

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: Colors.green,
  Moderate: Colors.gold,
  Demanding: Colors.burgundy,
};

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBook, upsertBook, markDownloaded } = useBookStore();

  const [book, setBook] = useState<Book | null>(getBook(id) ?? null);
  const [isLoadingMeta, setIsLoadingMeta] = useState(!book);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Fetch full book metadata if not already in store
  useEffect(() => {
    if (book) return;
    let cancelled = false;
    setIsLoadingMeta(true);
    fetchBookById(Number(id))
      .then((fetched) => {
        if (cancelled) return;
        setBook(fetched ?? null);
        if (fetched) upsertBook(fetched);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMeta(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleDownload = useCallback(async () => {
    if (!book || isDownloading) return;
    setIsDownloading(true);
    setDownloadError(null);
    setDownloadProgress(0);
    try {
      // Build a minimal GutendexBook shape for the download service
      const gutendexShape = {
        id: book.gutenbergId,
        title: book.title,
        authors: [],
        subjects: book.subjects,
        bookshelves: book.bookshelves,
        languages: ['en'],
        copyright: null,
        media_type: 'Text',
        formats: {
          'text/plain; charset=utf-8': `https://www.gutenberg.org/files/${book.gutenbergId}/${book.gutenbergId}-0.txt`,
          'text/plain': `https://www.gutenberg.org/ebooks/${book.gutenbergId}.txt.utf-8`,
        },
        download_count: 0,
      };
      const path = await downloadBook(gutendexShape, setDownloadProgress);
      await markDownloaded(book.id, path);
      setBook((b) => b ? { ...b, isDownloaded: true, cachedTextPath: path } : b);
    } catch (_err) {
      setDownloadError('Download failed. Please check your connection and try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [book, isDownloading, markDownloaded]);

  const handleOpenReader = useCallback(() => {
    if (!book?.isDownloaded) return;
    router.push(`/reader/${book.id}`);
  }, [book]);

  if (isLoadingMeta) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator color={Colors.gold} size="large" />
        <Text style={styles.loadingText}>Consulting the archives…</Text>
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <Text style={styles.errorText}>This volume could not be found.</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Return to Library</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const diffColor = book.difficulty ? DIFFICULTY_COLOR[book.difficulty] : Colors.inkLight;
  const progressPct = Math.round(downloadProgress * 100);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Dismiss handle */}
      <Pressable style={styles.handle} onPress={() => router.back()}>
        <View style={styles.handleBar} />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Spine colour header */}
        <View style={[styles.spineHeader, { backgroundColor: book.coverColor }]}>
          <View style={styles.spineHeaderOverlay} />
          <Text style={styles.titleOnSpine} numberOfLines={3}>
            {book.title}
          </Text>
        </View>

        {/* Metadata */}
        <View style={styles.metaCard}>
          <Text style={styles.authorName}>{book.author}</Text>
          {(book.authorBirthYear || book.authorDeathYear) && (
            <Text style={styles.authorYears}>
              {book.authorBirthYear ?? '?'} – {book.authorDeathYear ?? 'present'}
            </Text>
          )}

          {/* Divider */}
          <View style={styles.rule} />

          {/* Badges row */}
          <View style={styles.badgesRow}>
            {book.publicationYear && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  Pub. {book.publicationYear}
                </Text>
              </View>
            )}
            {book.difficulty && (
              <View style={[styles.badge, { backgroundColor: diffColor }]}>
                <Text style={[styles.badgeText, styles.badgeTextOnDark]}>
                  {book.difficulty}
                </Text>
              </View>
            )}
            {book.isDownloaded && (
              <View style={[styles.badge, styles.badgeSaved]}>
                <Text style={styles.badgeSavedText}>Saved</Text>
              </View>
            )}
          </View>

          {/* Synopsis */}
          {book.synopsis && (
            <>
              <Text style={styles.sectionHeading}>Synopsis</Text>
              <Text style={styles.synopsisText}>{book.synopsis}</Text>
            </>
          )}

          {/* Subjects */}
          {book.subjects.length > 0 && (
            <>
              <Text style={styles.sectionHeading}>Subjects</Text>
              <Text style={styles.subjectText}>
                {book.subjects.slice(0, 6).join(' · ')}
              </Text>
            </>
          )}
        </View>

        {/* Reading progress */}
        {book.readProgress > 0 && (
          <View style={styles.readProgressContainer}>
            <Text style={styles.readProgressLabel}>
              Read {Math.round(book.readProgress * 100)}%
            </Text>
            <View style={styles.readProgressTrack}>
              <View
                style={[
                  styles.readProgressFill,
                  { width: `${Math.round(book.readProgress * 100)}%` },
                ]}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Download error */}
      {downloadError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{downloadError}</Text>
        </View>
      )}

      {/* Action area */}
      <View style={styles.actionArea}>
        {book.isDownloaded ? (
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={handleOpenReader}
          >
            <Text style={styles.primaryButtonText}>Open in Reader</Text>
          </Pressable>
        ) : isDownloading ? (
          <View style={styles.downloadingContainer}>
            <ActivityIndicator color={Colors.gold} />
            <Text style={styles.downloadingText}>
              Transcribing the manuscript… {progressPct > 0 ? `${progressPct}%` : ''}
            </Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={handleDownload}
          >
            <Text style={styles.primaryButtonText}>Download to Library</Text>
          </Pressable>
        )}

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Return to Catalogue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.parchment,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.parchment,
    gap: Spacing.md,
  },
  loadingText: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.body,
    color: Colors.inkLight,
  },
  errorText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h4,
    color: Colors.inkMedium,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  backButton: {
    marginTop: Spacing.md,
  },
  backButtonText: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.body,
    color: Colors.gold,
    textDecorationLine: 'underline',
  },
  handle: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  spineHeader: {
    height: 180,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  spineHeaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44, 24, 16, 0.35)',
  },
  titleOnSpine: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h2,
    color: Colors.oldLace,
    letterSpacing: LetterSpacing.wide,
    lineHeight: FontSize.h2 * 1.2,
  },
  metaCard: {
    margin: Spacing.lg,
    backgroundColor: Colors.oldLace,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  authorName: {
    fontFamily: FontFamily.semiBoldItalic,
    fontSize: FontSize.h3,
    color: Colors.inkDark,
  },
  authorYears: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySmall,
    color: Colors.inkLight,
    marginTop: 2,
  },
  rule: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    backgroundColor: Colors.vellum,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.tiny,
    color: Colors.inkMedium,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  badgeTextOnDark: {
    color: Colors.oldLace,
  },
  badgeSaved: {
    backgroundColor: Colors.goldPale,
    borderColor: Colors.goldLight,
  },
  badgeSavedText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.tiny,
    color: Colors.goldDark,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  sectionHeading: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.bodySmall,
    color: Colors.inkMedium,
    letterSpacing: LetterSpacing.wider,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  synopsisText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.inkDark,
    lineHeight: FontSize.body * 1.65,
  },
  subjectText: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.bodySmall,
    color: Colors.inkLight,
    lineHeight: FontSize.bodySmall * 1.6,
  },
  readProgressContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  readProgressLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.tiny,
    color: Colors.inkLight,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.wide,
    marginBottom: Spacing.xs,
  },
  readProgressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  readProgressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
  },
  errorBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: '#F5D0D4',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.burgundyLight,
  },
  errorBannerText: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.bodySmall,
    color: Colors.burgundyDark,
    textAlign: 'center',
  },
  actionArea: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.parchment,
  },
  primaryButton: {
    backgroundColor: Colors.inkDark,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadow.sm,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  primaryButtonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.parchment,
    letterSpacing: LetterSpacing.wide,
  },
  downloadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  downloadingText: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.body,
    color: Colors.inkMedium,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  secondaryButtonText: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.body,
    color: Colors.inkLight,
    textDecorationLine: 'underline',
  },
});
