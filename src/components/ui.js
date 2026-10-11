import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, Modal, Animated, Switch, TextInput, Platform,
  KeyboardAvoidingView, AccessibilityInfo, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, F, R, S, T, shadow, shadowStrong, MAX_WIDTH } from '../theme';
import { tap } from '../lib/haptics';

export const Icon = ({ name, size = 22, color = C.ink, style }) => <Ionicons name={name} size={size} color={color} style={style} />;

export const Txt = ({ v = 'body', style, children, ...rest }) => (
  <Text style={[T[v], style]} maxFontSizeMultiplier={1.6} {...rest}>{children}</Text>
);

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then(v => alive && setReduced(!!v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', v => setReduced(!!v));
    return () => { alive = false; sub?.remove?.(); };
  }, []);
  return reduced;
}

// ── Buttons ──────────────────────────────────────────────────────────────────
const BTN = {
  primary: { bg: C.green, fg: C.white, border: C.green },
  water: { bg: C.water, fg: C.white, border: C.water },
  sun: { bg: C.sun, fg: C.white, border: C.sun },
  secondary: { bg: C.surface, fg: C.ink, border: C.border },
  outline: { bg: 'transparent', fg: C.green, border: C.green },
  ghost: { bg: 'transparent', fg: C.inkSoft, border: 'transparent' },
  danger: { bg: C.dangerSoft, fg: C.danger, border: C.dangerSoft },
};

export function Button({ title, onPress, variant = 'primary', icon, iconRight, disabled, size = 'md', style, textStyle, accessibilityHint, haptic = true, full = true }) {
  const v = BTN[variant];
  const pad = size === 'lg' ? 18 : size === 'sm' ? 9 : 14;
  return (
    <Pressable
      onPress={() => { if (disabled) return; if (haptic) tap(); onPress?.(); }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [{
        backgroundColor: v.bg, borderColor: v.border, borderWidth: 2, borderRadius: R.pill,
        paddingVertical: pad, paddingHorizontal: size === 'sm' ? 14 : 22,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        alignSelf: full ? 'stretch' : 'center',
        opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed && !disabled ? 0.97 : 1 }],
        minHeight: 44,
      }, (variant === 'primary' || variant === 'water') && !disabled ? shadow : null, style]}
    >
      {icon ? <Icon name={icon} size={size === 'sm' ? 18 : 21} color={v.fg} /> : null}
      <Text style={[T.button, { color: v.fg, fontSize: size === 'lg' ? 18 : size === 'sm' ? 14.5 : 16 }, textStyle]} maxFontSizeMultiplier={1.4}>{title}</Text>
      {iconRight ? <Icon name={iconRight} size={18} color={v.fg} /> : null}
    </Pressable>
  );
}

export function IconButton({ name, onPress, label, color = C.inkSoft, size = 24, style }) {
  return (
    <Pressable onPress={() => { tap(); onPress?.(); }} accessibilityRole="button" accessibilityLabel={label} hitSlop={10}
      style={({ pressed }) => [{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? C.cardAlt : 'transparent' }, style]}>
      <Icon name={name} size={size} color={color} />
    </Pressable>
  );
}

export function LinkText({ title, onPress, color = C.green, style, icon }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: pressed ? 0.6 : 1, paddingVertical: 6 }, style]}>
      {icon ? <Icon name={icon} size={16} color={color} /> : null}
      <Text style={[T.small, { color, fontFamily: F.bodyBold }]}>{title}</Text>
    </Pressable>
  );
}

// ── Surfaces ─────────────────────────────────────────────────────────────────
export const Card = ({ children, style, tone = 'card', onPress, accessibilityLabel }) => {
  const bg = { card: C.card, surface: C.surface, green: C.greenTint, water: C.waterSoft, sun: C.sunSoft, danger: C.dangerSoft }[tone];
  const base = [{ backgroundColor: bg, borderRadius: R.lg, padding: S.md }, tone === 'surface' ? shadow : null, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      {children}
    </Pressable>
  );
};

export const SectionTitle = ({ children, right, style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.xs, marginTop: S.xs }, style]}>
    <Txt v="h2" style={{ color: C.green }} accessibilityRole="header">{children}</Txt>
    {right}
  </View>
);

