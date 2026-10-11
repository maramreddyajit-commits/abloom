import React from 'react';
import { Linking, Platform, View } from 'react-native';
import { C, S } from '../theme';
import { Card, Icon, Row, Txt } from './ui';
import { CRISIS_RESOURCES, EMERGENCY_LINE } from '../content/crisis';

const open = url => {
  // sms:/tel: can't open from desktop web; fall back to the international directory.
  if (Platform.OS === 'web' && !/^https?:/.test(url)) return Linking.openURL('https://findahelpline.com/').catch(() => {});
  Linking.openURL(url).catch(() => {});
};

export default function CrisisCard({ intro = true, compact = false }) {
  return (
    <Card tone="sun" style={{ gap: S.xs }}>
      {intro ? (
        <View style={{ flexDirection: 'row', gap: S.xs, alignItems: 'flex-start' }}>
          <Icon name="heart" size={20} color={C.sun} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Txt v="h3">if you’re thinking about ending your life or hurting yourself</Txt>
            <Txt v="small">you deserve support from a real person right now. these are free and confidential.</Txt>
          </View>
        </View>
      ) : null}
      {(compact ? CRISIS_RESOURCES.filter(r => r.id !== 'us-988-text') : CRISIS_RESOURCES).map(r => (
        <Row key={r.id} icon={r.icon} title={r.label} subtitle={`${r.detail} · ${r.region}`} onPress={() => open(r.url)}
          right={<Icon name="open-outline" size={18} color={C.inkMuted} />} />
      ))}
      <Txt v="caption" style={{ color: C.inkSoft }}>{EMERGENCY_LINE}</Txt>
    </Card>
  );
}
