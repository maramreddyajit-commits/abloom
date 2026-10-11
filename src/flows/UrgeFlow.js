// The core loop: an urge shows up → name it → choose resist / delay / shrink → ride it out → water.
// Partial wins (delaying, shrinking) water the plant too, so there's no all-or-nothing failure.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { C, F, R, S } from '../theme';
import { Sheet, Txt, Button, Chip, ChipWrap, Scale, Card, Icon, LinkText, Input, Pill } from '../components/ui';
import { useStore } from '../state/store';
import { activeCompulsions, compulsionName } from '../lib/model';
import { GENERIC_ID } from '../content/compulsions';
import { SURF_PROMPTS, SLIP_MESSAGES, ENCOURAGEMENTS, PARTIAL_PRAISE } from '../content/copy';
import { fmtClock, fmtMinutes } from '../lib/dates';
import { track } from '../lib/analytics';
import { tap, success } from '../lib/haptics';
import CrisisCard from '../components/CrisisCard';

const pick = a => a[Math.floor(Math.random() * a.length)];

const PLANS = [
  { id: 'resist', icon: 'shield-checkmark-outline', title: 'resist it', body: 'let the urge be there and don’t do the compulsion.' },
  { id: 'delay', icon: 'hourglass-outline', title: 'delay it', body: 'wait a set time first. waiting is a real win, even if you do it after.' },
  { id: 'shrink', icon: 'contract-outline', title: 'shrink it', body: 'do a smaller version. check once, wash briefly, ask just one time.' },
];
const DELAYS = [5, 10, 15, 30];