export function Screen({ children, scroll = true, contentStyle, header, keyboard = false }) {
  const insets = useSafeAreaInsets();
  const inner = scroll ? (
    <ScrollView contentContainerStyle={[{ paddingHorizontal: S.md, paddingBottom: S.xxxl + 40, gap: S.md }, contentStyle]}
      keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : <View style={[{ flex: 1, paddingHorizontal: S.md }, contentStyle]}>{children}</View>;
  const body = (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      {header}
      {inner}
    </View>
  );
  if (!keyboard) return body;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{body}</KeyboardAvoidingView>;
}

export function ScreenHeader({ title, subtitle, right }) {
  return (
    <View style={{ paddingHorizontal: S.md, paddingTop: S.xs, paddingBottom: S.sm, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>
        <Txt v="h1" style={{ color: C.green }} accessibilityRole="header">{title}</Txt>
        {subtitle ? <Txt v="small" style={{ marginTop: -2 }}>{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

// ── Inputs ───────────────────────────────────────────────────────────────────
export function Chip({ label, selected, onPress, icon, small, onRemove, tone = 'green' }) {
  const on = tone === 'water' ? C.water : C.green;
  return (
    <Pressable onPress={() => { tap(); onPress?.(); }} accessibilityRole="button" accessibilityState={{ selected: !!selected }} accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: small ? 7 : 10, paddingHorizontal: small ? 12 : 15, borderRadius: R.pill,
        backgroundColor: selected ? on : C.surface, borderWidth: 2, borderColor: selected ? on : C.border,
        transform: [{ scale: pressed ? 0.96 : 1 }], minHeight: 40,
      })}>
      {selected ? <Icon name="checkmark" size={16} color={C.white} /> : icon ? <Icon name={icon} size={16} color={C.inkSoft} /> : null}
      <Text style={{ fontFamily: F.bodySemi, fontSize: small ? 14 : 15, color: selected ? C.white : C.ink }} maxFontSizeMultiplier={1.4}>{label}</Text>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={`remove ${label}`}>
          <Icon name="close" size={16} color={selected ? C.white : C.inkMuted} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export const ChipWrap = ({ children, center, style }) => (
  <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: center ? 'center' : 'flex-start' }, style]}>{children}</View>
);

export const Input = React.forwardRef(function Input({ style, ...props }, ref) {
  return (
    <TextInput ref={ref} placeholderTextColor={C.placeholder} maxFontSizeMultiplier={1.4}
      style={[{ fontFamily: F.body, fontSize: 16, color: C.ink, backgroundColor: C.surface, borderWidth: 2, borderColor: C.border,
        borderRadius: R.md, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10, minHeight: 48 }, style]}
      {...props} />
  );
});

// 0–10 (or 0–100 in steps of 10) rating row. Large tap targets, labelled ends.
export function Scale({ value, onChange, max = 10, step = 1, lowLabel = 'none', highLabel = 'extreme', color = C.sun, label }) {
  const { width } = useWindowDimensions();
  const n = Math.round(max / step) + 1;
  const avail = Math.min(width, MAX_WIDTH) - 2 * S.md - 2 * S.md;
  const size = Math.max(26, Math.min(40, Math.floor((avail - (n - 1) * 4) / n)));
  return (
    <View accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ min: 0, max, now: value ?? undefined }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={e => {
        const cur = value ?? 0;
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(max, cur + step));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(0, cur - step));
      }}>
      <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
        {Array.from({ length: n }, (_, i) => i * step).map(v => {
          const on = value === v;
          return (
            <Pressable key={v} onPress={() => { tap(); onChange(v); }} accessibilityRole="button" accessibilityLabel={`${v}`}
              style={{ width: size, height: size + 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                backgroundColor: on ? color : C.surface, borderWidth: 2, borderColor: on ? color : C.border }}>
              <Text style={{ fontFamily: F.bodyBold, fontSize: size > 32 ? 15 : 13, color: on ? C.white : C.inkSoft }}>{step === 10 ? v / 10 : v}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 2 }}>
        <Txt v="caption">{lowLabel}</Txt>
        <Txt v="caption">{highLabel}</Txt>
      </View>
    </View>
  );
}

export function ToggleRow({ title, subtitle, value, onChange, icon, disabled }) {
  return (
    <Pressable onPress={() => !disabled && onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: !!value, disabled: !!disabled }} accessibilityLabel={title}
      style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.sm, opacity: disabled ? 0.5 : 1 }}>
      {icon ? <Icon name={icon} size={22} color={C.green} /> : null}
      <View style={{ flex: 1 }}>
        <Txt v="h3" style={{ fontSize: 16 }}>{title}</Txt>
        {subtitle ? <Txt v="small">{subtitle}</Txt> : null}
      </View>
      <Switch value={!!value} onValueChange={onChange} disabled={disabled}
        trackColor={{ false: C.cardAlt, true: C.green }} thumbColor={C.white} activeThumbColor={C.white} ios_backgroundColor={C.cardAlt} />
    </Pressable>
  );
}

