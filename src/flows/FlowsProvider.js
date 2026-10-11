// Every sheet in the app lives here so any screen can open any flow.
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../state/store';
import UrgeFlow from './UrgeFlow';
import ExposureFlow from './ExposureFlow';
import SupportSheet from './SupportSheet';
import LessonSheet from './LessonSheet';
import ReminderSheet from './ReminderSheet';
import QuickLog from './QuickLog';
import CompulsionsSheet from './CompulsionsSheet';
import Celebrate from '../components/Celebrate';
import { remindersSupported } from '../lib/notifications';

const Ctx = createContext(null);

export function FlowsProvider({ children }) {
  const { data, lastWater } = useStore();
  const [open, setOpen] = useState(null); // { kind, ...params }
  const [celebrate, setCelebrate] = useState(null);
  const pendingReminder = useRef(false);

  const api = useMemo(() => ({
    openUrge: () => setOpen({ kind: 'urge' }),
    openQuickLog: () => setOpen({ kind: 'quick' }),
    openExposure: rungId => setOpen({ kind: 'exposure', rungId }),
    openSupport: (mode = 'menu') => setOpen({ kind: 'support', mode }),
    openLesson: lessonId => setOpen({ kind: 'lesson', lessonId }),
    openCompulsions: () => setOpen({ kind: 'compulsions' }),
    openReminder: () => setOpen({ kind: 'reminder' }),
    close: () => setOpen(null),
  }), []);

  // After a watering: celebrate growth, and offer a reminder after the very first one.
  useEffect(() => {
    if (!lastWater || !data) return;
    const t = [];
    if (lastWater.grewTo != null) t.push(setTimeout(() => setCelebrate(lastWater.grewTo), 1500));
    if (lastWater.firstEver && remindersSupported && !data.settings.reminderAsked) pendingReminder.current = true;
    if (pendingReminder.current && lastWater.grewTo == null) {
      pendingReminder.current = false;
      t.push(setTimeout(() => setOpen(o => o || { kind: 'reminder' }), 2600));
    }
    return () => t.forEach(clearTimeout);
  }, [lastWater?.at]);

  const closeCelebrate = () => {
    setCelebrate(null);
    if (pendingReminder.current) { pendingReminder.current = false; setTimeout(() => setOpen(o => o || { kind: 'reminder' }), 400); }
  };

  const k = open?.kind;
  return (
    <Ctx.Provider value={api}>
      {children}
      <UrgeFlow visible={k === 'urge'} onClose={api.close} />
      <QuickLog visible={k === 'quick'} onClose={api.close} onEditList={api.openCompulsions} />
      <ExposureFlow visible={k === 'exposure'} rungId={open?.rungId} onClose={api.close} />
      <SupportSheet visible={k === 'support'} initialMode={open?.mode || 'menu'} onClose={api.close} onRideUrge={api.openUrge} />
      <LessonSheet visible={k === 'lesson'} lessonId={open?.lessonId} onClose={api.close} />
      <ReminderSheet visible={k === 'reminder'} onClose={api.close} />
      <CompulsionsSheet visible={k === 'compulsions'} onClose={api.close} />
      <Celebrate stage={celebrate} plantName={data?.plant.name} onClose={closeCelebrate} />
    </Ctx.Provider>
  );
}

export const useFlows = () => useContext(Ctx);
