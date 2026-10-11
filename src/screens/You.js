import React, { useState } from 'react';
import { Image, Linking, View } from 'react-native';
import { C, S } from '../theme';
import { Screen, ScreenHeader, Txt, Button, Card, Chip, ChipWrap, Row, ToggleRow, Divider, SectionTitle, Sheet, Input, LinkText } from '../components/ui';
import { PLANT_IMGS } from '../components/Plant';
import { useStore } from '../state/store';
import { useFlows } from '../flows/FlowsProvider';
import { useToast } from '../components/Toast';
import { activeCompulsions, growth, makeBackup, parseBackup, therapistSummary } from '../lib/model';
import { remindersSupported, scheduleDailyReminder, cancelReminders } from '../lib/notifications';
import { analyticsAvailable } from '../lib/analytics';
import { shareText } from '../lib/share';
import { REMINDER_TIMES } from '../flows/ReminderSheet';
import { DISCLAIMER, IOCDF_DIRECTORY, PRIVACY_URL, SUPPORT_EMAIL } from '../content/copy';
import { track } from '../lib/analytics';
import { todayKey } from '../lib/dates';

const fmtTime = (h, m) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;

export default function You() {
  const { data, actions } = useStore();
  const flows = useFlows();
  const toast = useToast();
  const [sheet, setSheet] = useState(null); // 'rename' | 'import' | 'reset' | 'reminder'
  const [draft, setDraft] = useState('');
  const [importErr, setImportErr] = useState('');
  const list = activeCompulsions(data);
  const g = growth(data);
  const st = data.settings;

  const setReminder = async t => {
    const ok = await scheduleDailyReminder({ hour: t.hour, minute: t.minute, plantName: data.plant.name });
    actions.setSetting('reminder', { enabled: ok, hour: t.hour, minute: t.minute });
    actions.setSetting('reminderAsked', true);
    track('reminder_set', { enabled: ok });
    if (!ok) toast.show({ text: 'notifications are off for abloom. you can allow them in your phone’s settings.', icon: 'alert-circle-outline' });
    setSheet(null);
  };

  return (
    <Screen header={<ScreenHeader title="you" subtitle="your plant, your list, your settings" />}>
      <Card tone="surface" style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.greenTint, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 }}>
          <Image source={PLANT_IMGS[g.stage]} style={{ width: 44, height: 50 }} resizeMode="contain" />
        </View>
        <View style={{ flex: 1 }}>
          <Txt v="h2" style={{ color: C.green }}>{data.plant.name}</Txt>
          <Txt v="small">{data.forest.length ? `${data.forest.length} in your forest` : 'your first plant'}</Txt>
        </View>
        <LinkText title="rename" onPress={() => { setDraft(data.plant.name); setSheet('rename'); }} />
      </Card>

      <SectionTitle right={<LinkText title="edit" icon="create-outline" onPress={flows.openCompulsions} />}>my compulsions</SectionTitle>
      {list.length ? (
        <ChipWrap>{list.map(c => <Chip key={c.id} small label={c.name} onPress={flows.openCompulsions} />)}</ChipWrap>
      ) : (
        <Card><Txt v="small">none yet. add the ones ocd pushes you toward, so logging is one tap.</Txt></Card>
      )}

      <SectionTitle>settings</SectionTitle>
      <Card tone="surface" style={{ paddingVertical: S.xxs }}>
        {remindersSupported ? (<>
          <ToggleRow icon="notifications-outline" title="daily reminder" value={st.reminder.enabled}
            subtitle={st.reminder.enabled ? `once a day at ${fmtTime(st.reminder.hour, st.reminder.minute)}` : 'one gentle nudge a day, no badges'}
            onChange={async v => {
              if (v) setSheet('reminder');
              else { await cancelReminders(); actions.setSetting('reminder', { ...st.reminder, enabled: false }); }
            }} />
          <Divider />
        </>) : null}
        <ToggleRow icon="eye-off-outline" title="calm mode" subtitle="hide numbers, charts and progress bars. some people find counting gets sticky." value={st.calmMode} onChange={v => actions.setSetting('calmMode', v)} />
        <Divider />
        <ToggleRow icon="chatbubbles-outline" title="ai companion" subtitle={st.aiConsent ? 'on. messages go to Anthropic to write replies.' : 'off. nothing is sent.'} value={st.aiConsent}
          onChange={v => { actions.setSetting('aiConsent', v); track('ai_consent', { granted: v }); }} />
        {analyticsAvailable() ? (<>
          <Divider />
          <ToggleRow icon="analytics-outline" title="help improve abloom" subtitle="anonymous usage counts only. never what you log or type." value={st.analytics} onChange={v => actions.setSetting('analytics', v)} />
        </>) : null}
      </Card>

      <SectionTitle>your data</SectionTitle>
      <Card tone="surface" style={{ paddingVertical: S.xxs }}>
        <Row icon="share-outline" title="share a summary" subtitle="last 2 weeks, plain text, for you or a therapist"
          onPress={() => { track('share_summary'); shareText({ title: 'my abloom summary', text: therapistSummary(data), filename: 'abloom-summary.txt' }); }} />
        <Divider />
        <Row icon="download-outline" title="back up my data" subtitle="everything lives only on this phone. save a copy somewhere safe."
          onPress={() => shareText({ title: 'abloom backup', text: makeBackup(data), filename: `abloom-backup-${todayKey()}.json` })} />
        <Divider />
        <Row icon="cloud-upload-outline" title="restore from a backup" onPress={() => { setDraft(''); setImportErr(''); setSheet('import'); }} />
        <Divider />
        <Row icon="trash-outline" title="delete all my data" danger onPress={() => setSheet('reset')} />
      </Card>

      <SectionTitle>help & about</SectionTitle>
      <Card tone="surface" style={{ paddingVertical: S.xxs }}>
        <Row icon="heart-outline" title="get help now" subtitle="crisis lines, free and confidential" onPress={() => flows.openSupport('help')} />
        <Divider />
        <Row icon="people-outline" title="find an ERP therapist" subtitle="International OCD Foundation directory" onPress={() => Linking.openURL(IOCDF_DIRECTORY).catch(() => {})} />
        <Divider />
        <Row icon="document-text-outline" title="privacy policy" onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})} />
        <Divider />
        <Row icon="mail-outline" title="contact us" subtitle={SUPPORT_EMAIL} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=abloom`).catch(() => {})} />
      </Card>
      <Txt v="caption" style={{ textAlign: 'center', paddingHorizontal: S.md }}>{DISCLAIMER}</Txt>
      <Txt v="caption" style={{ textAlign: 'center' }}>abloom 1.1.0</Txt>

      <Sheet visible={sheet === 'rename'} onClose={() => setSheet(null)} title="rename your plant">
        <Input value={draft} onChangeText={setDraft} maxLength={20} autoFocus />
        <Button title="save" disabled={!draft.trim()} onPress={() => { actions.renamePlant(draft); setSheet(null); }} />
      </Sheet>

      <Sheet visible={sheet === 'reminder'} onClose={() => setSheet(null)} title="when should we nudge you?">
        <Txt v="bodySoft">one notification a day. it never stacks up, and there are no badges.</Txt>
        <ChipWrap>{REMINDER_TIMES.map(t => <Chip key={t.id} label={t.label} onPress={() => setReminder(t)} />)}</ChipWrap>
      </Sheet>

      <Sheet visible={sheet === 'import'} onClose={() => setSheet(null)} title="restore a backup">
        <Txt v="bodySoft">paste the contents of an abloom backup file. this replaces what’s on this phone now.</Txt>
        <Input value={draft} onChangeText={t => { setDraft(t); setImportErr(''); }} multiline placeholder='{"app":"abloom", …}' style={{ minHeight: 140, textAlignVertical: 'top', fontSize: 13 }} autoCapitalize="none" autoCorrect={false} />
        {importErr ? <Txt v="small" style={{ color: C.danger }}>{importErr}</Txt> : null}
        <Button title="restore" disabled={!draft.trim()} onPress={() => {
          try {
            const next = parseBackup(draft);
            actions.replaceData(next);
            setSheet(null);
            toast.show({ text: 'backup restored.', icon: 'checkmark-circle-outline' });
          } catch (e) { setImportErr(e.message); }
        }} />
      </Sheet>

      <Sheet visible={sheet === 'reset'} onClose={() => setSheet(null)} title="delete everything?">
        <Txt v="body">this permanently removes your plant, forest, logs, ladder and settings from this phone. it can’t be undone unless you have a backup.</Txt>
        <Button title="yes, delete all my data" variant="danger" icon="trash-outline" onPress={async () => { setSheet(null); await cancelReminders(); await actions.resetAll(); }} />
        <Button title="keep my data" variant="secondary" onPress={() => setSheet(null)} />
      </Sheet>
    </Screen>
  );
}
