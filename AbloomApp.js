import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  Animated, Modal, Dimensions, KeyboardAvoidingView, Platform,
  StyleSheet, FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// ──────────────────────────── IMAGES ────────────────────────────
const PLANT_IMGS = [
  require('../assets/images/stage0.png'),
  require('../assets/images/stage1.png'),
  require('../assets/images/stage2.png'),
  require('../assets/images/stage3.png'),
  require('../assets/images/stage4.png'),
];
const FLOWER_IMG = require('../assets/images/flower.png');

// ──────────────────────────── THEME ────────────────────────────
const C = {
  bg: '#FFF8F0', card: '#F0E6D3', cardAlt: '#E8DFD0', border: '#DDD0BE',
  green: '#5A8F5A', greenDark: '#4A7F4A', greenLight: '#8FBC8F',
  olive: '#6B8E23', brown: '#4A3728', brownLight: '#8B7355', brownFade: '#B8A898',
  orange: '#E8A87C', blue: '#7FB5D4', blueDark: '#5A9EBF',
};
const F = { h: 'Caveat_700Bold', hm: 'Caveat_600SemiBold', b: 'ComingSoon_400Regular' };

// ──────────────────────────── DATA ────────────────────────────
const PRESETS = [
  { id: 'checking-locks', name: 'Checking doors/locks', cat: 'Checking' },
  { id: 'checking-stove', name: 'Checking the stove', cat: 'Checking' },
  { id: 'checking-appliances', name: 'Checking appliances', cat: 'Checking' },
  { id: 'hand-washing', name: 'Washing hands again', cat: 'Contamination' },
  { id: 'sanitizing', name: 'Sanitizing surfaces', cat: 'Contamination' },
  { id: 'avoiding-touch', name: 'Avoiding touching stuff', cat: 'Contamination' },
  { id: 'reassurance', name: 'Asking for reassurance', cat: 'Reassurance' },
  { id: 'googling', name: 'Googling symptoms or fears', cat: 'Reassurance' },
  { id: 'mental-review', name: 'Replaying events in your head', cat: 'Mental' },
  { id: 'counting', name: 'Counting or repeating', cat: 'Mental' },
  { id: 'ruminating', name: 'Stuck in a thought loop', cat: 'Mental' },
  { id: 'arranging', name: "Making things 'just right'", cat: 'Symmetry' },
  { id: 'rewriting', name: 'Re-reading or re-writing', cat: 'Symmetry' },
  { id: 'avoiding-situations', name: 'Avoiding a situation', cat: 'Avoidance' },
  { id: 'confessing', name: 'Confessing a thought', cat: 'Reassurance' },
  { id: 'body-checking', name: 'Scanning your body', cat: 'Checking' },
];
const ENCOURAGEMENTS = [
  "You're getting stronger. For real.", "That was brave and you know it.", "One drop at a time.",
  "Look at you go.", "Your roots run deeper now.", "The anxiety fades. The growth stays.",
  "You're bigger than the urge.", "That right there? That's bravery.",
  "Future you is so grateful right now.", "Hard thing. Right thing. Same thing.",
  "The thought didn't win today.", "Uncomfortable? Yeah. But you did it anyway.",
  "You picked discomfort over the cycle.", "The urge wanted to run the show. You said no.",
  "Another drop. It adds up.",
];
const QUOTES = [
  '"If you try not to sweat, everything will make you sweat."',
  '"The only way out is through."', '"You are not your thoughts."',
  '"The cave you fear to enter holds the treasure you seek."',
  '"What you resist, persists."', '"You don\'t have to feel ready. You just have to start."',
  '"The discomfort is proof you\'re growing."', '"Your anxiety is a liar with a loud voice."',
  '"Recovery isn\'t a straight line and that\'s fine."', '"Courage isn\'t the absence of fear."',
];
const GROUNDING_STEPS = [
  'Name 5 things you can see right now.', 'Name 4 things you can physically feel.',
  'Name 3 things you can hear.', 'Name 2 things you can smell.', 'Name 1 thing you can taste.',
];
const STRUGGLE_MESSAGES = [
  "The urge is real. But it's a wave. Waves pass.",
  "You've sat with this before and you're still here.",
  "This feeling is temporary. Giving in keeps the cycle going.",
  "Your brain is lying to you. You don't need to do it.",
  "It peaks and then it drops. Just ride it.",
  "The compulsion feels like relief but it's fuel for next time.",
  "You're safe. Nothing bad happens if you sit with it.",
  "This feeling passes in minutes. What you build here lasts.",
];
const STAGE_NAMES = ['Seedling', 'Tiny Sapling', 'Bigger Sapling', 'Young Tree', 'Full Bloom'];
const THRESHOLDS = [0, 5, 10, 15, 20];
const PLANT_SIZES = [190, 147, 216, 241, 305];
const AI_SYS = 'You are a warm companion inside Abloom, an app for people with OCD. You\'re not a therapist, but you understand OCD well. Your two jobs: 1. Help people identify specific compulsive behaviors they can track. 2. When someone describes a thought pattern, gently name the cognitive distortion if you spot one (catastrophizing, black-and-white thinking, magical thinking, thought-action fusion, overestimation of threat, intolerance of uncertainty). Keep responses to 2-4 sentences. Talk like a friend. Never provide reassurance about whether a fear is rational. Never tell someone to just stop. Help them see the pattern. If someone seems to be seeking reassurance, gently point that out and redirect to sitting with the uncertainty.';

const DEFAULT_DATA = { active: [], custom: [], log: [], streak: 0, lastDate: null, best: 0, total: 0, stage: 0, forest: 0, trees: [], erp: [] };

// ──────────────────────────── UTILS ────────────────────────────
const getToday = () => new Date().toISOString().split('T')[0];
const daysBetween = (a, b) => (!a || !b) ? 999 : Math.floor((new Date(b) - new Date(a)) / 864e5);
const getMood = l => { if (!l) return 'waiting'; const g = daysBetween(l, getToday()); return g === 0 ? 'happy' : g === 1 ? 'neutral' : 'thirsty'; };
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const fmt = s => { const m = Math.floor(s / 60); const sc = s % 60; return `${m}:${sc < 10 ? '0' : ''}${sc}`; };
const getStageForStreak = s => { for (let i = THRESHOLDS.length - 1; i >= 0; i--) if (s >= THRESHOLDS[i]) return i; return 0; };

// ──────────────────────────── SMALL COMPONENTS ────────────────────────────

function PlantView({ stage, watering }) {
  const size = PLANT_SIZES[Math.min(stage, 4)];
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (watering) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 400, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [watering]);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: size }}>
      <Animated.Image source={PLANT_IMGS[Math.min(stage, 4)]}
        style={{ width: size, height: size, resizeMode: 'contain', transform: [{ scale }] }} />
    </View>
  );
}

function DecorativeFlowers({ height = 90 }) {
  const positions = [
    { bottom: 6, left: 8, s: 34, r: -15, o: 0.3 },
    { bottom: 20, left: 60, s: 24, r: 22, o: 0.22 },
    { bottom: 4, left: '28%', s: 28, r: -8, o: 0.25 },
    { bottom: 16, left: '42%', s: 20, r: 30, o: 0.18 },
    { bottom: 8, left: '55%', s: 32, r: -20, o: 0.28 },
    { bottom: 22, right: 70, s: 22, r: 15, o: 0.2 },
    { bottom: 5, right: 15, s: 36, r: 10, o: 0.3 },
    { bottom: 14, right: '35%', s: 18, r: -30, o: 0.16 },
    { bottom: 24, left: '18%', s: 16, r: 40, o: 0.14 },
    { bottom: 2, right: '22%', s: 26, r: -5, o: 0.24 },
  ];
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height, overflow: 'hidden' }} pointerEvents="none">
      {positions.map((p, i) => (
        <Image key={i} source={FLOWER_IMG}
          style={{ position: 'absolute', bottom: p.bottom, left: p.left, right: p.right,
            width: p.s, height: p.s, resizeMode: 'contain', opacity: p.o,
            transform: [{ rotate: `${p.r}deg` }] }} />
      ))}
    </View>
  );
}

