import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
});

export const typography = {
  fontFamily,
  h1: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  } as TextStyle,
  h2: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  } as TextStyle,
  h3: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  } as TextStyle,
  body: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
  } as TextStyle,
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  } as TextStyle,
  bodyBold: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  } as TextStyle,
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  } as TextStyle,
  captionMedium: {
    fontFamily,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  } as TextStyle,
  captionBold: {
    fontFamily,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  } as TextStyle,
  footnote: {
    fontFamily,
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
  } as TextStyle,
  storyName: {
    fontFamily,
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
    letterSpacing: -0.1,
  } as TextStyle,
  dmTitle: {
    fontFamily,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  } as TextStyle,
};
