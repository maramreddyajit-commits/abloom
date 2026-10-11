import React, { useState } from 'react';
import { C, S } from '../theme';
import { Sheet, Txt, Button, Chip, ChipWrap } from '../components/ui';
import { useStore } from '../state/store';
import { scheduleDailyReminder } from '../lib/notifications';
import { track } from '../lib/analytics';
import { useToast } from '../components/Toast';

export const REMINDER_TIMES = [
  { id: 'morning', label: 'morning · 9:00', hour: 9, minute: 0 },
  { id: 'lunch', label: 'midday · 12:30', hour: 12, minute: 30 },
  { id: 'evening', label: 'evening · 8:00', hour: 20, minute: 0 },
  { id: 'night', label: 'night · 10:00', hour: 22, minute: 0 },
];

// Offered once, right after the first watering (when motivation is highest).
export default function ReminderSheet({ visible, onClose }) {
  const { data, actions } = useStore();
  const toast = useToast();
  const [choice, setChoice] = useState('evening');
  if (!data) return null;
  const save = async () => {
    const t = REMINDER_TIMES.find(x => x.id === choice);
    const ok = await scheduleDailyReminder({ hour: t.hour, minute: t.minute, plantName: data.plant.name });
    actions.setSetting('reminder', { enabled: ok, hour: t.hour, minute: t.minute });
    actions.setSetting('reminderAsked', true);
    track('reminder_set', { enabled: ok });
    toast.show({ text: ok ? `okay. one gentle nudge a day, ${t.label.split(' · ')[0]}.` : 'notifications are off for abloom. you can turn them on in your phone’s settings.', icon: ok ? 'notifications-outline' : 'alert-circle-outline' });
    onClose();
  };
  const skip = () => { actions.setSetting('reminderAsked', true); onClose(); };
  return (
    <Sheet visible={visible} onClose={skip} title="a gentle nudge?">
      <Txt v="body">people who set one small daily reminder are much more likely to keep practising. we’ll send one a day, never more, and no badges.</Txt>
      <ChipWrap>{REMINDER_TIMES.map(t => <Chip key={t.id} label={t.label} selected={choice === t.id} onPress={() => setChoice(t.id)} />)}</ChipWrap>
      <Button title="remind me" icon="notifications-outline" onPress={save} />
      <Button title="no thanks" variant="ghost" onPress={skip} />
    </Sheet>
  );
}
