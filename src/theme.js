import { Platform } from 'react-native';

// Colour tokens. Text colours are tuned to pass WCAG AA (4.5:1) on `bg` and `card`.
export const C = {
  bg: '#FFF8F0',
  surface: '#FFFDF9',
  card: '#F6EDDF',
  cardAlt: '#EEE2CF',
  border: '#E2D3BC',

  ink: '#3B2C20',
  inkSoft: '#62503F',
  inkMuted: '#7A6552',
  placeholder: '#9C8874',

  green: '#3F7D48',
  greenDark: '#2F6237',
  greenSoft: '#DDEBD5',
  greenTint: '#EEF5EA',
  leaf: '#6E9C3A',

  water: '#2F78A3',
  waterDark: '#23628A',
  waterSoft: '#DCEBF4',

  sun: '#B95F25',
  sunSoft: '#F8E3D2',

  danger: '#A63A32',
  dangerSoft: '#F6DEDA',

  overlay: 'rgba(43, 31, 22, 0.45)',
  white: '#FFFFFF',
};

// Heat-map steps for the calendar (empty → most).
export const HEAT = ['#EFE6D8', '#CFE3C6', '#9CC594', '#5E9B5F', '#3F7D48'];

export const F = {
  display: 'Caveat_700Bold',
  displaySemi: 'Caveat_600SemiBold',
  body: 'Nunito_400Regular',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyHeavy: 'Nunito_800ExtraBold',
};

export const S = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48 };
export const R = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const T = {
  hero: { fontFamily: F.display, fontSize: 40, lineHeight: 46, color: C.green },
  h1: { fontFamily: F.display, fontSize: 32, lineHeight: 38, color: C.ink },
  h2: { fontFamily: F.display, fontSize: 26, lineHeight: 32, color: C.ink },
  h3: { fontFamily: F.bodyBold, fontSize: 17, lineHeight: 23, color: C.ink },
  body: { fontFamily: F.body, fontSize: 16, lineHeight: 23, color: C.ink },
  bodySoft: { fontFamily: F.body, fontSize: 15, lineHeight: 22, color: C.inkSoft },
  small: { fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.inkSoft },
  caption: { fontFamily: F.bodySemi, fontSize: 12.5, lineHeight: 17, color: C.inkMuted },
  label: { fontFamily: F.bodyBold, fontSize: 12.5, lineHeight: 16, color: C.inkMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  button: { fontFamily: F.bodyBold, fontSize: 16, lineHeight: 21 },
  stat: { fontFamily: F.bodyHeavy, fontSize: 24, lineHeight: 28, color: C.green },
};

export const shadow = Platform.select({
  web: { boxShadow: '0 6px 20px rgba(59,44,32,0.08)' },
  default: { shadowColor: '#3B2C20', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3 },
});

export const shadowStrong = Platform.select({
  web: { boxShadow: '0 12px 36px rgba(59,44,32,0.16)' },
  default: { shadowColor: '#3B2C20', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.16, shadowRadius: 28, elevation: 10 },
});

// The whole app is laid out in a phone-width column, centred on tablets and desktop web.
export const MAX_WIDTH = 520;
