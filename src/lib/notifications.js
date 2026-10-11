// One optional, gentle local reminder a day. No push server, no badges.
// (Unread badges can drive checking in OCD, so we never set one.)
import { Platform } from 'react-native';
import { REMINDER_LINES } from '../content/copy';

export const remindersSupported = Platform.OS === 'ios' || Platform.OS === 'android';

let N = null;
const lib = () => {
  if (!remindersSupported) return null;
  if (!N) {
    try {
      N = require('expo-notifications');
      N.setNotificationHandler({
        handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
      });
    } catch { N = null; }
  }
  return N;
};

export async function scheduleDailyReminder({ hour, minute, plantName }) {
  const n = lib();
  if (!n) return false;
  try {
    let { status } = await n.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await n.requestPermissionsAsync());
    if (status !== 'granted') return false;
    if (Platform.OS === 'android') {
      await n.setNotificationChannelAsync('gentle', { name: 'gentle reminders', importance: n.AndroidImportance.DEFAULT });
    }
    await n.cancelAllScheduledNotificationsAsync();
    const body = REMINDER_LINES[Math.floor(Math.random() * REMINDER_LINES.length)];
    await n.scheduleNotificationAsync({
      content: { title: plantName ? `${plantName} says hi` : 'abloom', body, sound: false },
      trigger: { type: n.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'gentle' },
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelReminders() {
  const n = lib();
  if (!n) return;
  try { await n.cancelAllScheduledNotificationsAsync(); } catch {}
}
