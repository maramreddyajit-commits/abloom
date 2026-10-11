// AI companion. Guardrails:
// - explicit consent before anything is sent (Apple 5.1.2(i))
// - crisis phrases show real resources immediately, before the AI replies
// - a "report" control on every reply (Google Play generative-AI policy)
// - a gentle pause when a chat gets long, because endless chatting can become reassurance-seeking
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Pressable, Text, Linking, Platform } from 'react-native';
import { C, F, R, S } from '../theme';
import { Screen, ScreenHeader, Txt, Button, Card, Icon, IconButton, Input, Chip, ChipWrap, Sheet, LinkText } from '../components/ui';
import CrisisCard from '../components/CrisisCard';
import { useStore } from '../state/store';
import { useFlows } from '../flows/FlowsProvider';
import { useToast } from '../components/Toast';
import { askCompanion, reportReply, aiConfigured } from '../lib/ai';
import { looksLikeCrisis } from '../content/crisis';
import { PRIVACY_URL } from '../content/copy';
import { track } from '../lib/analytics';

const SUGGESTIONS = [
  'is this a compulsion or just a habit?',
  'i keep replaying something i said',
  'i had a thought that scared me',
  'help me plan an exposure',
];
const SOFT_PAUSE = 10; // user messages before suggesting a break
const HARD_STOP = 24;
const REPORT_REASONS = ['it reassured me', 'unhelpful or wrong', 'upsetting or harmful', 'something else'];

