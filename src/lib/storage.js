import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrate, createData } from './model';

const KEY = 'abloom-data';
const V1_ONBOARDED_KEY = 'abloom-onboarded';
const BACKUP_KEY = 'abloom-data-previous'; // last good copy, in case a write is interrupted

export async function loadData() {
  try {
    const [raw, ob] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(V1_ONBOARDED_KEY)]);
    if (!raw) return createData();
    return migrate(JSON.parse(raw), { onboardedFlag: ob === 'true' });
  } catch (e) {
    try {
      const prev = await AsyncStorage.getItem(BACKUP_KEY);
      if (prev) return migrate(JSON.parse(prev), { onboardedFlag: true });
    } catch {}
    return createData();
  }
}

let lastSaved = null;
export async function saveData(data) {
  const json = JSON.stringify(data);
  if (json === lastSaved) return;
  try {
    if (lastSaved) await AsyncStorage.setItem(BACKUP_KEY, lastSaved);
    await AsyncStorage.setItem(KEY, json);
    lastSaved = json;
  } catch {}
}

export async function clearAll() {
  lastSaved = null;
  await AsyncStorage.multiRemove([KEY, V1_ONBOARDED_KEY, BACKUP_KEY]).catch(() => {});
}

// Small key/value helpers for non-critical things (anonymous analytics id, etc.)
export const getItem = k => AsyncStorage.getItem(k).catch(() => null);
export const setItem = (k, v) => AsyncStorage.setItem(k, v).catch(() => {});
