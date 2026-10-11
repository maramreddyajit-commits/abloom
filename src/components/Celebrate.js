import React, { useEffect, useRef } from 'react';
import { Animated, Image, Modal, Pressable, Platform, View } from 'react-native';
import { C, R, S, shadowStrong } from '../theme';
import { Txt, Button } from './ui';
import { PLANT_IMGS, FLOWER_IMG } from './Plant';
import { STAGE_NAMES } from '../content/copy';

// Shown when the plant reaches a new stage.
export default function Celebrate({ stage, plantName, onClose }) {
  const s = useRef(new Animated.Value(0.6)).current;
  const nd = Platform.OS !== 'web';
  useEffect(() => {
    if (stage == null) return;
    s.setValue(0.6);
    Animated.spring(s, { toValue: 1, friction: 5, tension: 90, useNativeDriver: nd }).start();
  }, [stage]);
  if (stage == null) return null;
  const bloom = stage >= 4;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(63,125,72,0.22)', alignItems: 'center', justifyContent: 'center', padding: S.lg }} accessibilityLabel="close">
        <Animated.View style={[{ backgroundColor: C.bg, borderRadius: R.xl, padding: S.xl, alignItems: 'center', width: '100%', maxWidth: 340, gap: S.sm, transform: [{ scale: s }] }, shadowStrong]}>
          {[[-16, 10, 34, -18], [14, 30, 26, 22], [-6, 150, 22, 8]].map(([l, t, z, r], i) => (
            <Image key={i} source={FLOWER_IMG} style={{ position: 'absolute', left: l < 0 ? undefined : l, right: l < 0 ? -l : undefined, top: t, width: z, height: z, opacity: 0.45, transform: [{ rotate: `${r}deg` }] }} />
          ))}
          <View style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: C.greenTint, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12 }}>
            <Image source={PLANT_IMGS[Math.min(stage, 4)]} style={{ width: 110, height: 120 }} resizeMode="contain" />
          </View>
          <Txt v="h1" style={{ color: C.green, textAlign: 'center' }}>{bloom ? `${plantName} is in full bloom!` : `${plantName} grew!`}</Txt>
          <Txt v="bodySoft" style={{ textAlign: 'center' }}>
            {bloom ? 'every leaf here is a time you chose the harder, braver thing. it can join your forest whenever you’re ready.' : `it’s a ${STAGE_NAMES[stage]} now. that’s your practice, showing.`}
          </Txt>
          <Button title="lovely" onPress={onClose} style={{ marginTop: S.xs }} />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
