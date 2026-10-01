export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  divider: string;
  hairline: string;
  accent: string;
  accentSecondary: string;
  destructive: string;
  like: string;
  sentBubble: readonly [string, string, ...string[]];
  sentBubbleText: string;
  receivedBubble: string;
  receivedBubbleText: string;
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
  storyRingGradient: readonly [string, string, ...string[]];
  storyRingSeen: string;
  badge: string;
  badgeText: string;
  modalOverlay: string;
  reactionBarBg: string;
}

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#FAFAFA',
  card: '#FFFFFF',
  textPrimary: '#000000',
  textSecondary: '#8E8E8E',
  textTertiary: '#C7C7CC',
  divider: '#DBDBDB',
  hairline: 'rgba(0, 0, 0, 0.1)',
  accent: '#0095F6',
  accentSecondary: '#E8F5FE',
  destructive: '#ED4956',
  like: '#ED4956',
  sentBubble: ['#3797F0', '#6A53AE', '#9B33B5'], // Instagram gradient
  sentBubbleText: '#FFFFFF',
  receivedBubble: '#EFEFEF',
  receivedBubbleText: '#000000',
  inputBackground: '#EFEFEF',
  inputText: '#000000',
  inputPlaceholder: '#8E8E8E',
  storyRingGradient: ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'],
  storyRingSeen: '#DBDBDB',
  badge: '#0095F6',
  badgeText: '#FFFFFF',
  modalOverlay: 'rgba(0, 0, 0, 0.65)',
  reactionBarBg: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#000000',
  surfaceSecondary: '#121212',
  card: '#121212',
  textPrimary: '#FFFFFF',
  textSecondary: '#A8A8A8',
  textTertiary: '#555555',
  divider: '#262626',
  hairline: 'rgba(255, 255, 255, 0.12)',
  accent: '#0095F6',
  accentSecondary: '#142E47',
  destructive: '#ED4956',
  like: '#ED4956',
  sentBubble: ['#3797F0', '#6A53AE', '#9B33B5'], // Instagram gradient
  sentBubbleText: '#FFFFFF',
  receivedBubble: '#262626',
  receivedBubbleText: '#FFFFFF',
  inputBackground: '#262626',
  inputText: '#FFFFFF',
  inputPlaceholder: '#737373',
  storyRingGradient: ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'],
  storyRingSeen: '#383838',
  badge: '#0095F6',
  badgeText: '#FFFFFF',
  modalOverlay: 'rgba(0, 0, 0, 0.85)',
  reactionBarBg: '#262626',
};
