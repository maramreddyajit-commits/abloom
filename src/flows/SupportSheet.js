// "i'm struggling". Riding the urge comes first. Breathing and grounding are offered for settling
// when you're NOT doing an exposure, because using them mid-exposure can turn into a safety ritual.
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { C, S } from '../theme';
import { Sheet, Txt, Button, Card, Row, Icon, LinkText } from '../components/ui';
import Breathing from '../components/Breathing';
import CrisisCard from '../components/CrisisCard';
import { STRUGGLE_MESSAGES, GROUNDING_STEPS } from '../content/copy';
import { track } from '../lib/analytics';

const pick = a => a[Math.floor(Math.random() * a.length)];

export default function SupportSheet({ visible, onClose, onRideUrge, initialMode = 'menu' }) {
  const [mode, setMode] = useState('menu');
  const [g, setG] = useState(0);
  const msg = useMemo(() => pick(STRUGGLE_MESSAGES), [visible]);

  useEffect(() => {
    if (visible) { setMode(initialMode); setG(0); track('struggle_open'); }
  }, [visible, initialMode]);

  const titles = { menu: 'hey. you’re here.', breathe: 'breathe with me', ground: 'ground yourself', help: 'get help now' };

  return (
    <Sheet visible={visible} onClose={onClose} title={titles[mode]}>
      {mode !== 'menu' ? <LinkText title="back" icon="chevron-back" onPress={() => setMode('menu')} color={C.inkSoft} style={{ marginTop: -8 }} /> : null}

      {mode === 'menu' && (<>
        <Txt v="body">{msg}</Txt>
        <Card tone="water" onPress={() => { onClose(); setTimeout(onRideUrge, 300); }} accessibilityLabel="ride the urge"
          style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.water, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="water" size={24} color={C.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt v="h3">ride the urge</Txt>
            <Txt v="small">name it, pick resist, delay or shrink, and surf it out. waters your plant.</Txt>
          </View>
          <Icon name="chevron-forward" size={20} color={C.waterDark} />
        </Card>

        <View style={{ gap: 2 }}>
          <Txt v="label">to settle yourself</Txt>
          <Txt v="caption">best used outside an exposure. during one, try letting the feeling be.</Txt>
          <Row icon="leaf-outline" title="breathe with me" subtitle="slow paced breathing" onPress={() => setMode('breathe')} />
          <Row icon="earth-outline" title="ground yourself" subtitle="5-4-3-2-1 senses" onPress={() => setMode('ground')} />
        </View>

        <Row icon="heart-outline" title="get help now" subtitle="crisis lines, free and confidential" onPress={() => setMode('help')} />
      </>)}

      {mode === 'breathe' && (<>
        <Txt v="bodySoft" style={{ textAlign: 'center' }}>in through your nose, out slowly through your mouth.</Txt>
        <Breathing />
        <Button title="i’m done" variant="secondary" onPress={onClose} />
      </>)}

      {mode === 'ground' && (<>
        <View style={{ alignItems: 'center', gap: S.sm, paddingVertical: S.md }}>
          <Txt v="hero">{GROUNDING_STEPS[g].n}</Txt>
          <Txt v="h2" style={{ textAlign: 'center' }}>{GROUNDING_STEPS[g].text}</Txt>
          <Txt v="small">say them out loud or in your head. no rush.</Txt>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: S.xs }}>
            {GROUNDING_STEPS.map((_, i) => <View key={i} style={{ width: i === g ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i <= g ? C.green : C.cardAlt }} />)}
          </View>
        </View>
        {g < GROUNDING_STEPS.length - 1
          ? <Button title="next" icon="arrow-forward" onPress={() => setG(g + 1)} />
          : <Button title="done" icon="checkmark" onPress={onClose} />}
      </>)}

      {mode === 'help' && <CrisisCard />}
    </Sheet>
  );
}
