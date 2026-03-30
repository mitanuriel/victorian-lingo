import { Platform } from 'react-native';

/**
 * Victorian Lingo — Typography
 *
 * All text uses Cormorant Garamond — a contemporary revival of Garamond
 * that perfectly evokes Victorian and Regency print aesthetics.
 *
 * Weights loaded via @expo-google-fonts/cormorant-garamond:
 *   CormorantGaramond_300Light
 *   CormorantGaramond_300Light_Italic
 *   CormorantGaramond_400Regular
 *   CormorantGaramond_400Regular_Italic
 *   CormorantGaramond_500Medium
 *   CormorantGaramond_500Medium_Italic
 *   CormorantGaramond_600SemiBold
 *   CormorantGaramond_600SemiBold_Italic
 *   CormorantGaramond_700Bold
 *   CormorantGaramond_700Bold_Italic
 */

export const FontFamily = {
  light: 'CormorantGaramond_300Light',
  lightItalic: 'CormorantGaramond_300Light_Italic',
  regular: 'CormorantGaramond_400Regular',
  italic: 'CormorantGaramond_400Regular_Italic',
  medium: 'CormorantGaramond_500Medium',
  mediumItalic: 'CormorantGaramond_500Medium_Italic',
  semiBold: 'CormorantGaramond_600SemiBold',
  semiBoldItalic: 'CormorantGaramond_600SemiBold_Italic',
  bold: 'CormorantGaramond_700Bold',
  boldItalic: 'CormorantGaramond_700Bold_Italic',
  // Fallback for system UI elements before fonts load
  fallback: Platform.OS === 'ios' ? 'Georgia' : 'serif',
} as const;

/** Type scale — Victorian editorial hierarchy */
export const FontSize = {
  display: 38,      // grand chapter titles, decorative headings
  h1: 30,           // screen titles
  h2: 24,           // section headings
  h3: 20,           // card headings, sub-sections
  h4: 18,           // labels, word-panel title
  body: 17,         // primary reading body text
  bodySmall: 15,    // secondary reading text, captions
  ui: 14,           // standard UI labels
  small: 12,        // badges, timestamps, metadata
  tiny: 10,         // legal annotations
} as const;

export const LineHeight = {
  tight: 1.2,       // headings
  normal: 1.6,      // standard reading
  relaxed: 1.85,    // immersive reader body text
  loose: 2.2,       // poetry, special formatting
} as const;

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1.5,       // small caps, chapter numbers
  widest: 3,        // ornamental headings, era labels
} as const;