export default function Talk() {
  const { data, actions } = useStore();
  const flows = useFlows();
  const toast = useToast();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [pauseDismissed, setPauseDismissed] = useState(false);
  const scroll = useRef(null);

  const userCount = msgs.filter(m => m.role === 'user').length;
  const showPause = userCount >= SOFT_PAUSE && !pauseDismissed && !loading;
  const stopped = userCount >= HARD_STOP;

  useEffect(() => { setTimeout(() => scroll.current?.scrollToEnd?.({ animated: true }), 60); }, [msgs.length, loading]);

  if (!data.settings.aiConsent) {
    return (
      <Screen header={<ScreenHeader title="talk it through" subtitle="an ai companion that knows ocd" />}>
        <Card tone="surface" style={{ gap: S.sm }}>
          <Txt v="h3">before you start</Txt>
          <Bullet icon="chatbubble-ellipses-outline" text="this chat uses Claude, an AI made by Anthropic. it can help you name compulsions and spot thinking traps." />
          <Bullet icon="cloud-upload-outline" text="what you type here is sent through abloom’s server to Anthropic to write a reply. abloom doesn’t store your chats, and they’re cleared when you leave this screen. nothing else from the app is shared." />
          <Bullet icon="eye-off-outline" text="please don’t include names, addresses or other details that identify you or anyone else." />
          <Bullet icon="hand-left-outline" text="it won’t reassure you, on purpose. reassurance feeds ocd." />
          <Bullet icon="medkit-outline" text="it isn’t a therapist and can make mistakes. in a crisis, use the help lines in “i’m struggling”." />
          <LinkText title="read the privacy policy" icon="open-outline" onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})} />
        </Card>
        <Button title="i understand, let’s talk" icon="checkmark" onPress={() => { actions.setSetting('aiConsent', true); track('ai_consent', { granted: true }); }} />
        <Txt v="caption" style={{ textAlign: 'center' }}>you can turn this off any time in “you”. everything else in abloom works without it.</Txt>
      </Screen>
    );
  }

  const send = async (text, retry = false) => {
    const content = (text ?? input).trim();
    if (!content || loading || stopped) return;
    if (!retry) setInput('');
    const base = msgs.filter(m => m.role !== 'error');
    const crisis = !retry && looksLikeCrisis(content);
    const next = retry ? base : [...base, { id: `u-${Date.now()}`, role: 'user', content }];
    setMsgs(crisis ? [...next, { id: `c-${Date.now()}`, role: 'crisis' }] : next);
    setLoading(true);
    if (!retry) track('ai_message', { crisis });
    const res = await askCompanion(next.filter(m => m.role === 'user' || m.role === 'assistant'));
    setLoading(false);
    if (res.error) {
      const msg = res.error === 'busy' ? 'the companion needs a short breather. try again in a minute.' : 'couldn’t connect just now. check your connection and try again?';
      setMsgs(m => [...m, { id: `e-${Date.now()}`, role: 'error', content: msg, retry: content }]);
      return;
    }
    setMsgs(m => {
      const out = [...m, { id: `a-${Date.now()}`, role: 'assistant', content: res.text }];
      if (res.crisis && !m.some(x => x.role === 'crisis')) out.push({ id: `c2-${Date.now()}`, role: 'crisis' });
      return out;
    });
  };

  return (
    <Screen scroll={false} keyboard contentStyle={{ paddingHorizontal: 0 }} header={
      <ScreenHeader title="talk it through" subtitle={aiConfigured() ? 'it helps you see the pattern, not feel certain' : 'companion coming soon'}
        right={msgs.length ? <IconButton name="refresh" label="start a new chat" onPress={() => { setMsgs([]); setPauseDismissed(false); }} /> : null} />
    }>
      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: S.md, paddingBottom: S.md, gap: S.sm }} keyboardShouldPersistTaps="handled">
        {msgs.length === 0 ? (
          <View style={{ gap: S.sm, paddingTop: S.xs }}>
            <Bubble role="assistant" content="hey. ocd looks different for everyone, and it can be hard to tell what’s a compulsion and what’s just life. tell me what’s going on and we can name the pattern together." />
            <Txt v="label" style={{ marginTop: S.xs }}>or start with</Txt>
            <View style={{ gap: S.xs }}>
              {SUGGESTIONS.map(s => <Chip key={s} label={s} onPress={() => send(s)} icon="chatbubble-outline" />)}
            </View>
          </View>
        ) : null}

        {msgs.map(m => {
          if (m.role === 'crisis') return <CrisisCard key={m.id} />;
          if (m.role === 'error') return (
            <Card key={m.id} tone="danger" style={{ gap: S.xs }}>
              <Txt v="small" style={{ color: C.ink }}>{m.content}</Txt>
              <LinkText title="try again" icon="refresh" color={C.danger} onPress={() => send(m.retry, true)} />
            </Card>
          );
          return <Bubble key={m.id} role={m.role} content={m.content} onReport={m.role === 'assistant' ? () => setReport(m) : null} />;
        })}

        {loading ? (
          <View style={{ alignSelf: 'flex-start', backgroundColor: C.surface, borderRadius: R.lg, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1.5, borderColor: C.cardAlt }}>
            <Txt v="small">thinking…</Txt>
          </View>
        ) : null}

        {showPause ? (
          <Card tone="water" style={{ gap: S.xs }}>
            <Txt v="h3">quick check-in</Txt>
            <Txt v="small" style={{ color: C.ink }}>we’ve been talking for a while. sometimes more talking quietly turns into another way of looking for certainty. want to ride the urge instead?</Txt>
            <Button title="ride the urge" variant="water" icon="flash" onPress={flows.openUrge} />
            <Button title="keep talking" variant="ghost" size="sm" onPress={() => setPauseDismissed(true)} />
          </Card>
        ) : null}
        {stopped ? (
          <Card style={{ gap: S.xs }}>
            <Txt v="h3">let’s pause this chat here</Txt>
            <Txt v="small">long chats tend to circle. take a break, and start a fresh one later if you need to.</Txt>
          </Card>
        ) : null}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: S.xs, paddingHorizontal: S.md, paddingVertical: S.xs, borderTopWidth: 1.5, borderTopColor: C.cardAlt, backgroundColor: C.bg }}>
        <Input value={input} onChangeText={setInput} placeholder={stopped ? 'start a new chat to continue' : 'what’s on your mind…'} editable={!stopped}
          style={{ flex: 1, borderRadius: R.pill, maxHeight: 120 }} multiline={Platform.OS !== 'web'} onSubmitEditing={() => send()} blurOnSubmit returnKeyType="send" maxLength={1500} accessibilityLabel="message" />
        <Pressable onPress={() => send()} disabled={!input.trim() || loading || stopped} accessibilityRole="button" accessibilityLabel="send"
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: input.trim() && !loading ? C.green : C.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrow-up" size={22} color={C.white} />
        </Pressable>
      </View>

      <Sheet visible={!!report} onClose={() => setReport(null)} title="report this reply">
        <Txt v="bodySoft">thanks for flagging it. what was wrong?</Txt>
        <ChipWrap>
          {REPORT_REASONS.map(r => <Chip key={r} label={r} onPress={() => {
            reportReply({ reply: report.content, reason: r });
            track('ai_report');
            setMsgs(ms => ms.map(x => (x.id === report.id ? { ...x, reported: true } : x)));
            setReport(null);
            toast.show({ text: 'reported. thank you, this helps make it safer.', icon: 'flag-outline' });
          }} />)}
        </ChipWrap>
      </Sheet>
    </Screen>
  );
}

function Bubble({ role, content, onReport }) {
  const me = role === 'user';
  return (
    <View style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '86%', gap: 2 }}>
      <View style={{ backgroundColor: me ? C.green : C.surface, borderRadius: R.lg, borderBottomRightRadius: me ? 6 : R.lg, borderBottomLeftRadius: me ? R.lg : 6,
        paddingVertical: 11, paddingHorizontal: 15, borderWidth: me ? 0 : 1.5, borderColor: C.cardAlt }}>
        <Text selectable style={{ fontFamily: F.body, fontSize: 16, lineHeight: 23, color: me ? C.white : C.ink }}>{content}</Text>
      </View>
      {onReport ? (
        <Pressable onPress={onReport} hitSlop={8} accessibilityRole="button" accessibilityLabel="report this reply" style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Icon name="flag-outline" size={12} color={C.inkMuted} />
          <Text style={{ fontFamily: F.bodySemi, fontSize: 12, color: C.inkMuted }}>report</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const Bullet = ({ icon, text }) => (
  <View style={{ flexDirection: 'row', gap: S.sm, alignItems: 'flex-start' }}>
    <Icon name={icon} size={20} color={C.green} style={{ marginTop: 1 }} />
    <Txt v="small" style={{ flex: 1, color: C.ink }}>{text}</Txt>
  </View>
);
