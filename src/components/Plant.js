import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, Platform, View } from 'react-native';
import { C, F } from '../theme';
import { useReducedMotion } from './ui';

export const PLANT_IMGS = [
  require('../../assets/images/stage0.png'),
  require('../../assets/images/stage1.png'),
  require('../../assets/images/stage2.png'),
  require('../../assets/images/stage3.png'),
  require('../../assets/images/stage4.png'),
];
export const FLOWER_IMG = require('../../assets/images/flower.png');

const ASPECT = [264 / 276, 108 / 128, 193 / 363, 415 / 613, 469 / 638];
const HEIGHT_RATIO = [0.46, 0.56, 0.7, 0.82, 0.9]; // of the plant box, so the tree never clips
const nd = Platform.OS !== 'web';

// `pulseKey` changes every time the plant is watered, which plays the watering animation.
export default function Plant({ stage = 0, pulseKey, scale = 1, boxHeight = 280 }) {
  const reduced = useReducedMotion();
  const sway = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const plus = useRef(new Animated.Value(0)).current;
  const drops = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    x: 18 + ((i * 53) % 64), w: 5 + (i % 3) * 2, h: 9 + (i % 4) * 2, delay: i * 55, dur: 700 + (i % 5) * 90,
    y: new Animated.Value(0), o: new Animated.Value(0),
  })), []);

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(sway, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: nd }),
      Animated.timing(sway, { toValue: -1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: nd }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduced]);

  useEffect(() => {
    if (!pulseKey) return;
    if (!reduced) {
      drops.forEach(d => {
        d.y.setValue(0); d.o.setValue(0.9);
        Animated.parallel([
          Animated.timing(d.y, { toValue: 1, duration: d.dur, delay: d.delay, easing: Easing.in(Easing.quad), useNativeDriver: nd }),
          Animated.timing(d.o, { toValue: 0, duration: d.dur, delay: d.delay + 150, useNativeDriver: nd }),
        ]).start();
      });
    }
    pop.setValue(1);
    plus.setValue(0);
    Animated.sequence([
      Animated.delay(reduced ? 0 : 500),
      Animated.spring(pop, { toValue: 1.09, friction: 4, tension: 120, useNativeDriver: nd }),
      Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: nd }),
    ]).start();
    Animated.timing(plus, { toValue: 1, duration: 1400, delay: reduced ? 0 : 450, useNativeDriver: nd }).start();
  }, [pulseKey]);

  const s = Math.min(stage, 4);
  const h = (boxHeight - 14) * HEIGHT_RATIO[s] * scale;
  const w = h * ASPECT[s];
  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-1.6deg', '1.6deg'] });

  return (
    <View style={{ height: boxHeight * scale, width: '100%', alignItems: 'center', justifyContent: 'flex-end' }} accessible accessibilityRole="image" accessibilityLabel={`your plant, stage ${s + 1} of 5`}>
      {/* soft sun behind the plant */}
      <View style={{ position: 'absolute', bottom: 14 * scale, width: 210 * scale, height: 210 * scale, borderRadius: 105 * scale, backgroundColor: C.greenTint }} />
      <View style={{ position: 'absolute', bottom: 8 * scale, width: 120 * scale, height: 10 * scale, borderRadius: 100, backgroundColor: 'rgba(98,80,63,0.07)' }} />

      <Animated.View style={{ transform: [{ scale: pop }, { rotate }], transformOrigin: 'bottom', marginBottom: 10 * scale }}>
        <Image source={PLANT_IMGS[s]} style={{ width: w, height: h }} resizeMode="contain" />
      </Animated.View>

      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {drops.map((d, i) => (
          <Animated.View key={i} style={{
            position: 'absolute', top: 6, left: `${d.x}%`, width: d.w, height: d.h, borderRadius: d.w,
            backgroundColor: 'rgba(47,120,163,0.55)', opacity: d.o,
            transform: [{ translateY: d.y.interpolate({ inputRange: [0, 1], outputRange: [0, boxHeight * scale * 0.72] }) }],
          }} />
        ))}
        <Animated.Text style={{
          position: 'absolute', top: '22%', alignSelf: 'center', fontFamily: F.display, fontSize: 34, color: C.water,
          opacity: plus.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ translateY: plus.interpolate({ inputRange: [0, 1], outputRange: [10, -50] }) }],
        }}>+1 drop</Animated.Text>
      </View>
    </View>
  );
}
