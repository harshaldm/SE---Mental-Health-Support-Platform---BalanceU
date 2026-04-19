import { StyleSheet } from 'react-native';

export const designTokens = {
  colors: {
    primary: '#4e635a',
    primaryContainer: '#d1e8dd',
    onPrimary: '#e6fdf2',
    surface: '#fffbff',
    surfaceContainer: '#f8f4e5',
    surfaceContainerLow: '#fdf9ed',
    onSurface: '#39382a',
    onSurfaceVariant: '#676555',
    error: '#a64542',
    errorContainer: '#fe8983',
    onError: '#ffffff'
  },
  typography: {
    // Requires Expo Custom Fonts, defaulting to sans-serif for scaffold
    display: 'sans-serif', 
    body: 'sans-serif'
  },
  radius: {
    md: 24,
    lg: 32,
    xl: 48,
    full: 999
  }
};

export const globalStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: designTokens.colors.surface,
  },
  textDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: designTokens.colors.onSurface,
  },
  textBody: {
    fontSize: 16,
    color: designTokens.colors.onSurfaceVariant,
  },
  buttonPrimary: {
    backgroundColor: designTokens.colors.primary,
    borderRadius: designTokens.radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: designTokens.colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  card: {
    backgroundColor: designTokens.colors.surfaceContainerLow,
    borderRadius: designTokens.radius.lg,
    padding: 24,
    marginVertical: 12,
  }
});
