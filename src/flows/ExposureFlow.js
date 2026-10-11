// Guided exposure (ERP) session. Framed around inhibitory learning: make a prediction, stay with it
// without compulsions, then check what you learned. Anxiety doesn't have to drop for it to count.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { C, F, R, S } from '../theme';
import { Sheet, Txt, Button, Chip, ChipWrap, Scale, Card, Icon, Input, Pill, ToggleRow } from '../components/ui';
import { useStore } from '../state/store';
import { sortedLadder, MASTERED_AFTER } from '../lib/model';
import { EXPOSURE_LEAN_IN } from '../content/copy';
import { fmtClock, fmtMinutes } from '../lib/dates';
import { success } from '../lib/haptics';

export default function ExposureFlow({ visible, onClose, rungId }) {
  const { data, actions } = useStore();
  const [step, setStep] = useState('pick');
  const [rung, setRung] = useState(null);
  const [label, setLabel] = useState('');
  const [prediction, setPrediction] = useState('');
  const [sudsBefore, setSudsBefore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [happened, setHappened] = useState(null);
  const [learned, setLearned] = useState('');
  const [sudsAfter, setSudsAfter] = useState(null);
  const [mastered, setMastered] = useState(false);
  const [leanIdx, setLeanIdx] = useState(0);
  const finished = useRef(false);

  useEffect(() => {
    if (!visible) return;
    const r = rungId ? data?.ladder.find(x => x.id === rungId) : null;
    setRung(r || null); setLabel(r ? r.text : ''); setStep(r ? 'predict' : 'pick');
    setPrediction(''); setSudsBefore(null); setRatings([]); setStartedAt(null); setHappened(null);
    setLearned(''); setSudsAfter(null); setMastered(false); setLeanIdx(0);
    finished.current = false;
  }, [visible, rungId]);

  useEffect(() => {
    if (step !== 'expose') return;
    const t = setInterval(() => setNow(Date.now()), 500);
    const p = setInterval(() => setLeanIdx(i => (i + 1) % EXPOSURE_LEAN_IN.length), 15000);
    return () => { clearInterval(t); clearInterval(p); };
  }, [step]);

  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const peak = useMemo(() => Math.max(sudsBefore ?? 0, ...ratings.map(r => r.v)), [ratings, sudsBefore]);
  if (!data) return null;
  const ladder = sortedLadder(data.ladder);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onClose();
    setTimeout(() => {
      actions.saveExposure({
        rungId: rung?.id || null, label: label.trim() || 'exposure', prediction: prediction.trim(), sudsBefore, sudsPeak: peak, sudsAfter,
        seconds: elapsed, ratings, predictionCameTrue: happened || 'unsure', learned: learned.trim(),
      });
      if (rung && mastered) actions.updateRung(rung.id, { mastered: true });
      success();
    }, 250);
  };
  const close = () => (step === 'done' ? finish() : onClose());

  const titles = { pick: 'exposure practice', predict: 'before you start', expose: 'stay with it', debrief: 'debrief', done: 'nice work' };

  return (
    <Sheet visible={visible} onClose={close} title={titles[step]} full={step === 'expose'}>
      {step === 'pick' && (<>
        <Txt v="bodySoft">choose something to face on purpose. hard but doable is the sweet spot.</Txt>
        {ladder.length ? ladder.map(r => (
          <Card key={r.id} tone="surface" onPress={() => { setRung(r); setLabel(r.text); setStep('predict'); }} accessibilityLabel={`${r.text}, difficulty ${Math.round(r.suds / 10)} of 10`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.sm }}>
            <SudsBadge v={r.suds} />
            <View style={{ flex: 1 }}>
              <Txt v="h3" style={{ fontSize: 16 }}>{r.text}</Txt>
              <Txt v="caption">{r.mastered ? 'done — practise any time' : r.practiced ? `practised ${r.practiced}×` : 'not tried yet'}</Txt>
            </View>
            <Icon name="chevron-forward" size={18} color={C.inkMuted} />
          </Card>
        )) : (
          <Card><Txt v="small">your ladder is empty. you can add steps in the practice tab, or just describe one below.</Txt></Card>
        )}
        <Txt v="label">or something new</Txt>
        <Input value={label} onChangeText={setLabel} placeholder="e.g. touch the doorknob and don’t wash" returnKeyType="next" />
        <Button title="next" icon="arrow-forward" disabled={!label.trim()} onPress={() => { setRung(null); setStep('predict'); }} />
      </>)}

      {step === 'predict' && (<>
        <Pill text={label} tone="muted" icon="flag-outline" />
        <View style={{ gap: 6 }}>
          <Txt v="h3">what does ocd say will happen?</Txt>
          <Input value={prediction} onChangeText={setPrediction} placeholder="e.g. i’ll get sick, or i won’t be able to stand it" multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
        </View>
        <View style={{ gap: 6 }}>
          <Txt v="h3">how anxious are you right now?</Txt>
          <Scale value={sudsBefore} onChange={setSudsBefore} max={100} step={10} label="anxiety before" lowLabel="calm" highLabel="worst ever" />
        </View>
        <Card tone="green">
          <Txt v="small">during the exposure: no compulsions, no reassurance, no mental reviewing. if the anxiety rises, let it. you’re not trying to feel calm.</Txt>
        </Card>
        <Button title="start the exposure" icon="play" disabled={sudsBefore == null} onPress={() => { setStartedAt(Date.now()); setNow(Date.now()); setRatings([{ t: 0, v: sudsBefore }]); setStep('expose'); }} />
      </>)}

      {step === 'expose' && (
        <View style={{ flex: 1, gap: S.md }}>
          <View style={{ alignItems: 'center', gap: S.sm }}>
            <Pill text={label} tone="muted" />
            <View style={{ width: 170, height: 170, borderRadius: 85, borderWidth: 4, borderColor: C.greenSoft, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: F.display, fontSize: 50, color: C.green }}>{fmtClock(elapsed)}</Text>
              <Txt v="caption">you’re in it</Txt>
            </View>
          </View>
          <Card tone="green" style={{ minHeight: 72, justifyContent: 'center' }}>
            <Txt v="body" style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">{EXPOSURE_LEAN_IN[leanIdx]}</Txt>
          </Card>
          <View>
            <Txt v="label" style={{ marginBottom: 6 }}>anxiety now — tap whenever it shifts</Txt>
            <Scale value={ratings.length ? ratings[ratings.length - 1].v : null} onChange={v => setRatings(r => [...r, { t: elapsed, v }])} max={100} step={10} label="anxiety now" lowLabel="calm" highLabel="worst ever" />
          </View>
          <Curve ratings={ratings} />
          <View style={{ flex: 1 }} />
          <Txt v="caption" style={{ textAlign: 'center' }}>stay until you’ve learned something or the feeling has shifted. even a few minutes counts.</Txt>
          <Button title="end the exposure" icon="stop" onPress={() => setStep('debrief')} />
        </View>
      )}

      {step === 'debrief' && (<>
        <Txt v="bodySoft">you stayed for {fmtMinutes(elapsed)}.</Txt>
        {prediction.trim() ? (
          <View style={{ gap: 6 }}>
            <Txt v="h3">you predicted: “{prediction.trim()}”. did it happen?</Txt>
            <ChipWrap>
              {[['no', 'no'], ['yes', 'yes'], ['unsure', 'not sure yet']].map(([v, l]) => <Chip key={v} label={l} selected={happened === v} onPress={() => setHappened(v)} />)}
            </ChipWrap>
          </View>
        ) : null}
        <View style={{ gap: 6 }}>
          <Txt v="h3">what did you notice or learn?</Txt>
          <Input value={learned} onChangeText={setLearned} placeholder="e.g. i could handle more than i expected" multiline style={{ minHeight: 64, textAlignVertical: 'top' }} />
        </View>
        <View style={{ gap: 6 }}>
          <Txt v="h3">anxiety now?</Txt>
          <Scale value={sudsAfter} onChange={setSudsAfter} max={100} step={10} label="anxiety after" lowLabel="calm" highLabel="worst ever" color={C.green} />
        </View>
        <Button title="save" disabled={sudsAfter == null || (prediction.trim() && !happened)} onPress={() => setStep('done')} />
      </>)}

      {step === 'done' && (<>
        <View style={{ alignItems: 'center', gap: S.xs }}>
          <Txt v="h1" style={{ color: C.green, textAlign: 'center' }}>you faced it on purpose.</Txt>
          <View style={{ flexDirection: 'row', gap: S.lg, marginTop: S.xs }}>
            <Mini n={sudsBefore} label="start" color={C.sun} />
            <Mini n={peak} label="peak" color={C.danger} />
            <Mini n={sudsAfter} label="end" color={C.green} />
          </View>
          <Txt v="small" style={{ textAlign: 'center', marginTop: S.xs }}>
            {happened === 'no' ? 'what ocd predicted didn’t happen this time. notice that, without needing it to be a guarantee.'
              : happened === 'unsure' ? 'you sat with not knowing. that’s the hardest part of this work.'
              : happened === 'yes' ? 'it happened, and you got through it. that’s worth knowing too.'
              : 'you stayed with the discomfort without the ritual. that’s the practice.'}
          </Txt>
        </View>
        {rung && (rung.practiced || 0) + 1 >= MASTERED_AFTER - 1 && !rung.mastered ? (
          <Card><ToggleRow title="this step feels easier now" subtitle="mark it done and move up your ladder" value={mastered} onChange={setMastered} icon="trending-up" /></Card>
        ) : null}
        <Button title={`water ${data.plant.name}`} variant="water" icon="water" size="lg" onPress={finish} />
      </>)}
    </Sheet>
  );
}

export const SudsBadge = ({ v }) => {
  const color = v >= 70 ? C.danger : v >= 40 ? C.sun : C.green;
  return (
    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={`difficulty ${Math.round(v / 10)} of 10`}>
      <Text style={{ fontFamily: F.bodyHeavy, fontSize: 17, color: C.white }}>{Math.round(v / 10)}</Text>
    </View>
  );
};

const Mini = ({ n, label, color }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ fontFamily: F.bodyHeavy, fontSize: 30, color }}>{n == null ? '–' : Math.round(n / 10)}</Text>
    <Txt v="caption">{label}</Txt>
  </View>
);

function Curve({ ratings }) {
  if (ratings.length < 2) return null;
  const last = ratings.slice(-24);
  return (
    <View style={{ height: 56, flexDirection: 'row', alignItems: 'flex-end', gap: 3, backgroundColor: C.card, borderRadius: R.md, padding: 6 }} accessibilityLabel="anxiety over time">
      {last.map((r, i) => (
        <View key={i} style={{ flex: 1, height: `${Math.max(6, r.v)}%`, backgroundColor: r.v >= 70 ? C.danger : r.v >= 40 ? C.sun : C.green, borderRadius: 3, opacity: 0.75 }} />
      ))}
    </View>
  );
}
