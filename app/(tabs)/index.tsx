/**
 * Library Screen — catalog browse, search, era/genre filters.
 * US-001 through US-006.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, FontFamily, FontSize, Spacing, Radius, Shadow, LetterSpacing } from '@theme';
import { useBookStore } from '@store/bookStore';
import type { BookSummary } from '@models';
import type { EraFilter, GenreFilter } from '@services/gutendex';

// ── Filter option definitions ──────────────────────────────────────────────────

const ERA_OPTIONS: { label: string; value: EraFilter }[] = [
  { label: 'All Eras', value: 'all' },
  { label: 'Victorian', value: 'victorian' },
  { label: 'Regency', value: 'regency' },
];

const GENRE_OPTIONS: { label: string; value: GenreFilter }[] = [
  { label: 'All Genres', value: 'all' },
  { label: 'Gothic', value: 'gothic' },
  { label: 'Sensation', value: 'sensation' },
  { label: 'Society', value: 'society' },
  { label: 'Poetry', value: 'poetry' },
  { label: 'Adventure', value: 'adventure' },
];

// ── Book Card ──────────────────────────────────────────────────────────────────

function BookCard({ book }: { book: BookSummary }) {
  const progressPct = Math.round((book.readProgress ?? 0) * 100);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/book/${book.id}`)}
    >
      {/* Spine color swatch */}
      <View style={[styles.cardSpine, { backgroundColor: book.coverColor }]} />

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.cardAuthor} numberOfLines={1}>
          {book.author}
        </Text>

        <View style={styles.cardFooter}>
          {book.difficulty && (
            <View style={[styles.difficultyBadge, difficultyStyle(book.difficulty)]}>
              <Text style={styles.difficultyText}>{book.difficulty}</Text>
            </View>
          )}
          {book.isDownloaded && (
            <View style={styles.downloadedBadge}>
              <Text style={styles.downloadedText}>Saved</Text>
            </View>
          )}
          {progressPct > 0 && progressPct < 100 && (
            <Text style={styles.progressText}>{progressPct}%</Text>
          )}
          {progressPct === 100 && (
            <Text style={styles.completedText}>Complete</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function difficultyStyle(d: string) {
  switch (d) {
    case 'Easy': return { backgroundColor: Colors.green };
    case 'Moderate': return { backgroundColor: Colors.gold };
    default: return { backgroundColor: Colors.burgundy };
  }
}

// ── Filter Pill ────────────────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.pill, active && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function LibraryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [eraFilter, setEraFilter] = useState<EraFilter>('all');
  const [genreFilter, setGenreFilter] = useState<GenreFilter>('all');

  const {
    loadCatalog,
    loadFeatured,
    loadNextPage,
    getCatalogBooks,
    getFeaturedBooks,
    isLoadingCatalog,
    isLoadingFeatured,
    catalogError,
    catalogIds,
  } = useBookStore();

  // Initial load
  useEffect(() => {
    loadFeatured();
    loadCatalog({ era: 'all', genre: 'all' });
  }, []);

  const handleSearch = useCallback(() => {
    loadCatalog({ search: searchQuery || undefined, era: eraFilter, genre: genreFilter });
  }, [searchQuery, eraFilter, genreFilter]);

  const handleEraChange = (era: EraFilter) => {
    setEraFilter(era);
    loadCatalog({ search: searchQuery || undefined, era, genre: genreFilter });
  };

  const handleGenreChange = (genre: GenreFilter) => {
    setGenreFilter(genre);
    loadCatalog({ search: searchQuery || undefined, era: eraFilter, genre });
  };

  const catalogBooks = getCatalogBooks();
  const featuredBooks = getFeaturedBooks();

  // Show catalog if searching/filtering, else show featured
  const showCatalog = searchQuery.length > 0 || eraFilter !== 'all' || genreFilter !== 'all' || catalogIds.length > 0;
  const books = showCatalog ? catalogBooks : featuredBooks;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Victorian Lingo</Text>
        <Text style={styles.headerSubtitle}>A Library of the Age</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, author, or theme…"
          placeholderTextColor={Colors.inkGhost}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable
            style={styles.searchClear}
            onPress={() => {
              setSearchQuery('');
              loadCatalog({ era: eraFilter, genre: genreFilter });
            }}
          >
            <Text style={styles.searchClearText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Era filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterRowContent}
      >
        {ERA_OPTIONS.map((opt) => (
          <FilterPill
            key={opt.value}
            label={opt.label}
            active={eraFilter === opt.value}
            onPress={() => handleEraChange(opt.value)}
          />
        ))}
        <View style={styles.filterDivider} />
        {GENRE_OPTIONS.map((opt) => (
          <FilterPill
            key={opt.value}
            label={opt.label}
            active={genreFilter === opt.value}
            onPress={() => handleGenreChange(opt.value)}
          />
        ))}
      </ScrollView>

      {/* Active filter badges */}
      {(eraFilter !== 'all' || genreFilter !== 'all') && (
        <View style={styles.activeBadges}>
          {eraFilter !== 'all' && (
            <Pressable
              style={styles.activeBadge}
              onPress={() => handleEraChange('all')}
            >
              <Text style={styles.activeBadgeText}>
                {ERA_OPTIONS.find((o) => o.value === eraFilter)?.label} ✕
              </Text>
            </Pressable>
          )}
          {genreFilter !== 'all' && (
            <Pressable
              style={styles.activeBadge}
              onPress={() => handleGenreChange('all')}
            >
              <Text style={styles.activeBadgeText}>
                {GENRE_OPTIONS.find((o) => o.value === genreFilter)?.label} ✕
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Ornamental rule */}
      <View style={styles.rule} />

      {/* Error state */}
      {catalogError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{catalogError}</Text>
        </View>
      )}

      {/* Book list */}
      <FlatList
        data={books}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BookCard book={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (showCatalog) loadNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          !showCatalog && featuredBooks.length > 0 ? (
            <Text style={styles.sectionTitle}>Featured Works</Text>
          ) : null
        }
        ListEmptyComponent={
          isLoadingCatalog || isLoadingFeatured ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator color={Colors.gold} size="large" />
              <Text style={styles.loadingText}>Consulting the catalogue…</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No works found.</Text>
              <Text style={styles.emptySubtext}>
                Pray adjust your search or filters.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoadingCatalog && books.length > 0 ? (
            <ActivityIndicator
              color={Colors.gold}
              style={styles.footerSpinner}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.vellum,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.inkDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  searchClear: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchClearText: {
    color: Colors.inkLight,
    fontSize: FontSize.body,
  },
  filterRow: {
    marginTop: Spacing.sm,
    paddingLeft: Spacing.lg,
  },
  filterRowContent: {
    paddingRight: Spacing.lg,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.oldLace,
  },
  pillActive: {
    backgroundColor: Colors.inkDark,
    borderColor: Colors.inkDark,
  },
  pillText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.small,
    color: Colors.inkMedium,
    letterSpacing: LetterSpacing.wide,
  },
  pillTextActive: {
    color: Colors.parchment,
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.xs,
  },
  activeBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  activeBadge: {
    backgroundColor: Colors.goldPale,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.goldLight,
  },
  activeBadgeText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.small,
    color: Colors.goldDark,
  },
  rule: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  errorBanner: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: '#F5D0D4',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.burgundyLight,
  },
  errorText: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.bodySmall,
    color: Colors.burgundyDark,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBoldItalic,
    fontSize: FontSize.h3,
    color: Colors.inkMedium,
    letterSpacing: LetterSpacing.wide,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.oldLace,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginVertical: Spacing.xs,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  cardPressed: {
    opacity: 0.82,
    ...Shadow.md,
  },
  cardSpine: {
    width: 6,
  },
  cardContent: {
    flex: 1,
    padding: Spacing.md,
  },
  cardTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h4,
    color: Colors.inkDark,
    lineHeight: FontSize.h4 * 1.3,
  },
  cardAuthor: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.bodySmall,
    color: Colors.inkLight,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  difficultyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.tiny,
    color: Colors.oldLace,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  downloadedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: Colors.goldPale,
    borderWidth: 1,
    borderColor: Colors.goldLight,
  },
  downloadedText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.tiny,
    color: Colors.goldDark,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  progressText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.tiny,
    color: Colors.inkLight,
  },
  completedText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.tiny,
    color: Colors.green,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  loadingCenter: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },
  loadingText: {
    fontFamily: FontFamily.italic,
    fontSize: FontSize.body,
    color: Colors.inkLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
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
  },
  footerSpinner: {
    paddingVertical: Spacing.lg,
  },
});