export default function UrgeFlow({ visible, onClose }) {
  const { data, actions } = useStore();
  const [step, setStep] = useState('what');
  const [compulsion, setCompulsion] = useState(null);
  const [before, setBefore] = useState(null);
  const [plan, setPlan] = useState(null);
  const [delayMin, setDelayMin] = useState(10);
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [ratings, setRatings] = useState([]);
  const [after, setAfter] = useState(null);
  const [promptIdx, setPromptIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const finished = useRef(false);
  const praise = useMemo(() => pick(ENCOURAGEMENTS), [visible]);
  const slipMsg = useMemo(() => pick(SLIP_MESSAGES), [visible]);

  useEffect(() => {
    if (!visible) return;
    setStep('what'); setCompulsion(null); setBefore(null); setPlan(null); setDelayMin(10);
    setStartedAt(null); setRatings([]); setAfter(null); setAdding(false); setCustom(''); setShowHelp(false);
    setPromptIdx(Math.floor(Math.random() * SURF_PROMPTS.length));
    finished.current = false;
  }, [visible]);

  useEffect(() => {
    if (step !== 'surf') return;
    const t = setInterval(() => setNow(Date.now()), 500);
    const p = setInterval(() => setPromptIdx(i => (i + 1) % SURF_PROMPTS.length), 14000);
    return () => { clearInterval(t); clearInterval(p); };
  }, [step]);

  if (!data) return null;
  const list = activeCompulsions(data);
  const elapsed = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const delayLeft = plan === 'delay' ? delayMin * 60 - elapsed : null;
  const delayDone = plan === 'delay' && delayLeft <= 0;
  const name = compulsionName(data, compulsion);

  const startSurf = () => { setStartedAt(Date.now()); setNow(Date.now()); setStep('surf'); };

  // Water when the person taps the button, or if they close the sheet from the last step.
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onClose();
    setTimeout(() => {
      actions.water({ compulsion, action: plan, source: 'urge', urgeBefore: before, urgeAfter: after, seconds: elapsed, extra: ratings.length ? { ratings } : undefined });
      success();
    }, 250);
    track('urge_flow_complete', { action: plan, urge_before: before, urge_after: after, seconds: elapsed });
  };

  const close = () => (step === 'done' ? finish() : onClose());

  const titles = { what: 'what’s the urge?', rate: 'how strong is it?', plan: 'what will you try?', surf: plan === 'delay' ? 'delaying' : plan === 'shrink' ? 'shrinking it' : 'riding the wave', after: 'how’s the urge now?', done: 'you did it', slip: 'that’s okay' };

  return (
    <Sheet visible={visible} onClose={close} title={titles[step]} full={step === 'surf'}>
      {step === 'what' && (<>
        <Txt v="bodySoft">no need to describe the thought. just name what ocd wants you to do.</Txt>
        <ChipWrap>
          {list.map(c => <Chip key={c.id} label={c.name} onPress={() => { setCompulsion(c.id); setStep('rate'); }} />)}
          <Chip label="something else" icon="ellipsis-horizontal" onPress={() => { setCompulsion(GENERIC_ID); setStep('rate'); }} />
        </ChipWrap>
        {adding ? (
          <View style={{ flexDirection: 'row', gap: S.xs }}>
            <Input value={custom} onChangeText={setCustom} placeholder="e.g. re-reading texts" style={{ flex: 1 }} autoFocus
              onSubmitEditing={() => { if (custom.trim()) { const id = actions.addCustom(custom); setCompulsion(id); setStep('rate'); } }} returnKeyType="done" />
            <Button title="add" full={false} disabled={!custom.trim()} onPress={() => { const id = actions.addCustom(custom); setCompulsion(id); setStep('rate'); }} />
          </View>
        ) : <LinkText icon="add" title="add a new one" onPress={() => setAdding(true)} />}
      </>)}

      {step === 'rate' && (<>
        <Pill text={name} tone="muted" icon="pricetag-outline" />
        <Txt v="bodySoft">rate the pull to do it, right now.</Txt>
        <Scale value={before} onChange={setBefore} label="urge strength" lowLabel="barely there" highLabel="overwhelming" />
        <Button title="next" icon="arrow-forward" disabled={before == null} onPress={() => setStep('plan')} />
      </>)}

      {step === 'plan' && (<>
        <Txt v="bodySoft">every option here waters your plant. pick the one that feels hard but doable.</Txt>
        {PLANS.map(p => {
          const on = plan === p.id;
          return (
            <Pressable key={p.id} onPress={() => { tap(); setPlan(p.id); }} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${p.title}. ${p.body}`}
              style={{ flexDirection: 'row', gap: S.sm, padding: S.md, borderRadius: R.lg, borderWidth: 2, borderColor: on ? C.green : C.border, backgroundColor: on ? C.greenTint : C.surface }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: on ? C.green : C.card, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={p.icon} size={21} color={on ? C.white : C.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="h3">{p.title}</Txt>
                <Txt v="small">{p.body}</Txt>
                {on && p.id === 'delay' ? (
                  <ChipWrap style={{ marginTop: S.xs }}>
                    {DELAYS.map(m => <Chip key={m} small label={`${m} min`} selected={delayMin === m} onPress={() => setDelayMin(m)} />)}
                  </ChipWrap>
                ) : null}
              </View>
            </Pressable>
          );
        })}
        <Button title={plan === 'delay' ? `start the ${delayMin}-minute wait` : 'start'} icon="play" disabled={!plan} onPress={startSurf} />
      </>)}

      {step === 'surf' && (
        <View style={{ flex: 1, gap: S.md }}>
          <View style={{ alignItems: 'center', gap: S.sm, paddingTop: S.xs }}>
            <Pill text={name} tone="muted" />
            <View style={{ width: 180, height: 180, borderRadius: 90, borderWidth: 4, borderColor: delayDone ? C.green : C.waterSoft, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: F.display, fontSize: 52, color: delayDone ? C.green : C.water }} accessibilityLabel={plan === 'delay' ? `${fmtClock(Math.max(0, delayLeft))} left` : `${fmtClock(elapsed)} elapsed`}>
                {plan === 'delay' ? fmtClock(Math.max(0, delayLeft)) : fmtClock(elapsed)}
              </Text>
              <Txt v="caption">{plan === 'delay' ? (delayDone ? 'wait complete' : 'left to wait') : 'with the urge'}</Txt>
            </View>
          </View>
          <Card tone="water" style={{ minHeight: 76, justifyContent: 'center' }}>
            {delayDone ? (
              <Txt v="body" style={{ textAlign: 'center' }}>you waited the whole time. you can keep riding it, or finish here.</Txt>
            ) : plan === 'shrink' && elapsed < 8 ? (
              <Txt v="body" style={{ textAlign: 'center' }}>do the smaller version, then come back and sit with whatever’s left.</Txt>
            ) : (
              <Txt v="body" style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">{SURF_PROMPTS[promptIdx]}</Txt>
            )}
          </Card>
          <View>
            <Txt v="label" style={{ marginBottom: 6 }}>urge right now (optional)</Txt>
            <Scale value={ratings.length ? ratings[ratings.length - 1].v : null} onChange={v => setRatings(r => [...r, { t: elapsed, v }])} label="urge right now" lowLabel="gone" highLabel="overwhelming" />
          </View>
          <View style={{ flex: 1 }} />
          <Button title={plan === 'delay' && !delayDone ? 'i’m done waiting' : 'finish'} icon="checkmark" onPress={() => setStep('after')} />
          <Button title="i did the compulsion" variant="ghost" onPress={() => { actions.logSlip(compulsion, before); setStep('slip'); }} />
          <LinkText title="need more support?" icon="heart-outline" color={C.sun} style={{ alignSelf: 'center' }} onPress={() => setShowHelp(s => !s)} />
          {showHelp ? <CrisisCard compact /> : null}
        </View>
      )}

      {step === 'after' && (<>
        <Txt v="bodySoft">no right answer. the urge doesn’t have to be gone for this to count.</Txt>
        <Scale value={after} onChange={setAfter} label="urge strength now" lowLabel="barely there" highLabel="overwhelming" />
        <Button title="save" disabled={after == null} onPress={() => setStep('done')} />
      </>)}

      {step === 'done' && (<>
        <View style={{ alignItems: 'center', gap: S.xs, paddingVertical: S.sm }}>
          <Txt v="h1" style={{ color: C.green, textAlign: 'center' }}>{plan === 'resist' ? praise : plan === 'delay' && elapsed < delayMin * 60 ? 'you held off. every minute of waiting counts.' : PARTIAL_PRAISE[plan]}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.md, marginTop: S.xs }}>
            <Big n={before} label="before" color={C.sun} />
            <Icon name="arrow-forward" size={22} color={C.inkMuted} />
            <Big n={after} label="after" color={C.green} />
          </View>
          <Txt v="small" style={{ textAlign: 'center' }}>you stayed with it for {fmtMinutes(elapsed)}.</Txt>
        </View>
        <Button title={`water ${data.plant.name}`} variant="water" icon="water" size="lg" onPress={finish} />
      </>)}

      {step === 'slip' && (<>
        <Txt v="body">{slipMsg}</Txt>
        <Card tone="green">
          <Txt v="h3">for next time</Txt>
          <Txt v="small">if resisting feels like too much, try delaying for five minutes, or doing a smaller version. those count too.</Txt>
        </Card>
        <Txt v="small">your plant doesn’t lose anything. it’s still there, waiting.</Txt>
        <Button title="close" variant="secondary" onPress={onClose} />
      </>)}
    </Sheet>
  );
}

const Big = ({ n, label, color }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ fontFamily: F.bodyHeavy, fontSize: 40, color }}>{n}</Text>
    <Txt v="caption">{label}</Txt>
  </View>
);
