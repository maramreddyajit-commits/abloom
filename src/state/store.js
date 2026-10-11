import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadData, saveData, clearAll } from '../lib/storage';
import { createData, uid, growth, stageFor, plantWaterDays } from '../lib/model';
import { todayKey } from '../lib/dates';
import { initAnalytics, setAnalyticsEnabled, track } from '../lib/analytics';
import { CUSTOM_CAT } from '../content/compulsions';

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [data, setData] = useState(null);
  // Transient UI event so any screen can trigger the watering animation on the plant.
  const [lastWater, setLastWater] = useState(null);
  const saveTimer = useRef(null);
  const dataRef = useRef(null);
  dataRef.current = data;

  useEffect(() => {
    let alive = true;
    loadData().then(async d => {
      if (!alive) return;
      await initAnalytics(d.settings.analytics);
      setData(d);
      if (d.onboarded) {
        const days = Math.floor((Date.now() - d.createdAt) / 864e5);
        track('app_open', { days_since_install: days });
      }
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!data) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveData(data), 250);
    return () => clearTimeout(saveTimer.current);
  }, [data]);

  const update = useCallback(fn => setData(prev => (prev ? fn(prev) : prev)), []);

  const actions = useMemo(() => ({
    update,

    completeOnboarding({ active, custom, plantName, analytics }) {
      update(d => ({
        ...d,
        onboarded: true,
        createdAt: d.log.length ? d.createdAt : Date.now(),
        plant: { name: plantName || 'sprout', startedAt: d.log.length ? d.plant.startedAt : Date.now() },
        compulsions: { active, custom },
        settings: { ...d.settings, analytics: !!analytics },
      }));
      setAnalyticsEnabled(!!analytics).then(() => track('onboarding_complete', { compulsions_count: active.length }));
    },

    // Logs a watering and returns what happened to the plant so the UI can celebrate.
    water({ compulsion, action = 'resist', source = 'quick', urgeBefore, urgeAfter, seconds, extra }) {
      const entry = {
        id: uid('log'), ts: Date.now(), date: todayKey(), compulsion, action, source,
        ...(typeof urgeBefore === 'number' ? { urgeBefore } : {}),
        ...(typeof urgeAfter === 'number' ? { urgeAfter } : {}),
        ...(typeof seconds === 'number' ? { seconds } : {}),
        ...(extra || {}),
      };
      const prev = dataRef.current;
      const before = growth(prev);
      const after = growth({ ...prev, log: [...prev.log, entry] });
      const result = {
        entry,
        grewTo: after.stage > before.stage ? after.stage : null,
        bloomed: after.bloomed && !before.bloomed,
        firstEver: !prev.log.some(l => l.action !== 'slip'),
      };
      dataRef.current = { ...prev, log: [...prev.log, entry] };
      setData(p => ({ ...p, log: [...p.log, entry] }));
      setLastWater({ ...result, at: Date.now() });
      track('water', { action, source, water_days: after.days });
      if (result.bloomed) track('plant_bloomed');
      return entry;
    },

    undo(entryId) {
      update(d => ({ ...d, log: d.log.filter(l => l.id !== entryId), exposures: d.exposures.filter(e => e.logId !== entryId) }));
    },

    logSlip(compulsion, urgeBefore) {
      update(d => ({ ...d, log: [...d.log, { id: uid('log'), ts: Date.now(), date: todayKey(), compulsion, action: 'slip', source: 'urge', ...(typeof urgeBefore === 'number' ? { urgeBefore } : {}) }] }));
      track('urge_flow_slip');
    },

    toggleCompulsion(id) {
      update(d => {
        const a = d.compulsions.active;
        return { ...d, compulsions: { ...d.compulsions, active: a.includes(id) ? a.filter(x => x !== id) : [...a, id] } };
      });
    },

    addCustom(name) {
      const id = uid('c');
      update(d => ({ ...d, compulsions: { custom: [...d.compulsions.custom, { id, name: name.trim(), cat: CUSTOM_CAT }], active: [...d.compulsions.active, id] } }));
      return id;
    },

    removeCustom(id) {
      update(d => ({ ...d, compulsions: { custom: d.compulsions.custom.filter(c => c.id !== id), active: d.compulsions.active.filter(x => x !== id) } }));
    },

    addRung(text, suds) {
      update(d => ({ ...d, ladder: [...d.ladder, { id: uid('rung'), text: text.trim(), suds, createdAt: Date.now(), practiced: 0, mastered: false }] }));
      track('ladder_rung_added');
    },
    updateRung(id, patch) { update(d => ({ ...d, ladder: d.ladder.map(r => (r.id === id ? { ...r, ...patch } : r)) })); },
    removeRung(id) { update(d => ({ ...d, ladder: d.ladder.filter(r => r.id !== id) })); },

    saveExposure(exp) {
      const entry = actions.water({ compulsion: exp.compulsion || null, action: 'exposure', source: 'exposure', seconds: exp.seconds });
      update(d => ({
        ...d,
        exposures: [...d.exposures, { ...exp, id: uid('exp'), logId: entry.id, ts: Date.now(), date: todayKey() }],
        ladder: d.ladder.map(r => (r.id === exp.rungId ? { ...r, practiced: (r.practiced || 0) + 1, lastTs: Date.now() } : r)),
      }));
      track('exposure_complete', { suds_before: exp.sudsBefore, suds_after: exp.sudsAfter, seconds: exp.seconds });
      return entry;
    },

    plantNewSeed(name) {
      update(d => ({
        ...d,
        forest: [...d.forest, { id: uid('tree'), name: d.plant.name, days: plantWaterDays(d), completedAt: Date.now() }],
        plant: { name: (name || d.plant.name).trim(), startedAt: Date.now() },
      }));
    },

    renamePlant(name) { update(d => ({ ...d, plant: { ...d.plant, name: name.trim() || d.plant.name } })); },

    setSetting(key, value) {
      update(d => ({ ...d, settings: { ...d.settings, [key]: value } }));
      if (key === 'analytics') setAnalyticsEnabled(value);
    },

    markLesson(id) {
      update(d => (d.lessons.read.includes(id) ? d : { ...d, lessons: { read: [...d.lessons.read, id] } }));
      track('lesson_read', { lesson: id });
    },

    replaceData(next) { setData(next); },

    async resetAll() {
      await clearAll();
      setData(createData());
    },
  }), [update]);

  const value = useMemo(() => ({ data, ready: !!data, actions, lastWater }), [data, actions, lastWater]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);
export { stageFor };
