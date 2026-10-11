import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import { C, F, R, S, shadowStrong, MAX_WIDTH } from '../theme';
import { Icon } from './ui';

const ToastCtx = createContext({ show: () => {} });

export function ToastProvider({ children, bottomOffset = 90 }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const y = useRef(new Animated.Value(40)).current;
  const o = useRef(new Animated.Value(0)).current;
  const nd = Platform.OS !== 'web';

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(o, { toValue: 0, duration: 160, useNativeDriver: nd }),
      Animated.timing(y, { toValue: 40, duration: 160, useNativeDriver: nd }),
    ]).start(() => setToast(null));
  }, []);

  const show = useCallback(t => {
    clearTimeout(timer.current);
    setToast({ ...t, key: Date.now() });
    timer.current = setTimeout(hide, t.duration || 5000);
  }, [hide]);

  useEffect(() => {
    if (!toast) return;
    Animated.parallel([
      Animated.timing(o, { toValue: 1, duration: 180, useNativeDriver: nd }),
      Animated.spring(y, { toValue: 0, useNativeDriver: nd, friction: 8 }),
    ]).start();
  }, [toast?.key]);

  return (
    <ToastCtx.Provider value={{ show, hide }}>
      {children}
      {toast ? (
        <Animated.View pointerEvents="box-none" accessibilityLiveRegion="polite"
          style={{ position: 'absolute', left: 0, right: 0, bottom: bottomOffset, alignItems: 'center', opacity: o, transform: [{ translateY: y }] }}>
          <View style={[{ width: '92%', maxWidth: MAX_WIDTH - 32, backgroundColor: C.ink, borderRadius: R.lg, paddingVertical: S.sm, paddingHorizontal: S.md,
            flexDirection: 'row', alignItems: 'center', gap: S.sm }, shadowStrong]}>
            {toast.icon ? <Icon name={toast.icon} size={20} color={C.greenSoft} /> : null}
            <Text style={{ flex: 1, color: C.white, fontFamily: F.bodySemi, fontSize: 15, lineHeight: 20 }}>{toast.text}</Text>
            {toast.actionLabel ? (
              <Pressable onPress={() => { toast.onAction?.(); hide(); }} hitSlop={10} accessibilityRole="button" accessibilityLabel={toast.actionLabel}>
                <Text style={{ color: '#BFE0B4', fontFamily: F.bodyHeavy, fontSize: 15 }}>{toast.actionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