export function Row({ icon, title, subtitle, onPress, right, danger }) {
  return (
    <Pressable onPress={() => { tap(); onPress?.(); }} accessibilityRole="button" accessibilityLabel={title}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.sm, opacity: pressed ? 0.6 : 1, minHeight: 48 })}>
      {icon ? <Icon name={icon} size={22} color={danger ? C.danger : C.green} /> : null}
      <View style={{ flex: 1 }}>
        <Txt v="h3" style={{ fontSize: 16, color: danger ? C.danger : C.ink }}>{title}</Txt>
        {subtitle ? <Txt v="small">{subtitle}</Txt> : null}
      </View>
      {right !== undefined ? right : <Icon name="chevron-forward" size={18} color={C.inkMuted} />}
    </Pressable>
  );
}

export const Divider = () => <View style={{ height: 1.5, backgroundColor: C.cardAlt, marginVertical: 2 }} />;

// ── Sheet (bottom sheet on phones, centred card on wide screens) ────────────
export function Sheet({ visible, onClose, children, title, dismissable = true, full = false, scroll = true }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width > 640;
  const y = useRef(new Animated.Value(60)).current;
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      y.setValue(60); o.setValue(0);
      Animated.parallel([
        Animated.spring(y, { toValue: 0, useNativeDriver: Platform.OS !== 'web', friction: 9, tension: 70 }),
        Animated.timing(o, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    }
  }, [visible]);
  const body = scroll ? (
    <ScrollView contentContainerStyle={{ padding: S.lg, paddingTop: S.xs, paddingBottom: S.lg + (wide ? 0 : insets.bottom), gap: S.md }}
      keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : <View style={{ flex: full ? 1 : undefined, padding: S.lg, paddingTop: S.xs, paddingBottom: S.lg + insets.bottom }}>{children}</View>;
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => dismissable && onClose?.()} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={{ flex: 1, backgroundColor: C.overlay, opacity: o, justifyContent: wide ? 'center' : 'flex-end', alignItems: 'center' }}>
          <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => dismissable && onClose?.()} accessibilityLabel="dismiss" accessibilityRole="button" />
          <Animated.View accessibilityViewIsModal
            style={[{
              width: '100%', maxWidth: wide ? 480 : MAX_WIDTH, backgroundColor: C.bg,
              borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, borderBottomLeftRadius: wide ? R.xl : 0, borderBottomRightRadius: wide ? R.xl : 0,
              maxHeight: wide ? height * 0.88 : height - insets.top - 24, height: full ? (wide ? height * 0.88 : height - insets.top - 24) : undefined,
              transform: [{ translateY: y }],
            }, shadowStrong]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.lg, paddingTop: S.sm, minHeight: 52 }}>
              {!wide ? <View style={{ position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center' }}><View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: C.border }} /></View> : null}
              <View style={{ flex: 1, paddingTop: 8 }}>{title ? <Txt v="h2" style={{ color: C.green }} accessibilityRole="header">{title}</Txt> : null}</View>
              {dismissable ? <IconButton name="close" label="close" onPress={onClose} style={{ marginRight: -10, marginTop: 4 }} /> : null}
            </View>
            {body}
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Little bits ──────────────────────────────────────────────────────────────
export function ProgressBar({ pct, color = C.green, height = 10, label }) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={{ height, borderRadius: height, backgroundColor: C.cardAlt, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(4, Math.min(100, pct * 100))}%`, height: '100%', borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

export const Stat = ({ value, label, color = C.green }) => (
  <View style={{ alignItems: 'center', flex: 1 }} accessible accessibilityLabel={`${value} ${label}`}>
    <Text style={[T.stat, { color }]}>{value}</Text>
    <Txt v="caption" style={{ textAlign: 'center' }}>{label}</Txt>
  </View>
);

export const Pill = ({ text, tone = 'green', icon, center }) => {
  const map = { green: [C.greenSoft, C.greenDark], water: [C.waterSoft, C.waterDark], sun: [C.sunSoft, C.sun], muted: [C.cardAlt, C.inkSoft] };
  const [bg, fg] = map[tone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: center ? 'center' : 'flex-start', backgroundColor: bg, borderRadius: R.pill, paddingVertical: 4, paddingHorizontal: 10 }}>
      {icon ? <Icon name={icon} size={13} color={fg} /> : null}
      <Text style={{ fontFamily: F.bodyBold, fontSize: 12.5, color: fg }}>{text}</Text>
    </View>
  );
};
