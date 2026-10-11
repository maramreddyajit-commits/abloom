import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { C, S } from '../theme';
import { Chip, ChipWrap, Input, Txt, Button, Icon } from './ui';
import { CATEGORIES, PRESETS } from '../content/compulsions';

// Browse-by-category picker with search and "add your own". Tapping toggles.
export default function CompulsionPicker({ selected, onToggle, custom = [], onAddCustom, onRemoveCustom }) {
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState('');
  const query = q.trim().toLowerCase();
  const matches = useMemo(() => (query ? [...custom, ...PRESETS].filter(c => c.name.toLowerCase().includes(query)) : null), [query, custom]);

  const chip = c => (
    <Chip key={c.id} label={c.name} selected={selected.includes(c.id)} onPress={() => onToggle(c.id)}
      onRemove={c.cat === 'Custom' && onRemoveCustom ? () => onRemoveCustom(c.id) : undefined} />
  );

  return (
    <View style={{ gap: S.md }}>
      <View>
        <Input value={q} onChangeText={setQ} placeholder="search, e.g. checking, washing, asking" returnKeyType="search"
          style={{ paddingLeft: 42, borderRadius: 999 }} accessibilityLabel="search compulsions" />
        <Icon name="search" size={19} color={C.inkMuted} style={{ position: 'absolute', left: 15, top: 14 }} />
      </View>

      {matches ? (
        <View style={{ gap: S.xs }}>
          {matches.length ? <ChipWrap>{matches.map(chip)}</ChipWrap> : <Txt v="small">nothing matches “{q.trim()}”.</Txt>}
          <Button title={`add “${q.trim()}” as my own`} variant="outline" icon="add" size="sm" full={false}
            onPress={() => { onAddCustom(q.trim()); setQ(''); }} />
        </View>
      ) : (<>
        {custom.length ? (
          <View style={{ gap: S.xs }}>
            <Txt v="label">your own</Txt>
            <ChipWrap>{custom.map(chip)}</ChipWrap>
          </View>
        ) : null}
        {CATEGORIES.map(cat => (
          <View key={cat.id} style={{ gap: S.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name={cat.icon} size={16} color={C.green} />
              <Txt v="label">{cat.label}</Txt>
            </View>
            <ChipWrap>{PRESETS.filter(p => p.cat === cat.id).map(chip)}</ChipWrap>
          </View>
        ))}
        <View style={{ gap: S.xs }}>
          <Txt v="label">something not listed?</Txt>
          <View style={{ flexDirection: 'row', gap: S.xs }}>
            <Input value={draft} onChangeText={setDraft} placeholder="describe it in your words" style={{ flex: 1 }}
              onSubmitEditing={() => { if (draft.trim()) { onAddCustom(draft.trim()); setDraft(''); } }} returnKeyType="done" />
            <Button title="add" full={false} disabled={!draft.trim()} onPress={() => { onAddCustom(draft.trim()); setDraft(''); }} />
          </View>
        </View>
      </>)}
    </View>
  );
}
