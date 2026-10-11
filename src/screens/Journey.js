import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { C, F, HEAT, R, S } from '../theme';
import { Screen, ScreenHeader, Txt, Card, SectionTitle, Stat, Button, Icon } from '../components/ui';
import { PLANT_IMGS } from '../components/Plant';
import { useStore } from '../state/store';
import {
  calendarCells, actionCounts, topCompulsions, timeOfDay, urgeShift, wateredDates, longestRun, compulsionName,
} from '../lib/model';
import { fmtShortDate, fmtMinutes } from '../lib/dates';
import { therapistSummary } from '../lib/model';
import { shareText } from '../lib/share';
import { track } from '../lib/analytics';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Journey() {
  const { data } = useStore();
  const calm = data.settings.calmMode;
  const counts = actionCounts(data.log);
  const urgesRidden = data.log.filter(l => l.source === 'urge' && l.action !== 'slip').length;
  const empty = data.log.length === 0 && data.exposures.length === 0;

  const share = () => {
    track('share_summary');
    shareText({ title: 'my abloom summary', text: therapistSummary(data), filename: 'abloom-summary.txt' });
  };

  return (
    <Screen header={<ScreenHeader title="journey" subtitle="how far you’ve come" />}>
      {empty ? (
        <Card tone="green" style={{ gap: S.xs }}>
          <Txt v="h3">your journey starts with one drop</Txt>
          <Txt v="small">once you water your plant, your calendar, patterns and exposure history show up here.</Txt>
        </Card>
      ) : null}

      {!calm && !empty ? (
        <Card tone="surface" style={{ flexDirection: 'row', paddingVertical: S.md }}>
          <Stat value={wateredDates(data.log).size} label="days practised" />
          <Stat value={urgesRidden} label="urges ridden" color={C.water} />
          <Stat value={data.exposures.length} label="exposures" color={C.sun} />
          <Stat value={longestRun(data)} label="longest run" color={C.leaf} />
        </Card>
      ) : null}

      <SectionTitle>last 5 weeks</SectionTitle>
      <Calendar data={data} calm={calm} />

      {calm ? (
        <Card style={{ flexDirection: 'row', gap: S.xs }}>
          <Icon name="eye-off-outline" size={20} color={C.inkSoft} />
          <Txt v="small" style={{ flex: 1 }}>calm mode is on, so numbers and charts are hidden. you can turn it off in “you”.</Txt>
        </Card>
      ) : null}

      {!calm && data.log.length >= 3 ? (<>
        <SectionTitle>how you meet urges</SectionTitle>
        <Card tone="surface" style={{ gap: S.sm }}>
          {[['resist', 'resisted', C.green], ['delay', 'delayed', C.water], ['shrink', 'shrank the ritual', C.leaf], ['slip', 'slips noticed', C.inkMuted]].map(([k, label, color]) => (
            <Bar key={k} label={label} value={counts[k]} max={Math.max(1, counts.resist, counts.delay, counts.shrink, counts.slip)} color={color} />
          ))}
          <UrgeShift data={data} />
        </Card>

        <SectionTitle>when urges show up</SectionTitle>
        <TimeOfDay data={data} />

        <SectionTitle>what you work on most</SectionTitle>
        <Card tone="surface" style={{ gap: S.sm }}>
          {topCompulsions(data.log).map(t => (
            <Bar key={t.id} label={compulsionName(data, t.id).toLowerCase()} value={t.count} max={topCompulsions(data.log)[0].count} color={C.green} suffix={`${Math.round(t.share * 100)}%`} />
          ))}
        </Card>
      </>) : null}

      {data.exposures.length ? (<>
        <SectionTitle>recent exposures</SectionTitle>
        <View style={{ gap: S.xs }}>
          {data.exposures.slice(-5).reverse().map(e => (
            <Card key={e.id} tone="surface" style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: S.xs }}>
                <Txt v="h3" style={{ flex: 1, fontSize: 16 }}>{e.label}</Txt>
                <Txt v="caption">{fmtShortDate(e.ts)}</Txt>
              </View>
              {!calm ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
                  <Num n={e.sudsBefore} label="start" color={C.sun} />
                  <Icon name="arrow-forward" size={14} color={C.inkMuted} />
                  <Num n={e.sudsPeak} label="peak" color={C.danger} />
                  <Icon name="arrow-forward" size={14} color={C.inkMuted} />
                  <Num n={e.sudsAfter} label="end" color={C.green} />
                  <View style={{ flex: 1 }} />
                  <Txt v="caption">{fmtMinutes(e.seconds || 0)}</Txt>
                </View>
              ) : null}
              {e.learned ? <Txt v="small" style={{ fontStyle: 'italic' }}>“{e.learned}”</Txt> : null}
            </Card>
          ))}
        </View>
      </>) : null}

      <SectionTitle>your forest</SectionTitle>
      {data.forest.length ? (
        <Card tone="surface" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.md }}>
          {data.forest.map(t => (
            <View key={t.id} style={{ alignItems: 'center', width: 72 }}>
              <Image source={PLANT_IMGS[4]} style={{ width: 52, height: 70 }} resizeMode="contain" accessibilityLabel={`${t.name}, bloomed ${fmtShortDate(t.completedAt)}`} />
              <Txt v="caption" style={{ color: C.ink }} numberOfLines={1}>{t.name}</Txt>
              <Txt v="caption">{fmtShortDate(t.completedAt)}</Txt>
            </View>
          ))}
        </Card>
      ) : (
        <Card><Txt v="small">grow a plant to full bloom and it can join your forest here.</Txt></Card>
      )}

      {!empty ? (
        <Card tone="green" style={{ gap: S.xs }}>
          <Txt v="h3">working with a therapist?</Txt>
          <Txt v="small">share a plain summary of the last two weeks: practice days, how you met urges, exposures and your ladder. nothing is sent anywhere unless you choose where.</Txt>
          <Button title="share my summary" variant="outline" icon="share-outline" onPress={share} />
        </Card>
      ) : null}
    </Screen>
  );
}

