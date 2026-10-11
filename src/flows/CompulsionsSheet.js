import React from 'react';
import { Sheet, Txt, Button } from '../components/ui';
import CompulsionPicker from '../components/CompulsionPicker';
import { useStore } from '../state/store';

export default function CompulsionsSheet({ visible, onClose }) {
  const { data, actions } = useStore();
  if (!data) return null;
  return (
    <Sheet visible={visible} onClose={onClose} title="my compulsions" full>
      <Txt v="bodySoft">tap to add or remove. these show up when you log an urge.</Txt>
      <CompulsionPicker selected={data.compulsions.active} onToggle={actions.toggleCompulsion} custom={data.compulsions.custom}
        onAddCustom={n => actions.addCustom(n)} onRemoveCustom={actions.removeCustom} />
      <Button title="done" onPress={onClose} />
    </Sheet>
  );
}
