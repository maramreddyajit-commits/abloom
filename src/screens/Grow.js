import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { C, F, R, S } from '../theme';
import { Screen, Txt, Button, Card, Icon, IconButton, ProgressBar, Pill, LinkText, Sheet, Input, Chip, ChipWrap } from '../components/ui';
import Plant from '../components/Plant';
import { useStore } from '../state/store';
import { useFlows } from '../flows/FlowsProvider';
import { useToast } from '../components/Toast';
import { growth, weekDots, wateredToday, countToday, nextRung, unlockedLessonCount } from '../lib/model';
import { STAGE_NAMES, PLANT_NAME_IDEAS } from '../content/copy';
import { LESSONS } from '../content/lessons';
import { greeting, todayKey } from '../lib/dates';
import { SudsBadge } from '../flows/ExposureFlow';

const DOW = ['s', 'm', 't', 'w', 't', 'f', 's'];

export default function Grow() {
  const { data, actions, lastWater } = useStore();
  const flows = useFlows();
  const toast = useToast();
  const [seedSheet, setSeedSheet] = useState(false);
  const [seedName, setSeedName] = useState('');
  const nudged = useRef(null);

  const g = growth(data);
  const calm = data.settings.calmMode;
  const dots = weekDots(data);
  const watered = wateredToday(data);
  const today = countToday(data);
  const rung = nextRung(data.ladder);
  const unlocked = unlockedLessonCount(data, LESSONS.length);
  const lesson = LESSONS.slice(0, unlocked).find(l => !data.lessons.read.includes(l.id));
  const firstRun = !data.log.some(l => l.action !== 'slip');

  // "a tool, not a ritual": a gentle nudge if logging itself starts to look compulsive.
  useEffect(() => {
    if (today >= 8 && nudged.current !== todayKey()) {
      nudged.current = todayKey();
      setTimeout(() => toast.show({ text: 'you’ve logged a lot today. abloom is a tool, not a ritual. you don’t need to track every one.', icon: 'leaf-outline', duration: 8000 }), 2500);
    }
  }, [today]);

  const stageLine = g.bloomed ? 'every drop still counts.' : calm ? 'growing, at its own pace' : `${g.daysToNext} more water day${g.daysToNext === 1 ? '' : 's'} until ${STAGE_NAMES[g.stage + 1]}`;

  return (
    <Screen header={
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.md, paddingTop: S.xs }}>
        <View style={{ flex: 1 }}>
          <Txt v="caption">{greeting()}</Txt>
          <Txt v="h1" style={{ color: C.green, marginTop: -2 }} accessibilityRole="header">{data.plant.name}</Txt>
        </View>
        <Button title="i’m struggling" variant="secondary" size="sm" full={false} icon="heart-outline" onPress={() => flows.openSupport()} textStyle={{ color: C.sun }} style={{ borderColor: C.sunSoft }} />
      </View>
    }>
      {/* Plant */}
      <Card tone="surface" style={{ paddingTop: S.xs, alignItems: 'center', gap: S.xs }}>
        <Plant stage={g.stage} pulseKey={lastWater?.at} boxHeight={250} />
        <Pill text={STAGE_NAMES[g.stage]} icon="leaf" center />
        <View style={{ alignSelf: 'stretch', gap: 6, paddingHorizontal: S.xs, marginTop: S.xxs }}>
          {!calm && !g.bloomed ? <ProgressBar pct={g.pct} color={C.leaf} label="growth to next stage" /> : null}
          <Txt v="small" style={{ textAlign: 'center' }}>{stageLine}</Txt>
        </View>
        {!calm ? (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: S.xs }} accessible accessibilityLabel={`watered ${dots.filter(d => d.watered).length} of the last 7 days`}>
            {dots.map(d => (
              <View key={d.key} style={{ alignItems: 'center', gap: 3 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: d.watered ? C.waterSoft : C.card, borderWidth: d.isToday ? 2 : 0, borderColor: C.water }}>
                  {d.watered ? <Icon name="water" size={14} color={C.water} /> : null}
                </View>
                <Text style={{ fontFamily: F.bodyBold, fontSize: 11, color: d.isToday ? C.water : C.inkMuted }}>{DOW[d.dow]}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      {/* Core actions */}
      {firstRun ? (
        <Card tone="water" style={{ flexDirection: 'row', gap: S.xs, alignItems: 'flex-start' }}>
          <Icon name="sparkles" size={20} color={C.waterDark} />
          <Txt v="small" style={{ flex: 1, color: C.ink }}>start here: next time an urge shows up, tap the blue button. or log one you already handled to give {data.plant.name} its first drop.</Txt>
        </Card>
      ) : null}
      <Button title="i have an urge" variant="water" size="lg" icon="flash" onPress={flows.openUrge} accessibilityHint="walks you through riding out an urge" />
      <Button title="log one i already handled" variant="secondary" icon="water-outline" onPress={flows.openQuickLog} />
      <Txt v="caption" style={{ textAlign: 'center', marginTop: -6 }}>
        {watered ? (calm ? `${data.plant.name} got water today.` : `${data.plant.name} got ${today} drop${today === 1 ? '' : 's'} today.`) : 'no water yet today. no pressure.'}
      </Txt>

      {g.bloomed ? (
        <Card tone="green" style={{ gap: S.xs }}>
          <Txt v="h3">{data.plant.name} is in full bloom</Txt>
          <Txt v="small">you can keep caring for it, or move it to your forest and grow something new.</Txt>
          <Button title="plant a new seed" variant="outline" icon="leaf-outline" onPress={() => { setSeedName(''); setSeedSheet(true); }} />
        </Card>
      ) : null}

      {lesson ? (
        <Card tone="surface" onPress={() => flows.openLesson(lesson.id)} accessibilityLabel={`today's read: ${lesson.title}`} style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
          <View style={{ width: 44, height: 44, borderRadius: R.md, backgroundColor: C.sunSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="book-outline" size={22} color={C.sun} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="caption">today’s 1-minute read</Txt>
            <Txt v="h3">{lesson.title}</Txt>
          </View>
          <Icon name="chevron-forward" size={18} color={C.inkMuted} />
        </Card>
      ) : null}

      {rung ? (
        <Card tone="surface" onPress={() => flows.openExposure(rung.id)} accessibilityLabel={`next on your ladder: ${rung.text}`} style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
          <SudsBadge v={rung.suds} />
          <View style={{ flex: 1 }}>
            <Txt v="caption">next on your ladder</Txt>
            <Txt v="h3">{rung.text}</Txt>
          </View>
          <Icon name="play-circle" size={28} color={C.green} />
        </Card>
      ) : data.log.length >= 3 ? (
        <Card tone="surface" style={{ gap: S.xs }}>
          <Txt v="h3">ready to lean in?</Txt>
          <Txt v="small">exposure practice is where ocd really starts to loosen. build a small ladder in the practice tab.</Txt>
        </Card>
      ) : null}

      <Sheet visible={seedSheet} onClose={() => setSeedSheet(false)} title="a new seed">
        <Txt v="bodySoft">{data.plant.name} moves to your forest. what should the new one be called?</Txt>
        <Input value={seedName} onChangeText={setSeedName} placeholder={PLANT_NAME_IDEAS.find(n => n !== data.plant.name)} maxLength={20} />
        <ChipWrap>{PLANT_NAME_IDEAS.filter(n => n !== data.plant.name).slice(0, 5).map(n => <Chip key={n} small label={n} selected={seedName === n} onPress={() => setSeedName(n)} />)}</ChipWrap>
        <Button title="plant it" icon="leaf" onPress={() => {
          const name = seedName.trim() || PLANT_NAME_IDEAS.find(n => n !== data.plant.name);
          const old = data.plant.name;
          actions.plantNewSeed(name);
          setSeedSheet(false);
          toast.show({ text: `${old} is in your forest now. say hi to ${name}.`, icon: 'leaf' });
        }} />
      </Sheet>
    </Screen>
  );
}
