// Mock for src/services/database.ts — prevents SQLite calls in unit tests

export const initDb = jest.fn().mockResolvedValue(undefined);
export const getAllBooks = jest.fn().mockResolvedValue([]);
export const upsertBook = jest.fn().mockResolvedValue(undefined);
export const updateReadProgress = jest.fn().mockResolvedValue(undefined);
export const markBookDownloaded = jest.fn().mockResolvedValue(undefined);
export const upsertVocabWord = jest.fn().mockResolvedValue(undefined);
export const getSavedVocabWords = jest.fn().mockResolvedValue([]);
export const setWordSaved = jest.fn().mockResolvedValue(undefined);
export const saveQuote = jest.fn().mockResolvedValue(undefined);
export const getAllQuotes = jest.fn().mockResolvedValue([]);
export const deleteQuote = jest.fn().mockResolvedValue(undefined);
export const upsertReview = jest.fn().mockResolvedValue(undefined);
export const getReviewForWord = jest.fn().mockResolvedValue(null);
export const getDueReviews = jest.fn().mockResolvedValue([]);
export const upsertDeck = jest.fn().mockResolvedValue(undefined);
export const getAllDecks = jest.fn().mockResolvedValue([]);
export const recordReadingSession = jest.fn().mockResolvedValue(undefined);
export const getTotalReadingSeconds = jest.fn().mockResolvedValue(0);
export const getReadingDates = jest.fn().mockResolvedValue([]);
export const grantAchievement = jest.fn().mockResolvedValue(undefined);
export const getAllAchievements = jest.fn().mockResolvedValue([]);
export const getSettings = jest.fn().mockResolvedValue(null);
export const saveSettings = jest.fn().mockResolvedValue(undefined);