function WaterDrops({ show }) {
  const anims = useRef(Array.from({ length: 10 }, () => ({
    y: new Animated.Value(-20),
    o: new Animated.Value(1),
  }))).current;
  useEffect(() => {
    if (show) {
      anims.forEach((a, i) => {
        a.y.setValue(-20); a.o.setValue(1);
        Animated.parallel([
          Animated.timing(a.y, { toValue: 280, duration: 800 + Math.random() * 400, delay: i * 60, useNativeDriver: true }),
          Animated.timing(a.o, { toValue: 0, duration: 800 + Math.random() * 400, delay: i * 60, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [show]);
  if (!show) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((a, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: `${10 + Math.random() * 80}%`, top: 0,
          width: 5 + Math.random() * 4, height: 8 + Math.random() * 6,
          borderRadius: 4, backgroundColor: 'rgba(127,181,212,0.45)',
          transform: [{ translateY: a.y }], opacity: a.o,
        }} />
      ))}
    </View>
  );
}

function FloatPlus({ show }) {
  const y = useRef(new Animated.Value(0)).current;
  const o = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (show) {
      y.setValue(0); o.setValue(1);
      Animated.parallel([
        Animated.timing(y, { toValue: -60, duration: 1200, useNativeDriver: true }),
        Animated.timing(o, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]).start();
    }
  }, [show]);
  if (!show) return null;
  return (
    <Animated.Text style={{
      position: 'absolute', top: '25%', alignSelf: 'center', zIndex: 12,
      fontFamily: F.h, fontSize: 28, color: C.green,
      transform: [{ translateY: y }], opacity: o,
    }}>+1</Animated.Text>
  );
}

function Chip({ label, active, onPress, prefix }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={{
        paddingVertical: 6, paddingHorizontal: 13, borderRadius: 20,
        backgroundColor: active ? C.green : C.card,
        borderWidth: 2, borderColor: active ? C.greenDark : C.border,
        transform: [{ scale: active ? 1.05 : 1 }],
      }}>
      <Text style={{ fontSize: 12, fontFamily: F.b, color: active ? '#fff' : C.brown }}>
        {prefix}{label}
      </Text>
    </TouchableOpacity>
  );
}

function AnxietyPicker({ value, onChange, color }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}
          style={{
            width: 27, height: 27, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
            backgroundColor: value === n ? color : C.card,
          }}>
          <Text style={{ fontSize: 11, fontFamily: F.b, color: value === n ? '#fff' : C.brown }}>{n}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AnxietyCurve({ ratings, color }) {
  if (ratings.length < 2) return null;
  const w = Math.max(ratings.length - 1, 1) * 30;
  return (
    <View style={{ width: '100%', maxWidth: 260, height: 50, backgroundColor: C.card, borderRadius: 10, overflow: 'hidden', padding: 4 }}>
      {/* simplified curve display */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 2 }}>
        {ratings.map((r, i) => (
          <View key={i} style={{
            flex: 1, backgroundColor: color, borderRadius: 2, opacity: 0.6,
            height: `${r.val * 9}%`, maxHeight: '100%',
          }} />
        ))}
      </View>
    </View>
  );
}

// ──────────────────────────── BREATHING ────────────────────────────
function Breathing() {
  const [phase, setPhase] = useState('in');
  const [secs, setSecs] = useState(4);
  const scale = useRef(new Animated.Value(0.55)).current;
  const ringO = useRef(new Animated.Value(0.3)).current;
  const t1 = useRef(null);
  const t2 = useRef(null);

  useEffect(() => {
    const seq = [{ p: 'in', d: 4 }, { p: 'hold', d: 4 }, { p: 'out', d: 6 }, { p: 'rest', d: 2 }];
    let i = 0;
    const run = () => {
      const st = seq[i % 4];
      setPhase(st.p); setSecs(st.d);
      const targetScale = (st.p === 'in' || st.p === 'hold') ? 1.45 : 0.55;
      const targetRing = (st.p === 'in' || st.p === 'hold') ? 0.3 : 0.08;
      Animated.timing(scale, { toValue: targetScale, duration: st.d * 1000, useNativeDriver: true }).start();
      Animated.timing(ringO, { toValue: targetRing, duration: 400, useNativeDriver: true }).start();
      let r = st.d;
      t1.current = setInterval(() => { r--; if (r > 0) setSecs(r); }, 1000);
      t2.current = setTimeout(() => { clearInterval(t1.current); i++; run(); }, st.d * 1000);
    };
    run();
    return () => { clearTimeout(t2.current); clearInterval(t1.current); };
  }, []);

  const label = phase === 'in' ? 'breathe in' : phase === 'hold' ? 'hold' : phase === 'out' ? 'breathe out' : 'rest';

  return (
    <View style={{ alignItems: 'center', gap: 20 }}>
      <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{
          position: 'absolute', width: 140, height: 140, borderRadius: 70,
          borderWidth: 2, borderColor: C.green, opacity: ringO, transform: [{ scale: Animated.multiply(scale, 1.15) }],
        }} />
        <Animated.View style={{
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: 'rgba(127,181,212,0.15)', borderWidth: 3, borderColor: 'rgba(90,143,90,0.3)',
          alignItems: 'center', justifyContent: 'center', transform: [{ scale }],
        }}>
          <Text style={{ fontFamily: F.h, fontSize: 28, color: C.green }}>{secs}</Text>
        </Animated.View>
      </View>
      <Text style={{ fontFamily: F.h, fontSize: 22, color: C.green }}>{label}</Text>
    </View>
  );
}

