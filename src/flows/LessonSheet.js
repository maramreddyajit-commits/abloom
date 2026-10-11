import React, { useEffect } from 'react';
import { View } from 'react-native';
import { C, S } from '../theme';
import { Sheet, Txt, Button, Card, Icon, LinkText } from '../components/ui';
import { LESSONS } from '../content/lessons';
import { useStore } from '../state/store';
import { Linking } from 'react-native';
import { IOCDF_DIRECTORY } from '../content/copy';

export default function LessonSheet({ visible, onClose, lessonId }) {
  const { actions } = useStore();
  const idx = LESSONS.findIndex(l => l.id === lessonId);
  const lesson = LESSONS[idx];
  useEffect(() => { if (visible && lesson) actions.markLesson(lesson.id); }, [visible, lessonId]);
  if (!lesson) return null;
  return (
    <Sheet visible={visible} onClose={onClose} title={lesson.title}>
      <Txt v="label">day {idx + 1} of {LESSONS.length} · 1-minute read</Txt>
      {lesson.body.map((p, i) => <Txt key={i} v="body">{p}</Txt>)}
      <Card tone="green" style={{ flexDirection: 'row', gap: S.xs }}>
        <Icon name="sparkles-outline" size={20} color={C.green} />
        <View style={{ flex: 1 }}>
          <Txt v="h3">try this</Txt>
          <Txt v="small">{lesson.tryThis}</Txt>
        </View>
      </Card>
      {lesson.id === 'slips' ? <LinkText title="find an ERP therapist (IOCDF)" icon="open-outline" onPress={() => Linking.openURL(IOCDF_DIRECTORY).catch(() => {})} /> : null}
      <Button title="got it" onPress={onClose} />
    </Sheet>
  );
}
