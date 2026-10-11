import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { C, R, S } from '../theme';
import { Screen, ScreenHeader, Txt, Button, Card, Icon, IconButton, Input, Scale, SectionTitle, Sheet, Chip, ChipWrap, ToggleRow, LinkText } from '../components/ui';
import { useStore } from '../state/store';
import { useFlows } from '../flows/FlowsProvider';
import { sortedLadder, nextRung, activeCompulsions, unlockedLessonCount } from '../lib/model';
import { SudsBadge } from '../flows/ExposureFlow';
import { EXPOSURE_IDEAS } from '../content/exposureIdeas';
import { LESSONS } from '../content/lessons';

export default function Practice() {
  const { data, actions } = useStore();
  const flows = useFlows();
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [suds, setSuds] = useState(null);
  const [edit, setEdit] = useState(null);

  const ladder = sortedLadder(data.ladder);
  const next = nextRung(data.ladder);
  const unlocked = unlockedLessonCount(data, LESSONS.length);

  const ideas = useMemo(() => {
    const cats = [...new Set(activeCompulsions(data).map(c => c.cat))].filter(c => EXPOSURE_IDEAS[c]);
    const pool = (cats.length ? cats : Object.keys(EXPOSURE_IDEAS)).flatMap(c => EXPOSURE_IDEAS[c]);
    return pool.filter(i => !data.ladder.some(r => r.text === i.text)).slice(0, 6);
  }, [data.compulsions.active, data.ladder]);

  const add = () => {
    actions.addRung(text, suds);
    setText(''); setSuds(null); setAdding(false);
  };

  return (
    <Screen header={<ScreenHeader title="practice" subtitle="lean in on purpose, one step at a time" />}>
      {next ? (
        <Card tone="green" style={{ gap: S.sm }}>
          <Txt v="label" style={{ color: C.greenDark }}>your next step</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
            <SudsBadge v={next.suds} />
            <Txt v="h3" style={{ flex: 1 }}>{next.text}</Txt>
          </View>
          <Button title="start this exposure" icon="play" onPress={() => flows.openExposure(next.id)} />
        </Card>
      ) : (
        <Card tone="green" style={{ gap: S.xs }}>
          <Txt v="h3">what’s an exposure ladder?</Txt>
          <Txt v="small">a list of things ocd makes you avoid or ritualise around, rated from easiest to hardest. you practise the easiest first, then climb. it’s the heart of ERP.</Txt>
        </Card>
      )}

      <SectionTitle right={<LinkText title={adding ? 'cancel' : 'add a step'} icon={adding ? 'close' : 'add'} onPress={() => setAdding(a => !a)} />}>your ladder</SectionTitle>

      {adding ? (
        <Card tone="surface" style={{ gap: S.sm }}>
          <Txt v="h3">what would you face?</Txt>
          <Input value={text} onChangeText={setText} placeholder="e.g. leave the house without checking the stove" autoFocus />
          <Txt v="h3">how hard does it feel? (0–10)</Txt>
          <Scale value={suds} onChange={setSuds} max={100} step={10} label="difficulty" lowLabel="easy" highLabel="hardest" />
          <Button title="add to ladder" disabled={!text.trim() || suds == null} onPress={add} />
        </Card>
      ) : null}

      {ladder.length ? (
        <View style={{ gap: S.xs }}>
          {[...ladder].reverse().map(r => (
            <Card key={r.id} tone="surface" style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.sm, opacity: r.mastered ? 0.7 : 1 }}>
              <SudsBadge v={r.suds} />
              <View style={{ flex: 1 }}>
                <Txt v="h3" style={{ fontSize: 16, textDecorationLine: r.mastered ? 'line-through' : 'none' }}>{r.text}</Txt>
                <Txt v="caption">{r.mastered ? 'done' : r.practiced ? `practised ${r.practiced}×` : 'not tried yet'}</Txt>
              </View>
              <IconButton name="ellipsis-horizontal" label={`options for ${r.text}`} onPress={() => setEdit(r)} />
              <IconButton name="play-circle" color={C.green} size={30} label={`start ${r.text}`} onPress={() => flows.openExposure(r.id)} />
            </Card>
          ))}
          <Txt v="caption" style={{ textAlign: 'center' }}>hardest at the top. climb from the bottom.</Txt>
        </View>
      ) : null}

      {ideas.length ? (
        <View style={{ gap: S.xs }}>
          <Txt v="label">ideas to start with</Txt>
          <Txt v="caption">tap to add. re-rate them for yourself. only pick things that are safe, just uncomfortable.</Txt>
          {ideas.map(i => (
            <Card key={i.text} onPress={() => actions.addRung(i.text, i.suds)} accessibilityLabel={`add ${i.text}`} style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.sm }}>
              <Icon name="add-circle-outline" size={24} color={C.green} />
              <Txt v="small" style={{ flex: 1, color: C.ink }}>{i.text}</Txt>
            </Card>
          ))}
        </View>
      ) : null}

      <Button title="quick exposure (not on my ladder)" variant="secondary" icon="flag-outline" onPress={() => flows.openExposure(null)} />

      <SectionTitle>learn</SectionTitle>
      <View style={{ gap: S.xs }}>
        {LESSONS.map((l, i) => {
          const open = i < unlocked;
          const read = data.lessons.read.includes(l.id);
          return (
            <Card key={l.id} tone={open ? 'surface' : 'card'} onPress={open ? () => flows.openLesson(l.id) : undefined} accessibilityLabel={open ? l.title : `${l.title}, unlocks in ${i - unlocked + 1} days`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.sm }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: read ? C.greenSoft : open ? C.sunSoft : C.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={read ? 'checkmark' : open ? 'book-outline' : 'lock-closed-outline'} size={17} color={read ? C.green : open ? C.sun : C.inkMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="h3" style={{ fontSize: 16, color: open ? C.ink : C.inkMuted }}>{l.title}</Txt>
                <Txt v="caption">{open ? `day ${i + 1} · 1 min` : i - unlocked === 0 ? 'unlocks tomorrow' : `unlocks in ${i - unlocked + 1} days`}</Txt>
              </View>
            </Card>
          );
        })}
      </View>

      <Sheet visible={!!edit} onClose={() => setEdit(null)} title="ladder step">
        {edit ? (<>
          <Input value={edit.text} onChangeText={t => setEdit({ ...edit, text: t })} />
          <Txt v="h3">difficulty</Txt>
          <Scale value={edit.suds} onChange={v => setEdit({ ...edit, suds: v })} max={100} step={10} label="difficulty" lowLabel="easy" highLabel="hardest" />
          <ToggleRow title="mark as done" subtitle="it feels manageable now" value={!!edit.mastered} onChange={v => setEdit({ ...edit, mastered: v })} icon="checkmark-done" />
          <Button title="save" onPress={() => { actions.updateRung(edit.id, { text: edit.text.trim() || 'exposure', suds: edit.suds, mastered: edit.mastered }); setEdit(null); }} />
          <Button title="remove from ladder" variant="danger" icon="trash-outline" onPress={() => { actions.removeRung(edit.id); setEdit(null); }} />
        </>) : null}
      </Sheet>
    </Screen>
  );
}