// ──────────────────────────── URGE TIMER ────────────────────────────
function UrgeTimer({ onBack, onDone }) {
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [curR, setCurR] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (running) ref.current = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  const addR = n => { setCurR(n); setRatings(prev => [...prev, { time: secs, val: n }]); };
  const col = secs > 600 ? C.green : C.orange;
  const msg = !running && secs === 0 ? 'tap start when the urge hits.'
    : ratings.length === 0 ? 'how anxious are you? tap a number.'
    : secs < 300 ? 'stay with it. log again whenever it shifts.'
    : secs < 600 ? "you're past 5 minutes. most people quit by now."
    : 'notice how it feels. log again.';

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <TouchableOpacity onPress={onBack}><Text style={{ fontSize: 13, color: C.brownFade, fontFamily: F.b }}>{'← back'}</Text></TouchableOpacity>
      <Text style={{ fontFamily: F.h, fontSize: 15, color: C.brown, textAlign: 'center', lineHeight: 20 }}>rate your anxiety as you go and watch the number drop.</Text>
      <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: col + '44',
        backgroundColor: secs > 600 ? 'rgba(90,143,90,0.08)' : 'rgba(232,168,124,0.08)',
        alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: F.h, fontSize: 32, color: col }}>{fmt(secs)}</Text>
      </View>
      <Text style={{ fontSize: 12, color: C.brownLight, textAlign: 'center', fontFamily: F.b, minHeight: 28 }}>{msg}</Text>
      {running && (
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 10, color: C.brownFade }}>anxiety right now?</Text>
          <AnxietyPicker value={curR} onChange={addR} color={col} />
        </View>
      )}
      <AnxietyCurve ratings={ratings} color={col} />
      {!running ? (
        <TouchableOpacity onPress={() => setRunning(true)} style={[s.btn, { backgroundColor: C.orange }]}>
          <Text style={s.btnText}>start</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => { setRunning(false); setSecs(0); setRatings([]); setCurR(null); }}
            style={[s.btnOutline]}><Text style={{ fontSize: 13, color: C.brown, fontFamily: F.b }}>reset</Text></TouchableOpacity>
          <TouchableOpacity onPress={onDone} style={[s.btn, { backgroundColor: C.green }]}>
            <Text style={s.btnText}>i made it through</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ──────────────────────────── ERP SESSION ────────────────────────────
function ERPSession({ onClose, onComplete, compulsions }) {
  const [step, setStep] = useState('pick');
  const [trigger, setTrigger] = useState(null);
  const [fear, setFear] = useState('');
  const [preAnx, setPreAnx] = useState(null);
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [curR, setCurR] = useState(null);
  const [postAnx, setPostAnx] = useState(null);
  const [happened, setHappened] = useState(null);
  const [learned, setLearned] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (running) ref.current = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  const nm = id => { const f = compulsions.find(c => c.id === id); return f ? f.name : id; };
  const col = secs > 600 ? C.green : C.orange;
  const finish = () => { onComplete({ date: getToday(), trigger, fear, preAnxiety: preAnx, duration: secs, anxietyCurve: ratings, postAnxiety: postAnx, fearedHappened: happened, learned, ts: Date.now() }); };

  return (
    <ScrollView contentContainerStyle={{ alignItems: 'center', gap: 14, paddingBottom: 20 }}>
      {step === 'pick' && (<>
        <Text style={{ fontFamily: F.h, fontSize: 20, color: C.green, textAlign: 'center' }}>exposure practice</Text>
        <Text style={{ fontSize: 13, color: C.brownLight, textAlign: 'center', lineHeight: 18 }}>pick what you're going to face. you're choosing to sit with the discomfort on purpose.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {compulsions.map(c => <Chip key={c.id} label={c.name} active={trigger === c.id} onPress={() => setTrigger(c.id)} />)}
        </View>
        {trigger && <TouchableOpacity onPress={() => setStep('pre')} style={[s.btn, { backgroundColor: C.green }]}><Text style={s.btnText}>next</Text></TouchableOpacity>}
      </>)}
      {step === 'pre' && (<>
        <Text style={{ fontFamily: F.h, fontSize: 20, color: C.green }}>before you start</Text>
        <Text style={{ fontSize: 12, color: C.brownLight }}>facing: {nm(trigger)}</Text>
        <View style={{ width: '100%', gap: 10 }}>
          <View>
            <Text style={{ fontSize: 12, color: C.brown, fontFamily: F.b, marginBottom: 4 }}>what are you afraid will happen?</Text>
            <TextInput value={fear} onChangeText={setFear} placeholder="e.g. someone will break in"
              placeholderTextColor={C.brownFade} style={s.input} />
          </View>
          <View>
            <Text style={{ fontSize: 12, color: C.brown, fontFamily: F.b, marginBottom: 4 }}>anxiety right now? (1-10)</Text>
            <AnxietyPicker value={preAnx} onChange={setPreAnx} color={C.orange} />
          </View>
        </View>
        {preAnx && <TouchableOpacity onPress={() => { setStep('timer'); setRunning(true); setRatings([{ time: 0, val: preAnx }]); setCurR(preAnx); }}
          style={[s.btn, { backgroundColor: C.green }]}><Text style={s.btnText}>start the exposure</Text></TouchableOpacity>}
      </>)}
      {step === 'timer' && (<>
        <Text style={{ fontFamily: F.h, fontSize: 18, color: C.green }}>you're in it. stay here.</Text>
        <Text style={{ fontSize: 11, color: C.brownLight }}>facing: {nm(trigger)}</Text>
        <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: col + '44',
          backgroundColor: secs > 600 ? 'rgba(90,143,90,0.08)' : 'rgba(232,168,124,0.08)',
          alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: F.h, fontSize: 32, color: col }}>{fmt(secs)}</Text>
        </View>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 10, color: C.brownFade }}>anxiety right now?</Text>
          <AnxietyPicker value={curR} onChange={n => { setCurR(n); setRatings(prev => [...prev, { time: secs, val: n }]); }} color={col} />
        </View>
        <AnxietyCurve ratings={ratings} color={col} />
        <TouchableOpacity onPress={() => { setRunning(false); setStep('post'); }}
          style={[s.btn, { backgroundColor: C.green }]}><Text style={s.btnText}>i'm done with this exposure</Text></TouchableOpacity>
      </>)}
      {step === 'post' && (<>
        <Text style={{ fontFamily: F.h, fontSize: 20, color: C.green }}>nice. let's debrief.</Text>
        <Text style={{ fontSize: 12, color: C.brownLight }}>you sat with it for {fmt(secs)}.</Text>
        <View style={{ width: '100%', gap: 10 }}>
          <View>
            <Text style={{ fontSize: 12, color: C.brown, fontFamily: F.b, marginBottom: 4 }}>did the thing you feared actually happen?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['no', 'yes'].map(v => (
                <TouchableOpacity key={v} onPress={() => setHappened(v === 'yes')}
                  style={{ paddingVertical: 8, paddingHorizontal: 20, borderRadius: 14, borderWidth: 2,
                    borderColor: happened === (v === 'yes') ? C.greenDark : C.border,
                    backgroundColor: happened === (v === 'yes') ? C.green : C.card }}>
                  <Text style={{ fontFamily: F.b, fontSize: 13, color: happened === (v === 'yes') ? '#fff' : C.brown }}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View>
            <Text style={{ fontSize: 12, color: C.brown, fontFamily: F.b, marginBottom: 4 }}>anxiety now? (1-10)</Text>
            <AnxietyPicker value={postAnx} onChange={setPostAnx} color={C.green} />
          </View>
          <View>
            <Text style={{ fontSize: 12, color: C.brown, fontFamily: F.b, marginBottom: 4 }}>anything you noticed? (optional)</Text>
            <TextInput value={learned} onChangeText={setLearned} placeholder="e.g. nothing bad happened"
              placeholderTextColor={C.brownFade} style={s.input} />
          </View>
        </View>
        {happened !== null && postAnx && (
          <TouchableOpacity onPress={() => { finish(); setStep('done'); }}
            style={[s.btn, { backgroundColor: C.green }]}><Text style={s.btnText}>save this session</Text></TouchableOpacity>
        )}
      </>)}
      {step === 'done' && (<>
        <Text style={{ fontFamily: F.h, fontSize: 22, color: C.green, textAlign: 'center' }}>you did it.</Text>
        {preAnx && postAnx && postAnx < preAnx && (
          <Text style={{ fontSize: 14, color: C.brownLight, textAlign: 'center', lineHeight: 20 }}>
            your anxiety went from {preAnx} to {postAnx}. that's your brain learning it's safe.
          </Text>
        )}
        {happened === false && <Text style={{ fontSize: 13, color: C.brownLight, textAlign: 'center', fontStyle: 'italic' }}>the feared thing didn't happen. it almost never does.</Text>}
        <TouchableOpacity onPress={onClose} style={[s.btn, { backgroundColor: C.green, marginTop: 4 }]}>
          <Text style={s.btnText}>close</Text></TouchableOpacity>
      </>)}
    </ScrollView>
  );
}

// ──────────────────────────── JOURNEY COMPONENTS ────────────────────────────
function Cal({ log }) {
  const cells = [];
  const t = new Date(getToday());
  for (let i = 34; i >= 0; i--) {
    const d = new Date(t); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    cells.push({ date: ds, count: log.filter(l => l.date === ds).length, day: d.getDate(), dow: d.getDay() });
  }
  const gc = n => n === 0 ? '#EDE5D8' : n === 1 ? '#C5DFC0' : n <= 3 ? '#8FBC8F' : '#5A8F5A';
  const cw = (Dimensions.get('window').width - 32) / 7;
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <View key={i} style={{ width: cw, alignItems: 'center', paddingBottom: 2 }}>
            <Text style={{ fontSize: 11, color: C.brownFade, fontFamily: F.b }}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {[...Array(cells[0]?.dow || 0)].map((_, i) => <View key={`p${i}`} style={{ width: cw, height: cw }} />)}
        {cells.map((c, i) => (
          <View key={i} style={{
            width: cw, height: cw, padding: 2,
          }}>
            <View style={{
              flex: 1, borderRadius: 6, backgroundColor: gc(c.count),
              alignItems: 'center', justifyContent: 'center',
              borderWidth: c.date === getToday() ? 2 : 0, borderColor: C.green,
            }}>
              <Text style={{ fontSize: 10, fontFamily: F.b, color: c.count > 0 ? '#FFF8F0' : C.brownFade, fontWeight: c.count > 0 ? '600' : '400' }}>{c.day}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 10 }}>
        <Text style={{ fontSize: 11, color: C.brownFade, fontFamily: F.b }}>less</Text>
        {[0, 1, 2, 4].map(n => <View key={n} style={{ width: 13, height: 13, borderRadius: 4, backgroundColor: gc(n) }} />)}
        <Text style={{ fontSize: 11, color: C.brownFade, fontFamily: F.b }}>more</Text>
      </View>
    </View>
  );
}

function Insights({ log, allC }) {
  if (log.length < 3) return <Text style={{ fontSize: 13, color: C.brownFade, fontFamily: F.b, textAlign: 'center' }}>log a few more and your patterns show up here.</Text>;
  const ct = {}; log.forEach(l => { ct[l.compulsion] = (ct[l.compulsion] || 0) + 1; });
  const sorted = Object.entries(ct).sort((a, b) => b[1] - a[1]);
  const nm = id => { const f = allC.find(c => c.id === id); return f ? f.name : id; };
  return (
    <View style={{ gap: 8 }}>
      {sorted.slice(0, 5).map(([id, count]) => {
        const pct = Math.round((count / log.length) * 100);
        return (
          <View key={id} style={{ gap: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 12, fontFamily: F.b, color: C.brown }}>{nm(id)}</Text>
              <Text style={{ fontSize: 13, fontFamily: F.h, color: C.green }}>{count}x ({pct}%)</Text>
            </View>
            <View style={{ width: '100%', height: 6, backgroundColor: '#EDE5D8', borderRadius: 6, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${pct}%`, backgroundColor: C.green, borderRadius: 6 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ERPHistory({ sessions, allC }) {
  if (!sessions || sessions.length === 0) return <Text style={{ fontSize: 13, color: C.brownFade, fontFamily: F.b, textAlign: 'center' }}>complete an exposure session and it shows up here.</Text>;
  const nm = id => { const f = allC.find(c => c.id === id); return f ? f.name : id; };
  return (
    <View style={{ gap: 8 }}>
      {sessions.slice(-5).reverse().map((ss, i) => (
        <View key={i} style={{ backgroundColor: C.card, borderRadius: 14, padding: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, fontFamily: F.b, color: C.brown, fontWeight: '600' }}>{nm(ss.trigger)}</Text>
            <Text style={{ fontSize: 11, color: C.brownFade, fontFamily: F.b }}>{new Date(ss.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6, alignItems: 'center' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: F.h, fontSize: 20, color: C.orange }}>{ss.preAnxiety}</Text>
              <Text style={{ fontSize: 9, color: C.brownFade }}>before</Text>
            </View>
            <Text style={{ color: C.brownFade, fontSize: 14 }}>→</Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: F.h, fontSize: 20, color: C.green }}>{ss.postAnxiety}</Text>
              <Text style={{ fontSize: 9, color: C.brownFade }}>after</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: C.brownFade, fontFamily: F.b }}>{Math.floor(ss.duration / 60)}m</Text>
              {ss.fearedHappened === false && <Text style={{ fontSize: 10, color: C.green, fontFamily: F.b }}>feared thing didn't happen</Text>}
            </View>
          </View>
          {ss.learned ? <Text style={{ fontSize: 11, color: C.brownLight, marginTop: 6, fontStyle: 'italic', fontFamily: F.b }}>"{ss.learned}"</Text> : null}
        </View>
      ))}
    </View>
  );
}

// ──────────────────────────── MAIN APP ────────────────────────────
export default function AbloomApp() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState('setup');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(true);
  const [onboardPage, setOnboardPage] = useState(0);

  const [watering, setWatering] = useState(false);
  const [encouragement, setEncouragement] = useState(null);
  const [selected, setSelected] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [showRebirth, setShowRebirth] = useState(false);
  const [struggling, setStruggling] = useState(false);
  const [groundStep, setGroundStep] = useState(0);
  const [struggleMode, setStruggleMode] = useState('menu');
  const [showERP, setShowERP] = useState(false);
  const [overuseWarn, setOveruseWarn] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(null);

  const [showDrops, setShowDrops] = useState(false);
  const [showPlus, setShowPlus] = useState(false);

  const [quote] = useState(() => pick(QUOTES));
  const [struggleMsg] = useState(() => pick(STRUGGLE_MESSAGES));
  const chatScrollRef = useRef(null);

  // ── Storage ──
  useEffect(() => {
    (async () => {
      try {
        const [raw, ob] = await Promise.all([
          AsyncStorage.getItem('abloom-data'),
          AsyncStorage.getItem('abloom-onboarded'),
        ]);
        setData(raw ? JSON.parse(raw) : DEFAULT_DATA);
        setOnboarded(ob === 'true');
      } catch (e) {
        setData(DEFAULT_DATA);
        setOnboarded(false);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (data && !loading) AsyncStorage.setItem('abloom-data', JSON.stringify(data)).catch(() => {});
  }, [data, loading]);

  const finishOnboarding = () => { setOnboarded(true); AsyncStorage.setItem('abloom-onboarded', 'true').catch(() => {}); };

  // ── Derived state ──
  const allCompulsions = [...(data?.custom || []), ...PRESETS];
  const activeList = allCompulsions.filter(c => data?.active.includes(c.id));
  const todayCount = data ? data.log.filter(l => l.date === getToday()).length : 0;
  const mood = watering ? 'happy' : getMood(data?.lastDate);
  const daysToNext = () => (!data || data.stage >= 4) ? 0 : THRESHOLDS[data.stage + 1] - data.streak;
  const progressPercent = () => { if (!data || data.stage >= 4) return 100; const p = THRESHOLDS[data.stage], n = THRESHOLDS[data.stage + 1]; return ((data.streak - p) / (n - p)) * 100; };
  const toggleCompulsion = id => { const a = data.active.includes(id) ? data.active.filter(c => c !== id) : [...data.active, id]; setData({ ...data, active: a }); };

  const searchResults = searchQ.trim().length > 0 ? allCompulsions.filter(c =>
    c.name.toLowerCase().includes(searchQ.toLowerCase()) || c.cat.toLowerCase().includes(searchQ.toLowerCase())
  ).slice(0, 8) : [];

  // ── Water ──
  const water = () => {
    if (!selected || watering) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWatering(true);
    setEncouragement(pick(ENCOURAGEMENTS));
    setTimeout(() => { setShowDrops(true); setShowPlus(true); }, 200);
    setTimeout(() => setShowDrops(false), 1200);
    setTimeout(() => setShowPlus(false), 2000);

    const today = getToday();
    const newLog = [...data.log, { date: today, compulsion: selected, ts: Date.now() }];
    const isNewDay = data.lastDate !== today;
    const wasYesterday = data.lastDate && daysBetween(data.lastDate, today) === 1;
    let newStreak = data.streak;
    if (isNewDay) newStreak = (wasYesterday || !data.lastDate || data.streak === 0) ? data.streak + 1 : 1;
    const newStage = getStageForStreak(newStreak);
    if (newStage > data.stage) {
      setTimeout(() => { setShowLevelUp(STAGE_NAMES[newStage]); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setTimeout(() => setShowLevelUp(null), 2800); }, 2200);
    }
    setData({ ...data, log: newLog, total: data.total + 1, streak: newStreak, lastDate: today, best: Math.max(newStreak, data.best), stage: newStage });
    if (newLog.filter(l => l.date === today).length === 8 && !overuseWarn) { setTimeout(() => setOveruseWarn(true), 3000); }
    setTimeout(() => { setWatering(false); setSelected(null); }, 2200);
    setTimeout(() => setEncouragement(null), 3800);
  };

  const doRebirth = () => { setData({ ...data, stage: 0, forest: data.forest + 1, trees: [...(data.trees || []), { date: getToday(), streak: data.streak }], streak: 0, lastDate: null }); setShowRebirth(false); };
  const addCustom = () => { if (!customInput.trim()) return; const id = 'c-' + Date.now(); setData({ ...data, custom: [...data.custom, { id, name: customInput.trim(), cat: 'Custom' }], active: [...data.active, id] }); setCustomInput(''); setShowAddCustom(false); };
  const removeCustom = id => setData({ ...data, custom: data.custom.filter(c => c.id !== id), active: data.active.filter(c => c !== id) });
  const completeERP = session => { setData(prev => ({ ...prev, erp: [...(prev.erp || []), session] })); };

  // ── AI ──
  const sendAiMessage = async (ov) => {
    const msg = ov || aiInput.trim(); if (!msg || aiLoading) return;
    if (!ov) setAiInput('');
    setAiMessages(p => [...p, { role: 'user', content: msg }]); setAiLoading(true);
    try {
      const h = [...aiMessages, { role: 'user', content: msg }];
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: AI_SYS, messages: h }),
      });
      const rs = await r.json();
      const txt = rs.content?.map(c => c.text || '').filter(Boolean).join('') || "I'm here. Tell me more?";
      setAiMessages(p => [...p, { role: 'assistant', content: txt }]);
    } catch (err) {
      setAiMessages(p => [...p, { role: 'assistant', content: "Can't connect right now. Try again?" }]);
    }
    setAiLoading(false);
  };

  // ── Loading ──
  if (loading || !data) return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: F.h, fontSize: 24, color: C.green }}>growing...</Text>
    </View>
  );

  // ══════════════════════════════ ONBOARDING ══════════════════════════════
  const onboardCards = [
    { title: 'welcome to abloom', body: "a gentle companion for people with ocd. no clipboards, no clinical language. just you, your courage, and a plant that grows when you do.", img: FLOWER_IMG, imgSize: 72, imgOpacity: 0.35 },
    { title: "here's how it works", body: "first, you'll tell us what compulsions your ocd makes you do. then, every time you resist one, you water your plant.", img: PLANT_IMGS[1], imgSize: 100, imgOpacity: 1 },
    { title: 'watch yourself grow', body: "your plant grows from a tiny seedling to a full tree over 20 days of resistance. every bloom is proof you did the hard thing. and the plant never dies. it just waits for you.", img: PLANT_IMGS[4], imgSize: 140, imgOpacity: 1 },
  ];

  if (!onboarded) {
    const card = onboardCards[onboardPage];
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Image source={card.img} style={{ width: card.imgSize, height: card.imgSize, resizeMode: 'contain', marginBottom: 24, opacity: card.imgOpacity }} />
          <Text style={{ fontFamily: F.h, fontSize: 32, color: C.green, textAlign: 'center', marginBottom: 12 }}>{card.title}</Text>
          <Text style={{ fontSize: 14, color: C.brownLight, textAlign: 'center', lineHeight: 22, marginBottom: 32, maxWidth: 300, fontFamily: F.b }}>{card.body}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
            {onboardCards.map((_, i) => (
              <View key={i} style={{ width: i === onboardPage ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === onboardPage ? C.green : C.cardAlt }} />
            ))}
          </View>
          <View style={{ width: '100%', maxWidth: 280, gap: 10 }}>
            <TouchableOpacity onPress={onboardPage < 2 ? () => setOnboardPage(onboardPage + 1) : finishOnboarding} activeOpacity={0.8}>
              <LinearGradient colors={[C.green, C.greenDark]} style={{ paddingVertical: 14, borderRadius: 24, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontFamily: F.h, fontSize: 18 }}>{onboardPage < 2 ? 'next' : "let's get started"}</Text>
              </LinearGradient>
            </TouchableOpacity>
            {onboardPage < 2 && (
              <TouchableOpacity onPress={finishOnboarding} style={{ alignItems: 'center', padding: 6 }}>
                <Text style={{ fontSize: 12, color: C.brownFade }}>skip</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <DecorativeFlowers height={60} />
      </View>
    );
  }

  const trees = data.trees || [];
  const moodText = mood === 'thirsty' ? 'your plant is waiting for you...' : mood === 'waiting' ? 'plant your first drop of courage' : null;
  const tabSubtitle = view === 'setup' ? 'what does your ocd look like?' : view === 'home' ? 'grow through what you go through' : view === 'journey' ? 'how far you\'ve come' : "let's figure this out";

  // ══════════════════════════════ MAIN RENDER ══════════════════════════════
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, alignItems: 'center' }}>
        <Text style={{ fontFamily: F.h, fontSize: 36, color: C.green, letterSpacing: 3 }}>abloom</Text>
        <Text style={{ fontSize: 11, color: C.brownFade, fontStyle: 'italic', fontFamily: F.b }}>{tabSubtitle}</Text>
      </View>

      {/* ═══ TAB CONTENT ═══ */}
      <View style={{ flex: 1 }}>

        {/* ═══ MY OCD TAB ═══ */}
        {view === 'setup' && (
          <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled">
            <View style={{ alignItems: 'center', width: '100%', maxWidth: 340, gap: 16 }}>
              <Image source={FLOWER_IMG} style={{ width: 48, height: 48, opacity: 0.18, marginBottom: 4 }} />
              <Text style={{ fontFamily: F.h, fontSize: 22, color: C.brown, textAlign: 'center', lineHeight: 28 }}>search for a compulsion</Text>
              <Text style={{ fontSize: 12, color: C.brownFade, textAlign: 'center', lineHeight: 18, marginTop: -4, fontFamily: F.b }}>find what your ocd makes you do, then add it to your list.</Text>

              {/* Search bar */}
              <View style={{ width: '100%', zIndex: 20 }}>
                <TextInput value={searchQ} onChangeText={t => { setSearchQ(t); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="e.g. checking, washing, reassurance..."
                  placeholderTextColor={C.brownFade}
                  style={[s.input, { borderColor: searchQ ? C.green : C.border, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 }]} />

                {showDropdown && searchQ.trim().length > 0 && searchResults.length > 0 && (
                  <View style={{ position: 'absolute', top: 48, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 14,
                    borderWidth: 2, borderColor: C.border, maxHeight: 240, overflow: 'hidden',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 }}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {searchResults.map(c => {
                        const isActive = data.active.includes(c.id);
                        return (
                          <TouchableOpacity key={c.id} onPress={() => { toggleCompulsion(c.id); setSearchQ(''); setShowDropdown(false); }}
                            style={{ paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.cardAlt,
                              backgroundColor: isActive ? 'rgba(90,143,90,0.06)' : 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, color: C.brown, fontFamily: F.b }}>{c.cat === 'Custom' ? '★ ' : ''}{c.name}</Text>
                              <Text style={{ fontSize: 10, color: C.brownFade }}>{c.cat}</Text>
                            </View>
                            <Text style={{ fontSize: 11, color: isActive ? C.green : C.brownFade, fontWeight: '600' }}>{isActive ? '✓ added' : '+ add'}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
                {showDropdown && searchQ.trim().length > 0 && searchResults.length === 0 && (
                  <View style={{ position: 'absolute', top: 48, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 14,
                    borderWidth: 2, borderColor: C.border, padding: 14, alignItems: 'center',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 }}>
                    <Text style={{ fontSize: 13, color: C.brownFade, fontFamily: F.b }}>no matches for "{searchQ}"</Text>
                    <TouchableOpacity onPress={() => { setCustomInput(searchQ); setShowAddCustom(true); setSearchQ(''); setShowDropdown(false); }}
                      style={{ marginTop: 8, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: C.green }}>
                      <Text style={{ color: C.green, fontSize: 12, fontFamily: F.b }}>+ add "{searchQ}" as a custom compulsion</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity onPress={() => setShowAddCustom(true)}
                style={{ paddingVertical: 9, paddingHorizontal: 18, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: C.border }}>
                <Text style={{ color: C.brownLight, fontSize: 12, fontFamily: F.b }}>+ add your own compulsion</Text>
              </TouchableOpacity>

              {showAddCustom && (
                <View style={{ width: '100%', backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 8 }}>
                  <Text style={{ fontSize: 12, color: C.brown, fontFamily: F.b }}>describe your compulsion in your own words:</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput value={customInput} onChangeText={setCustomInput} onSubmitEditing={addCustom} autoFocus
                      placeholder="e.g. checking my phone for texts" placeholderTextColor={C.brownFade}
                      style={[s.input, { flex: 1 }]} />
                    <TouchableOpacity onPress={addCustom} style={[s.btn, { backgroundColor: C.green, paddingHorizontal: 14 }]}>
                      <Text style={s.btnText}>add</Text></TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => setShowAddCustom(false)}>
                    <Text style={{ fontSize: 11, color: C.brownFade, textAlign: 'center' }}>cancel</Text></TouchableOpacity>
                </View>
              )}

              {activeList.length > 0 && (
                <View style={{ width: '100%', marginTop: 4 }}>
                  <Text style={{ fontSize: 12, color: C.brownLight, marginBottom: 6, fontFamily: F.b }}>your compulsions ({activeList.length})</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {activeList.map(c => (
                      <TouchableOpacity key={c.id} onPress={() => toggleCompulsion(c.id)}
                        style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: C.green,
                          borderWidth: 2, borderColor: C.greenDark, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 12, fontFamily: F.b, color: '#fff' }}>{c.cat === 'Custom' ? '★ ' : ''}{c.name}</Text>
                        <Text style={{ fontSize: 10, color: '#fff', opacity: 0.7 }}>×</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {activeList.length === 0 && (
                <View style={{ backgroundColor: C.card, borderRadius: 14, padding: 16, width: '100%', alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ fontFamily: F.h, fontSize: 16, color: C.brown, marginBottom: 4 }}>start by adding a compulsion</Text>
                  <Text style={{ fontSize: 12, color: C.brownFade, textAlign: 'center', lineHeight: 18, fontFamily: F.b }}>search above or browse. these are the things your ocd makes you do. once you add some, you can track when you resist them.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* ═══ GROW TAB ═══ */}
        {view === 'home' && (
          <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 80 }}>
            {/* Plant */}
            <View style={{ position: 'relative', alignItems: 'center' }}>
              <WaterDrops show={showDrops} />
              <FloatPlus show={showPlus} />
              <PlantView stage={data.stage} watering={watering} />
              <Text style={{ fontFamily: F.h, fontSize: 18, color: C.olive, marginTop: 2 }}>{STAGE_NAMES[Math.min(data.stage, 4)]}</Text>
              {moodText && <Text style={{ fontSize: 11, color: C.orange, fontStyle: 'italic', marginTop: 1 }}>{moodText}</Text>}
            </View>

            {encouragement && <Text style={{ fontFamily: F.h, fontSize: 18, color: C.green, textAlign: 'center', paddingHorizontal: 16 }}>{encouragement}</Text>}

            {/* Progress */}
            {data.stage < 4 && (
              <View style={{ width: '100%', maxWidth: 300, alignItems: 'center', gap: 3 }}>
                <View style={{ width: '100%', height: 6, backgroundColor: '#EDE5D8', borderRadius: 6, overflow: 'hidden' }}>
                  <View style={{ height: '100%', backgroundColor: C.green, borderRadius: 6, width: `${progressPercent()}%` }} />
                </View>
                <Text style={{ fontSize: 11, color: C.brownLight, fontFamily: F.b }}>{daysToNext()} day{daysToNext() !== 1 ? 's' : ''} until {STAGE_NAMES[data.stage + 1]}</Text>
              </View>
            )}

            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 6, width: '100%', justifyContent: 'center' }}>
              <View style={{ backgroundColor: C.cardAlt, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 12, alignItems: 'center', flex: 1.3, maxWidth: 90, overflow: 'visible' }}>
                <Text style={{ fontFamily: F.h, fontSize: 28, color: C.green, lineHeight: 40 }}>{todayCount}</Text>
                <Text style={{ fontSize: 9, color: C.brownLight, marginTop: 2, fontFamily: F.b }}>today</Text>
              </View>
              {[['streak', data.streak], ['total', data.total], ['best', data.best]].map(([l, v]) => (
                <View key={l} style={{ backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 12, alignItems: 'center', flex: 1, maxWidth: 72, overflow: 'visible' }}>
                  <Text style={{ fontFamily: F.h, fontSize: 20, color: C.green, lineHeight: 30 }}>{v}</Text>
                  <Text style={{ fontSize: 9, color: C.brownLight, marginTop: 2, fontFamily: F.b }}>{l}</Text>
                </View>
              ))}
            </View>

            {/* Compulsion selection */}
            <View style={{ width: '100%', maxWidth: 340, alignItems: 'center' }}>
              <Text style={{ fontFamily: F.h, fontSize: 17, color: C.brown, marginBottom: 6, marginTop: 4 }}>what did you resist?</Text>
              {activeList.length === 0 && (
                <View style={{ backgroundColor: C.card, borderRadius: 14, padding: 16, width: '100%', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: C.brownLight, textAlign: 'center', lineHeight: 18, marginBottom: 10, fontFamily: F.b }}>you haven't added any compulsions yet. let's fix that.</Text>
                  <TouchableOpacity onPress={() => setView('setup')} style={[s.btn, { backgroundColor: C.green }]}>
                    <Text style={[s.btnText, { fontSize: 15 }]}>add my first compulsion</Text></TouchableOpacity>
                </View>
              )}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {activeList.map(c => <Chip key={c.id} label={c.name} active={selected === c.id}
                  onPress={() => setSelected(c.id === selected ? null : c.id)} prefix={c.cat === 'Custom' ? '★ ' : ''} />)}
              </View>
            </View>

            {/* Water button */}
            <TouchableOpacity onPress={water} disabled={!selected || watering} activeOpacity={0.8}
              style={{ width: '100%', maxWidth: 300, opacity: (!selected || watering) ? 0.4 : 1, borderRadius: 24, overflow: 'hidden' }}>
              <LinearGradient colors={[C.blue, C.blueDark]}
                style={{ paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 24 }}>
                <Text style={{ fontSize: 20 }}>💧</Text>
                <Text style={{ color: '#fff', fontFamily: F.h, fontSize: 18 }}>{watering ? 'watering...' : 'i resisted. water my plant.'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {data.stage >= 4 && !showRebirth && (
              <TouchableOpacity onPress={() => setShowRebirth(true)}
                style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: C.brownFade, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 11, color: C.brownLight, fontFamily: F.b }}>full bloom! ready to start a new one?</Text>
              </TouchableOpacity>
            )}
            {showRebirth && (
              <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, alignItems: 'center', width: '100%', maxWidth: 300 }}>
                <Text style={{ fontFamily: F.h, fontSize: 16, color: C.brown, lineHeight: 22, textAlign: 'center', marginBottom: 12 }}>this tree goes into your forest. fresh seed, fresh start.</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={doRebirth} style={[s.btn, { backgroundColor: C.green }]}><Text style={s.btnText}>new seed</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowRebirth(false)} style={s.btnOutline}><Text style={{ fontSize: 12, color: C.brown, fontFamily: F.b }}>keep this one</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 8, width: '100%', maxWidth: 300 }}>
              <TouchableOpacity onPress={() => { setStruggling(true); setStruggleMode('menu'); setGroundStep(0); }}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 2, borderColor: C.orange, alignItems: 'center' }}>
                <Text style={{ fontFamily: F.h, fontSize: 15, color: C.orange }}>i'm struggling</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowERP(true)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 2, borderColor: C.green, alignItems: 'center' }}>
                <Text style={{ fontFamily: F.h, fontSize: 15, color: C.green }}>do an exposure</Text>
              </TouchableOpacity>
            </View>

            {data.forest > 0 && <Text style={{ fontSize: 11, color: C.brownFade, fontFamily: F.b }}>{data.forest} tree{data.forest !== 1 ? 's' : ''} in your forest</Text>}
            <Text style={{ fontFamily: F.h, fontSize: 13, color: C.brownFade, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 20, paddingBottom: 12, lineHeight: 18 }}>{quote}</Text>
          </ScrollView>
          </View>
        )}

        {/* ═══ JOURNEY TAB ═══ */}
        {view === 'journey' && (
          <ScrollView contentContainerStyle={{ gap: 18, paddingHorizontal: 16, paddingBottom: 20 }}>
            <View>
              <Text style={{ fontFamily: F.h, fontSize: 20, color: C.green, marginBottom: 8 }}>last 35 days</Text>
              <Cal log={data.log} />
            </View>
            <View>
              <Text style={{ fontFamily: F.h, fontSize: 20, color: C.green, marginBottom: 8 }}>what you resist most</Text>
              <Insights log={data.log} allC={allCompulsions} />
            </View>
            <View>
              <Text style={{ fontFamily: F.h, fontSize: 20, color: C.green, marginBottom: 8 }}>exposure sessions</Text>
              <ERPHistory sessions={data.erp} allC={allCompulsions} />
            </View>
            <View>
              <Text style={{ fontFamily: F.h, fontSize: 20, color: C.green, marginBottom: 8 }}>your forest</Text>
              {trees.length === 0 ? (
                <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 18 }}>
                  <Text style={{ fontSize: 13, color: C.brownFade, textAlign: 'center', fontFamily: F.b }}>grow a tree to full bloom and it shows up here.</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {trees.map((t, i) => (
                    <View key={i} style={{ alignItems: 'center', gap: 2 }}>
                      <Text style={{ fontSize: 30 }}>🌳</Text>
                      <Text style={{ fontSize: 10, color: C.brownLight, fontFamily: F.b }}>{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 14 }}>
              <Text style={{ fontFamily: F.h, fontSize: 20, color: C.green, marginBottom: 8 }}>the big picture</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {[['resisted', data.total], ['best streak', data.best], ['trees', trees.length], ['exposures', (data.erp || []).length]].map(([l, v]) => (
                  <View key={l} style={{ alignItems: 'center', paddingVertical: 6, overflow: 'visible' }}>
                    <Text style={{ fontFamily: F.h, fontSize: 22, color: C.green, lineHeight: 32 }}>{v}</Text>
                    <Text style={{ fontSize: 10, color: C.brownLight, fontFamily: F.b }}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {/* ═══ DISCOVER TAB ═══ */}
        {view === 'ai' && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top + 80}>
            <View style={{ flex: 1, paddingHorizontal: 16 }}>
              {aiMessages.length > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 4 }}>
                  <TouchableOpacity onPress={() => { setAiMessages([]); setAiInput(''); }}
                    style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12 }}>
                    <Text style={{ fontSize: 11, color: C.brownFade, fontFamily: F.b }}>start over</Text>
                  </TouchableOpacity>
                </View>
              )}
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 9, paddingVertical: 4 }}
                ref={chatScrollRef} onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}>
                {aiMessages.length === 0 && (
                  <View style={{ gap: 10, paddingVertical: 6 }}>
                    <Text style={{ fontFamily: F.h, fontSize: 18, color: C.brown, lineHeight: 24 }}>hey. so OCD looks different for everyone, and sometimes it's hard to tell what's a compulsion and what's just... life.</Text>
                    <Text style={{ fontFamily: F.h, fontSize: 18, color: C.brown, lineHeight: 24 }}>tell me what's bugging you and i'll help you name the pattern.</Text>
                    <View style={{ gap: 7, marginTop: 2 }}>
                      {['I keep checking things over and over', 'I get stuck in my head a lot', 'I avoid certain situations', 'I had a thought that scared me'].map(ss => (
                        <TouchableOpacity key={ss} onPress={() => sendAiMessage(ss)}
                          style={{ paddingVertical: 9, paddingHorizontal: 13, borderRadius: 16, borderWidth: 2, borderColor: C.border, backgroundColor: C.card }}>
                          <Text style={{ fontSize: 12, color: C.brown, fontFamily: F.b }}>{ss}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                {aiMessages.map((m, i) => (
                  <View key={i} style={{
                    maxWidth: '82%', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 18, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: m.role === 'user' ? C.green : C.card,
                    borderBottomRightRadius: m.role === 'user' ? 4 : 18, borderBottomLeftRadius: m.role === 'assistant' ? 4 : 18,
                  }}>
                    <Text style={{ fontSize: 13, fontFamily: F.b, lineHeight: 19, color: m.role === 'user' ? '#fff' : C.brown }}>{m.content}</Text>
                  </View>
                ))}
                {aiLoading && (
                  <View style={{ maxWidth: '82%', padding: 12, borderRadius: 18, backgroundColor: C.card, alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 13, fontFamily: F.b, color: C.brownLight }}>thinking...</Text>
                  </View>
                )}
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 8 }}>
                <TextInput value={aiInput} onChangeText={setAiInput} onSubmitEditing={() => sendAiMessage()}
                  placeholder="what's on your mind..." placeholderTextColor={C.brownFade}
                  style={[s.input, { flex: 1, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9 }]} />
                <TouchableOpacity onPress={() => sendAiMessage()} disabled={aiLoading}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>↑</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* Flowers overlay — pinned to bottom of content area for setup & grow tabs */}
        {(view === 'setup' || view === 'home') && (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, overflow: 'hidden' }} pointerEvents="none">
            {[
              { bottom: 4, left: 8, s: 34, r: -15, o: 0.3 },
              { bottom: 18, left: 60, s: 24, r: 22, o: 0.22 },
              { bottom: 2, left: '28%', s: 28, r: -8, o: 0.25 },
              { bottom: 14, left: '42%', s: 20, r: 30, o: 0.18 },
              { bottom: 6, left: '55%', s: 32, r: -20, o: 0.28 },
              { bottom: 20, right: 70, s: 22, r: 15, o: 0.2 },
              { bottom: 3, right: 15, s: 36, r: 10, o: 0.3 },
              { bottom: 12, right: '35%', s: 18, r: -30, o: 0.16 },
              { bottom: 22, left: '18%', s: 16, r: 40, o: 0.14 },
              { bottom: 0, right: '22%', s: 26, r: -5, o: 0.24 },
            ].map((p, i) => (
              <Image key={i} source={FLOWER_IMG}
                style={{ position: 'absolute', bottom: p.bottom, left: p.left, right: p.right,
                  width: p.s, height: p.s, resizeMode: 'contain', opacity: p.o,
                  transform: [{ rotate: `${p.r}deg` }] }} />
            ))}
          </View>
        )}
      </View>

      {/* ══════════════════════ MODALS ══════════════════════ */}

      {/* Struggling */}
      <Modal visible={struggling} transparent animationType="fade" onRequestClose={() => setStruggling(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setStruggling(false)}>
          <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}
            style={[s.modalCard, { paddingTop: 32 }]}>
            <TouchableOpacity onPress={() => setStruggling(false)} style={s.modalClose}>
              <Text style={{ fontSize: 22, color: C.brownFade }}>×</Text></TouchableOpacity>
            <ScrollView contentContainerStyle={{ gap: 12, alignItems: 'center' }}>
              {struggleMode === 'menu' && (<>
                <Text style={{ fontFamily: F.h, fontSize: 22, color: C.green, textAlign: 'center' }}>hey. you're okay.</Text>
                <Text style={{ fontSize: 13, color: C.brownLight, textAlign: 'center', lineHeight: 20, fontFamily: F.b }}>{struggleMsg}</Text>
                {data.streak > 0 && (
                  <View style={{ backgroundColor: C.card, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' }}>
                    <Text style={{ fontFamily: F.h, fontSize: 18, color: C.green }}>{data.streak} day streak.</Text>
                    <Text style={{ fontSize: 11, color: C.brownLight, fontFamily: F.b }}>don't let this moment take that from you.</Text>
                  </View>
                )}
                {[{ icon: '🌬', label: 'breathe with me', mode: 'breathe' }, { icon: '🌍', label: 'ground yourself', mode: 'ground' }, { icon: '⏱', label: 'ride the urge', mode: 'urge' }].map(opt => (
                  <TouchableOpacity key={opt.mode} onPress={() => { setStruggleMode(opt.mode); if (opt.mode === 'ground') setGroundStep(0); }}
                    style={{ width: '100%', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, borderWidth: 2, borderColor: C.border,
                      backgroundColor: C.card, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 18 }}>{opt.icon}</Text>
                    <Text style={{ fontSize: 14, color: C.brown, fontFamily: F.b }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </>)}
              {struggleMode === 'breathe' && (<>
                <TouchableOpacity onPress={() => setStruggleMode('menu')}>
                  <Text style={{ fontSize: 13, color: C.brownFade, fontFamily: F.b, alignSelf: 'flex-start' }}>{'← back'}</Text></TouchableOpacity>
                <Text style={{ fontFamily: F.h, fontSize: 15, color: C.brown, textAlign: 'center' }}>in through your nose, out through your mouth</Text>
                <Breathing />
              </>)}
              {struggleMode === 'ground' && (<>
                <TouchableOpacity onPress={() => setStruggleMode('menu')}>
                  <Text style={{ fontSize: 13, color: C.brownFade, fontFamily: F.b, alignSelf: 'flex-start' }}>{'← back'}</Text></TouchableOpacity>
                <Text style={{ fontFamily: F.h, fontSize: 20, color: C.green, textAlign: 'center' }}>{groundStep + 1} of 5</Text>
                <Text style={{ fontFamily: F.h, fontSize: 18, color: C.brown, textAlign: 'center', lineHeight: 24 }}>{GROUNDING_STEPS[groundStep]}</Text>
                <Text style={{ fontSize: 12, color: C.brownFade, fontFamily: F.b }}>no rush.</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {groundStep > 0 && <TouchableOpacity onPress={() => setGroundStep(groundStep - 1)} style={s.btnOutline}>
                    <Text style={{ fontSize: 14, color: C.brown, fontFamily: F.b }}>back</Text></TouchableOpacity>}
                  {groundStep < 4 ? (
                    <TouchableOpacity onPress={() => setGroundStep(groundStep + 1)} style={[s.btn, { backgroundColor: C.green }]}>
                      <Text style={s.btnText}>next</Text></TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => setStruggling(false)} style={[s.btn, { backgroundColor: C.green }]}>
                      <Text style={s.btnText}>that helped</Text></TouchableOpacity>
                  )}
                </View>
              </>)}
              {struggleMode === 'urge' && <UrgeTimer onBack={() => setStruggleMode('menu')} onDone={() => setStruggling(false)} />}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ERP */}
      <Modal visible={showERP} transparent animationType="fade" onRequestClose={() => setShowERP(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowERP(false)}>
          <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}
            style={[s.modalCard, { paddingTop: 32, maxHeight: '85%' }]}>
            <TouchableOpacity onPress={() => setShowERP(false)} style={s.modalClose}>
              <Text style={{ fontSize: 22, color: C.brownFade }}>×</Text></TouchableOpacity>
            <ERPSession onClose={() => setShowERP(false)} onComplete={completeERP} compulsions={activeList} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Overuse warning */}
      <Modal visible={overuseWarn} transparent animationType="fade" onRequestClose={() => setOveruseWarn(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setOveruseWarn(false)}>
          <View style={[s.modalCard, { alignItems: 'center', maxWidth: 300 }]}>
            <Text style={{ fontFamily: F.h, fontSize: 20, color: C.orange, marginBottom: 8 }}>gentle heads up</Text>
            <Text style={{ fontSize: 13, color: C.brownLight, textAlign: 'center', lineHeight: 20, marginBottom: 14, fontFamily: F.b }}>you've logged a lot today. that's not a bad thing, but keep an eye on it. this app is a tool, not a ritual. you don't need to track perfectly.</Text>
            <TouchableOpacity onPress={() => setOveruseWarn(false)} style={[s.btn, { backgroundColor: C.green }]}>
              <Text style={s.btnText}>got it</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Level up */}
      <Modal visible={!!showLevelUp} transparent animationType="fade">
        <View style={[s.modalOverlay, { backgroundColor: 'rgba(90,143,90,0.12)' }]} pointerEvents="none">
          <View style={[s.modalCard, { alignItems: 'center', maxWidth: 280, shadowOpacity: 0.15 }]}>
            <Text style={{ fontFamily: F.h, fontSize: 28, color: C.green, marginBottom: 4 }}>your plant grew!</Text>
            <Text style={{ fontSize: 15, color: C.brownLight, fontFamily: F.h }}>{showLevelUp}</Text>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════ TAB BAR ══════════════════════ */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 5,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 10, backgroundColor: C.bg, borderTopWidth: 2, borderTopColor: C.cardAlt }}>
        {[{ id: 'setup', icon: '🌸', label: 'my ocd' }, { id: 'home', icon: '🌱', label: 'grow' },
          { id: 'journey', icon: '📅', label: 'journey' }, { id: 'ai', icon: '💬', label: 'discover' }].map(t => (
          <TouchableOpacity key={t.id} onPress={() => setView(t.id)}
            style={{ alignItems: 'center', gap: 2, paddingVertical: 3, paddingHorizontal: 12 }}>
            <Text style={{ fontSize: 19 }}>{t.icon}</Text>
            <Text style={{ fontSize: 10, color: view === t.id ? C.green : C.brownFade, fontFamily: F.b }}>{t.label}</Text>
            {view === t.id && <View style={{ width: 18, height: 3, borderRadius: 2, backgroundColor: C.green, marginTop: -1 }} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ──────────────────────────── STYLES ────────────────────────────
const s = StyleSheet.create({
  btn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontFamily: 'Caveat_600SemiBold', fontSize: 16 },
  btnOutline: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: '#DDD0BE', alignItems: 'center' },
  input: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 14, borderWidth: 2, borderColor: '#DDD0BE', backgroundColor: '#FFF8F0',
    fontFamily: 'ComingSoon_400Regular', fontSize: 13, color: '#4A3728' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(74,55,40,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF8F0', borderRadius: 24, padding: 24, width: '100%', maxWidth: 340,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 10 },
  modalClose: { position: 'absolute', top: 10, right: 12, zIndex: 10, padding: 4 },
});
