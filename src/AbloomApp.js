import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { C, F, MAX_WIDTH, T } from './theme';
import { Icon } from './components/ui';
import { StoreProvider, useStore } from './state/store';
import { ToastProvider } from './components/Toast';
import { FlowsProvider } from './flows/FlowsProvider';
import { FLOWER_IMG } from './components/Plant';
import { tap } from './lib/haptics';
import Onboarding from './screens/Onboarding';
import Grow from './screens/Grow';
import Practice from './screens/Practice';
import Journey from './screens/Journey';
import Talk from './screens/Talk';
import You from './screens/You';

const TABS = [
  { id: 'grow', label: 'grow', icon: 'leaf', Screen: Grow },
  { id: 'practice', label: 'practice', icon: 'trending-up', Screen: Practice },
  { id: 'journey', label: 'journey', icon: 'calendar', Screen: Journey },
  { id: 'talk', label: 'talk', icon: 'chatbubbles', Screen: Talk },
  { id: 'you', label: 'you', icon: 'person-circle', Screen: You },
];

export default function AbloomApp() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center' }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, width: '100%', maxWidth: MAX_WIDTH }}>
        <StoreProvider>
          <ToastProvider>
            <Shell />
          </ToastProvider>
        </StoreProvider>
      </View>
    </View>
  );
}

function Shell() {
  const { ready, data } = useStore();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Image source={FLOWER_IMG} style={{ width: 56, height: 56, opacity: 0.6 }} />
        <Text style={[T.h2, { color: C.green }]}>growing…</Text>
      </View>
    );
  }
  if (!data.onboarded) return <Onboarding />;
  return (
    <FlowsProvider>
      <Tabs />
    </FlowsProvider>
  );
}

function Tabs() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('grow');
  const Active = TABS.find(t => t.id === tab).Screen;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}><Active /></View>
      <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: C.bg, borderTopWidth: 1.5, borderTopColor: C.cardAlt, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 6 }}>
        {TABS.map(t => {
          const on = t.id === tab;
          return (
            <Pressable key={t.id} onPress={() => { if (!on) tap(); setTab(t.id); }} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={t.label}
              style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4, minHeight: 48 }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999, backgroundColor: on ? C.greenSoft : 'transparent' }}>
                <Icon name={on ? t.icon : `${t.icon}-outline`} size={22} color={on ? C.greenDark : C.inkMuted} />
              </View>
              <Text style={{ fontFamily: on ? F.bodyHeavy : F.bodySemi, fontSize: 12, color: on ? C.greenDark : C.inkMuted }} maxFontSizeMultiplier={1.3}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
