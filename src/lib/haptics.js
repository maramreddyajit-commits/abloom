import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Haptics are a nice-to-have: never let them throw (web, simulators, older devices).
const safe = fn => { if (Platform.OS === 'web') return; try { fn()?.catch?.(() => {}); } catch {} };

export const tap = () => safe(() => Haptics.selectionAsync());
export const bump = () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const thud = () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const success = () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
