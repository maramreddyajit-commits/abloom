import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import { C, F } from '../theme';
import { Txt, useReducedMotion } from './ui';

const SEQ = [
  { p: 'in', label: 'breathe in', d: 4, to: 1 },
  { p: 'hold', label: 'hold', d: 4, to: 1 },
  { p: 'out', label: 'breathe out', d: 6, to: 0 },
  { p: 'rest', label: 'rest', d: 2, to: 0 },
];

export default function Breathing() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [secs, setSecs] = useState(SEQ[0].d);
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const st = SEQ[i % SEQ.length];
    setSecs(st.d);
    Animated.timing(v, { toValue: st.to, duration: reduced ? 0 : st.d * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }).start();
    const tick = setInterval(() => setSecs(s => Math.max(1, s - 1)), 1000);
    const next = setTimeout(() => setI(n => n + 1), st.d * 1000);
    return () => { clearInterval(tick); clearTimeout(next); };
  }, [i]);

  const st = SEQ[i % SEQ.length];
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] });
  return (
    <View style={{ alignItems: 'center', gap: 18, paddingVertical: 8 }}>
      <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: C.greenTint, transform: [{ scale }] }} />
        <Animated.View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: C.greenSoft, borderWidth: 3, borderColor: C.green, alignItems: 'center', justifyContent: 'center', transform: [{ scale }] }}>
          <Animated.Text style={{ fontFamily: F.display, fontSize: 34, color: C.greenDark }}>{secs}</Animated.Text>
        </Animated.View>
      </View>
      <Txt v="h2" style={{ color: C.green }} accessibilityLiveRegion="polite">{st.label}</Txt>
    </View>
  );
}
