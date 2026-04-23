import { StyleSheet } from 'react-native';

// ─── Sanctuary Design System ──────────────────────────────────────────────────
// Primary palette: Cream (#FDFBF7), Sage (#556B5F), Charcoal (#2C2C2C)
export const designTokens = {
  colors: {
    // Core Sanctuary palette
    cream:   '#FDFBF7',
    sage:    '#556B5F',
    sageLight: '#EFF4F1',
    sageDark:  '#3D4F45',
    charcoal: '#2C2C2C',
    muted:    '#7A7A6E',
    border:   '#E0D9CE',
    cardBg:   '#F5F0E8',

    // Semantic aliases (used in existing screens)
    primary:          '#556B5F',
    primaryContainer: '#EFF4F1',
    onPrimary:        '#FFFFFF',
    surface:          '#FDFBF7',
    surfaceContainer: '#F5F0E8',
    surfaceContainerLow: '#FDFBF7',
    onSurface:        '#2C2C2C',
    onSurfaceVariant: '#7A7A6E',
    error:            '#DC2626',
    errorContainer:   '#FEE2E2',
    onError:          '#FFFFFF',

    // Status
    warning:    '#D97706',
    warningBg:  '#FEF3C7',
    success:    '#059669',
    successBg:  '#D1FAE5',
  },
  typography: {
    display: 'sans-serif',
    body:    'sans-serif',
  },
  radius: {
    sm:   12,
    md:   20,
    lg:   28,
    xl:   36,
    full: 999,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  },
};

const T = designTokens;

export const globalStyles = StyleSheet.create({
  // ─── Layout ───
  safeArea: {
    flex: 1,
    backgroundColor: T.colors.cream,
  },
  screen: {
    flex: 1,
    backgroundColor: T.colors.cream,
    padding: 24,
  },

  // ─── Typography ───
  textDisplay: {
    fontSize: 30,
    fontWeight: '800',
    color: T.colors.charcoal,
    letterSpacing: -0.5,
  },
  textHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: T.colors.charcoal,
  },
  textBody: {
    fontSize: 15,
    color: T.colors.muted,
    lineHeight: 22,
  },
  textCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: T.colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // ─── Buttons ───
  buttonPrimary: {
    backgroundColor: T.colors.sage,
    borderRadius: T.radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 6,
  },
  buttonSecondary: {
    backgroundColor: T.colors.sageLight,
    borderRadius: T.radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 6,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: T.colors.border,
    borderRadius: T.radius.full,
    paddingVertical: 15,
    alignItems: 'center',
    marginVertical: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  buttonTextSage: {
    color: T.colors.sage,
    fontWeight: '700',
    fontSize: 16,
  },
  buttonTextDark: {
    color: T.colors.charcoal,
    fontWeight: '700',
    fontSize: 16,
  },

  // ─── Cards ───
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: T.radius.lg,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: T.colors.border,
    ...T.shadow.sm,
  },
  cardElevated: {
    backgroundColor: '#FFFFFF',
    borderRadius: T.radius.lg,
    padding: 22,
    marginVertical: 8,
    ...T.shadow.md,
  },
});
