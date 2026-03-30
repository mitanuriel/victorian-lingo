/**
 * Victorian Lingo — Colour Palette
 *
 * Inspired by aged parchment, copperplate engravings, and Victorian printing inks.
 */

export const Colors = {
  // ── Paper & Backgrounds ───────────────────────────────────────────────────
  parchment: '#F5E9D3',       // primary background — aged paper
  vellum: '#EDD9B0',          // slightly darker parchment
  oldLace: '#FDF5E6',         // very light cream, near-white passages
  sepia: '#DEB887',           // sepia reading mode background
  candlelight: '#F5E6C8',     // warm amber reading mode background
  midnight: '#1C1008',        // "Midnight Ink" dark mode background
  midnightSurface: '#2C180E', // card surfaces in dark mode

  // ── Ink & Typography ──────────────────────────────────────────────────────
  inkDark: '#2C1810',         // primary text — deep brownish black
  inkMedium: '#4A2E1A',       // secondary text
  inkLight: '#704214',        // tertiary / muted text
  inkGhost: '#A0896A',        // placeholder, disabled text
  inkOnDark: '#F5E9D3',       // text on dark backgrounds

  // ── Accent — Aged Gold ────────────────────────────────────────────────────
  goldDark: '#8B6914',        // pressed/active state
  gold: '#B8860B',            // primary accent — gilt chapter numbers, progress
  goldLight: '#C9A84C',       // highlight touches, icons
  goldPale: '#E8D08A',        // subtle background tints

  // ── Accent — Deep Burgundy ────────────────────────────────────────────────
  burgundyDark: '#5C1F26',
  burgundy: '#722F37',        // "Archaic" vocabulary badge, error state
  burgundyLight: '#9B4D56',

  // ── Accent — Forest Green ─────────────────────────────────────────────────
  greenDark: '#1E3D1A',
  green: '#2D5A27',           // "Period Slang" vocabulary badge, success state
  greenLight: '#4A7A43',

  // ── Accent — Victorian Blue ───────────────────────────────────────────────
  blue: '#1A3A5C',            // "False Friend" vocabulary badge, info state
  blueLight: '#2E5B8A',

  // ── Borders & Ornaments ───────────────────────────────────────────────────
  border: '#C4A882',          // standard border colour
  borderLight: '#DDD0B8',     // subtle dividers
  ornament: '#8B7355',        // decorative flourishes, rule lines

  // ── UI Chrome ─────────────────────────────────────────────────────────────
  tabBarBackground: '#3D2309',
  tabBarActive: '#C9A84C',
  tabBarInactive: '#8B7355',

  // ── Overlay & Shadow ──────────────────────────────────────────────────────
  overlay: 'rgba(44, 24, 16, 0.6)',
  shadowColor: '#2C1810',
} as const;

export type ColorKey = keyof typeof Colors;

/** Reading mode palettes */
export const ReadingModes = {
  sepia: {
    background: Colors.sepia,
    text: Colors.inkDark,
    border: Colors.border,
  },
  candlelight: {
    background: Colors.candlelight,
    text: Colors.inkDark,
    border: Colors.border,
  },
  midnight: {
    background: Colors.midnight,
    text: Colors.inkOnDark,
    border: '#5C4A38',
  },
  parchment: {
    background: Colors.parchment,
    text: Colors.inkDark,
    border: Colors.border,
  },
} as const;

export type ReadingMode = keyof typeof ReadingModes;