function Calendar({ data, calm }) {
  const [w, setW] = useState(0);
  const cells = calendarCells(data, 5);
  const cw = w ? Math.floor(w / 7) : 0;
  const heat = n => (n === 0 ? HEAT[0] : calm ? HEAT[3] : HEAT[Math.min(4, n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4)]);
  return (
    <Card tone="surface" style={{ padding: S.sm }}>
      <View onLayout={e => setW(e.nativeEvent.layout.width)}>
        {cw ? (<>
          <View style={{ flexDirection: 'row' }}>
            {DOW.map((d, i) => <View key={i} style={{ width: cw, alignItems: 'center', paddingBottom: 4 }}><Txt v="caption">{d}</Txt></View>)}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map(c => (
              <View key={c.key} style={{ width: cw, height: Math.min(cw, 52), padding: 2.5 }}>
                <View accessible accessibilityLabel={`${c.key}: ${c.count ? 'practised' : 'no practice'}`}
                  style={{ flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: c.future ? 'transparent' : heat(c.count), borderWidth: c.isToday ? 2 : 0, borderColor: C.water }}>
                  <Text style={{ fontFamily: F.bodyBold, fontSize: 12, color: c.future ? C.border : c.count > 1 || (calm && c.count) ? C.white : C.inkMuted }}>{c.day}</Text>
                </View>
              </View>
            ))}
          </View>
          {!calm ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: S.xs }}>
              <Txt v="caption">less</Txt>
              {HEAT.map(h => <View key={h} style={{ width: 13, height: 13, borderRadius: 4, backgroundColor: h }} />)}
              <Txt v="caption">more</Txt>
            </View>
          ) : null}
        </>) : <View style={{ height: 240 }} />}
      </View>
    </Card>
  );
}

const Bar = ({ label, value, max, color, suffix }) => (
  <View style={{ gap: 4 }} accessible accessibilityLabel={`${label}: ${value}`}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Txt v="small" style={{ color: C.ink, flex: 1 }} numberOfLines={1}>{label}</Txt>
      <Txt v="small" style={{ fontFamily: F.bodyBold, color }}>{value}{suffix ? ` · ${suffix}` : ''}</Txt>
    </View>
    <View style={{ height: 8, borderRadius: 4, backgroundColor: C.card, overflow: 'hidden' }}>
      <View style={{ height: '100%', width: `${max ? (value / max) * 100 : 0}%`, backgroundColor: color, borderRadius: 4 }} />
    </View>
  </View>
);

function UrgeShift({ data }) {
  const s = urgeShift(data.log);
  if (!s) return <Txt v="caption">ride a few urges with “i have an urge” to see how their strength changes.</Txt>;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.waterSoft, borderRadius: R.md, padding: S.sm, marginTop: S.xxs }}>
      <Icon name="pulse" size={20} color={C.waterDark} />
      <Txt v="small" style={{ flex: 1, color: C.ink }}>across {s.count} urges you rode out, strength went from {s.before.toFixed(1)} at the start to {s.after.toFixed(1)} at the end, on average.</Txt>
    </View>
  );
}

function TimeOfDay({ data }) {
  const t = timeOfDay(data.log);
  const max = Math.max(1, ...Object.values(t));
  const icons = { morning: 'sunny-outline', afternoon: 'partly-sunny-outline', evening: 'cloudy-night-outline', night: 'moon-outline' };
  return (
    <Card tone="surface" style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 150, paddingBottom: S.sm }}>
      {Object.entries(t).map(([k, v]) => (
        <View key={k} style={{ alignItems: 'center', gap: 4, flex: 1 }} accessible accessibilityLabel={`${k}: ${v}`}>
          <Txt v="caption" style={{ fontFamily: F.bodyBold, color: C.ink }}>{v}</Txt>
          <View style={{ width: 26, height: Math.max(4, (v / max) * 70), borderRadius: 8, backgroundColor: C.leaf, opacity: 0.85 }} />
          <Icon name={icons[k]} size={18} color={C.inkSoft} />
          <Txt v="caption">{k}</Txt>
        </View>
      ))}
    </Card>
  );
}

const Num = ({ n, label, color }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ fontFamily: F.bodyHeavy, fontSize: 18, color }}>{n == null ? '–' : Math.round(n / 10)}</Text>
    <Txt v="caption" style={{ fontSize: 11 }}>{label}</Txt>
  </View>
);
