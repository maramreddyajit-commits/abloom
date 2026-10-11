// First run, built for people arriving from an ad: understand it in 30 seconds,
// personalise it in under a minute, no account.
import React, { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, S, R } from '../theme';
import { Txt, Button, Input, Chip, ChipWrap, Card, Icon, IconButton, ToggleRow, Pill } from '../components/ui';
import CompulsionPicker from '../components/CompulsionPicker';
import { PLANT_IMGS, FLOWER_IMG } from '../components/Plant';
import { useStore } from '../state/store';
import { uid } from '../lib/model';
import { analyticsAvailable } from '../lib/analytics';
import { DISCLAIMER, PLANT_NAME_IDEAS } from '../content/copy';

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { actions } = useStore();
  const [page, setPage] = useState(0);
  const [active, setActive] = useState([]);
  const [custom, setCustom] = useState([]);
  const [name, setName] = useState('');
  const [analytics, setAnalytics] = useState(false);
  const plantName = name.trim() || 'sprout';

  const toggle = id => setActive(a => (a.includes(id) ? a.filter(x => x !== id) : [...a, id]));
  const addCustom = n => { const id = uid('c'); setCustom(c => [...c, { id, name: n, cat: 'Custom' }]); setActive(a => [...a, id]); };
  const removeCustom = id => { setCustom(c => c.filter(x => x.id !== id)); setActive(a => a.filter(x => x !== id)); };
  const finish = () => actions.completeOnboarding({ active, custom, plantName, analytics });

  const Footer = ({ children }) => (
    <View style={{ paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: Math.max(insets.bottom, S.md), gap: S.xs, backgroundColor: C.bg, borderTopWidth: page === 1 ? 1.5 : 0, borderTopColor: C.cardAlt }}>{children}</View>
  );

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      {page > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.xs, height: 48 }}>
          <IconButton name="chevron-back" label="back" onPress={() => setPage(page - 1)} />
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {[1, 2, 3].map(i => <View key={i} style={{ width: i === page ? 26 : 8, height: 8, borderRadius: 4, backgroundColor: i <= page ? C.green : C.cardAlt }} />)}
          </View>
          <View style={{ width: 44 }} />
        </View>
      ) : null}

      {page === 0 && (<>
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: S.lg, gap: S.md }}>
          <View style={{ width: 230, height: 230, borderRadius: 115, backgroundColor: C.greenTint, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 18 }}>
            <Image source={PLANT_IMGS[4]} style={{ width: 150, height: 204 }} resizeMode="contain" accessibilityLabel="a blooming plant" />
            <Image source={FLOWER_IMG} style={{ position: 'absolute', width: 40, height: 40, top: 18, right: 14, opacity: 0.5, transform: [{ rotate: '18deg' }] }} />
            <Image source={FLOWER_IMG} style={{ position: 'absolute', width: 28, height: 28, bottom: 40, left: 10, opacity: 0.4, transform: [{ rotate: '-20deg' }] }} />
          </View>
          <Txt v="hero" style={{ fontSize: 56, lineHeight: 62, letterSpacing: 2 }} accessibilityRole="header">abloom</Txt>
          <Txt v="h2" style={{ textAlign: 'center', color: C.ink, maxWidth: 330 }}>resist a compulsion. water your plant. watch it grow.</Txt>
          <Txt v="bodySoft" style={{ textAlign: 'center', maxWidth: 340 }}>a gentle companion for people living with ocd, built on the ideas behind exposure therapy.</Txt>
          <ChipWrap center style={{ marginTop: S.xs }}>
            <Pill text="free" icon="leaf-outline" />
            <Pill text="private, stays on your phone" icon="lock-closed-outline" />
            <Pill text="no account" icon="person-outline" />
          </ChipWrap>
        </ScrollView>
        <Footer>
          <Button title="let’s begin" size="lg" iconRight="arrow-forward" onPress={() => setPage(1)} />
        </Footer>
      </>)}

      {page === 1 && (<>
        <ScrollView contentContainerStyle={{ padding: S.lg, paddingTop: S.xs, gap: S.md }} keyboardShouldPersistTaps="handled">
          <Txt v="h1" accessibilityRole="header">what does ocd push you to do?</Txt>
          <Txt v="bodySoft">tap any that fit. these are what you’ll practise resisting. you can change them any time.</Txt>
          <CompulsionPicker selected={active} onToggle={toggle} custom={custom} onAddCustom={addCustom} onRemoveCustom={removeCustom} />
        </ScrollView>
        <Footer>
          <Button title={active.length ? `next · ${active.length} picked` : 'next'} iconRight="arrow-forward" disabled={!active.length} onPress={() => setPage(2)} />
          <Button title="i’m not sure yet" variant="ghost" size="sm" onPress={() => setPage(2)} />
        </Footer>
      </>)}

      {page === 2 && (<>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: S.lg, gap: S.md, alignItems: 'center', justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ width: 170, height: 170, borderRadius: 85, backgroundColor: C.greenTint, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 20 }}>
            <Image source={PLANT_IMGS[0]} style={{ width: 110, height: 115 }} resizeMode="contain" accessibilityLabel="a seedling" />
          </View>
          <Txt v="h1" style={{ textAlign: 'center' }} accessibilityRole="header">meet your seedling</Txt>
          <Txt v="bodySoft" style={{ textAlign: 'center' }}>what would you like to call it?</Txt>
          <Input value={name} onChangeText={setName} placeholder="sprout" maxLength={20} style={{ alignSelf: 'stretch', textAlign: 'center', fontSize: 20 }}
            returnKeyType="done" onSubmitEditing={() => setPage(3)} accessibilityLabel="plant name" />
          <ChipWrap center>{PLANT_NAME_IDEAS.map(n => <Chip key={n} small label={n} selected={plantName === n} onPress={() => setName(n)} />)}</ChipWrap>
        </ScrollView>
        <Footer>
          <Button title="next" iconRight="arrow-forward" onPress={() => setPage(3)} />
        </Footer>
      </>)}

      {page === 3 && (<>
        <ScrollView contentContainerStyle={{ padding: S.lg, paddingTop: S.xs, gap: S.md }}>
          <Txt v="h1" accessibilityRole="header">how it works</Txt>
          <Step icon="flash" color={C.water} title="when an urge hits, open abloom" body="tap “i have an urge”. name it, then ride it out with a timer." />
          <Step icon="git-branch-outline" color={C.green} title="resist it, delay it, or shrink it" body={`all three water ${plantName}. partial wins count. this is practice, not a test.`} />
          <Step icon="leaf" color={C.leaf} title={`${plantName} grows on days you water`} body="miss a day and it just waits for you. it never wilts, and there are no streaks to lose." />
          <Step icon="trending-up" color={C.sun} title="build up, step by step" body="when you’re ready, the practice tab helps you face fears on purpose, from easiest to hardest." />
          <Card style={{ flexDirection: 'row', gap: S.xs }}>
            <Icon name="information-circle-outline" size={20} color={C.inkSoft} />
            <Txt v="small" style={{ flex: 1 }}>{DISCLAIMER}</Txt>
          </Card>
          {analyticsAvailable() ? (
            <Card tone="surface" style={{ paddingVertical: S.xs }}>
              <ToggleRow title="help improve abloom" subtitle="share anonymous usage counts, like “watered a plant”. never what you log or type. change it any time." value={analytics} onChange={setAnalytics} />
            </Card>
          ) : null}
        </ScrollView>
        <Footer>
          <Button title={`plant ${plantName}`} size="lg" icon="leaf" onPress={finish} />
        </Footer>
      </>)}
    </View>
  );
}

const Step = ({ icon, color, title, body }) => (
  <View style={{ flexDirection: 'row', gap: S.sm, alignItems: 'flex-start' }}>
    <View style={{ width: 44, height: 44, borderRadius: R.md, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={22} color={C.white} />
    </View>
    <View style={{ flex: 1 }}>
      <Txt v="h3">{title}</Txt>
      <Txt v="small">{body}</Txt>
    </View>
  </View>
);
