export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const colors = {
  primary: '#2E75B6',
  primaryDark: '#1e5a92',
  primaryLight: '#5294d0',
  background: '#0d1b2a',
  surface: '#1c2e3f',
  surfaceLight: '#243a4e',
  border: '#263d54',
  borderLight: '#334d68',
  text: '#ffffff',
  textSecondary: '#90a4ae',
  textMuted: '#546e7a',
  accent: '#4fc3f7',
  success: '#22c55e',
  info: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export const typography = {
  display:  { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1:       { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h2:       { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
  h3:       { fontSize: 17, fontWeight: '600' as const },
  body:     { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySemi: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption:  { fontSize: 13, fontWeight: '500' as const, color: '#90a4ae' },
  label:    { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const, color: '#546e7a' },
  scoreLarge: { fontSize: 88, fontWeight: '800' as const, letterSpacing: -2, lineHeight: 92 },
};

export const radius = { sm: 6, md: 10, lg: 14, xl: 20, full: 9999 };

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardLifted: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  button: {
    shadowColor: '#2E75B6',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
};
