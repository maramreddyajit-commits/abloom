// For logging an urge you already handled, in one tap.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { S } from '../theme';
import { Sheet, Txt, Chip, ChipWrap, LinkText } from '../components/ui';
import { useStore } from '../state/store';
import { activeCompulsions, compulsionName } from '../lib/model';
import { GENERIC_ID } from '../content/compulsions';
import { useToast } from '../components/Toast';
import { ENCOURAGEMENTS, PARTIAL_PRAISE } from '../content/copy';
import { thud } from '../lib/haptics';

const HOW = [
  { id: 'resist', label: 'resisted it' },
  { id: 'delay', label: 'delayed it' },
  { id: 'shrink', label: 'shrank it' },
];
const pick = a => a[Math.floor(Math.random() * a.length)];

export default function QuickLog({ visible, onClose, onEditList }) {
  const { data, actions } = useStore();
  const toast = useToast();
  const [how, setHow] = useState('resist');
  useEffect(() => { if (visible) setHow('resist'); }, [visible]);
  if (!data) return null;
  const list = activeCompulsions(data);

  const log = id => {
    onClose();
    setTimeout(() => {
      thud();
      const entry = actions.water({ compulsion: id, action: how, source: 'quick' });
      toast.show({
        text: `${how === 'resist' ? pick(ENCOURAGEMENTS) : PARTIAL_PRAISE[how]} (${compulsionName(data, id).toLowerCase()})`,
        actionLabel: 'undo', onAction: () => actions.undo(entry.id), icon: 'water',
      });
    }, 250);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="log one you handled">
      <ChipWrap>{HOW.map(h => <Chip key={h.id} small tone="water" label={h.label} selected={how === h.id} onPress={() => setHow(h.id)} />)}</ChipWrap>
      <Txt v="bodySoft">which one? tap to water.</Txt>
      <View style={{ gap: S.xs }}>
        <ChipWrap>
          {list.map(c => <Chip key={c.id} label={c.name} onPress={() => log(c.id)} icon="water-outline" />)}
          <Chip label="something else" icon="ellipsis-horizontal" onPress={() => log(GENERIC_ID)} />
        </ChipWrap>
      </View>
      <LinkText title="edit my list" icon="create-outline" onPress={() => { onClose(); setTimeout(onEditList, 300); }} />
    </Sheet>
  );
}
