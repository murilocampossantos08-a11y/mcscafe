import React from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Image, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, shadow, catEmoji } from '../theme';

const tap = () => { try { Haptics.selectionAsync().catch(() => {}); } catch (e) {} };

export function Button({ title, onPress, variant = 'primary', loading, disabled, style }) {
  const v = {
    primary: { bg: colors.gold, fg: '#1A1208' },
    ghost: { bg: colors.card, fg: colors.cream },
    danger: { bg: '#3A1B1D', fg: colors.danger },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => { tap(); onPress && onPress(); }}
      style={({ pressed }) => [s.btn, { backgroundColor: v.bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]}>
      {loading ? <ActivityIndicator color={v.fg} /> : <Text style={[s.btnText, { color: v.fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Input({ label, error, style, ...props }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && <Text style={s.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        style={[s.input, error && { borderColor: colors.danger }, style]}
      />
      {error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

export const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;

export const Empty = ({ emoji = '☕', title, hint }) => (
  <View style={{ alignItems: 'center', padding: spacing.xl }}>
    <Text style={{ fontSize: 48 }}>{emoji}</Text>
    <Text style={{ fontSize: 17, fontWeight: '700', color: colors.cream, marginTop: spacing.sm }}>{title}</Text>
    {hint && <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 4 }}>{hint}</Text>}
  </View>
);

export const Chip = ({ label, active, onPress }) => (
  <Pressable
    onPress={() => { tap(); onPress && onPress(); }}
    style={[s.chip, active && { backgroundColor: colors.gold, borderColor: colors.gold }]}>
    <Text style={{ color: active ? '#1A1208' : colors.cream, fontWeight: '600' }}>{label}</Text>
  </Pressable>
);

export function ProductArt({ p, size = 96, style }) {
  const base = { width: size, height: size, borderRadius: radius.md };
  if (p.imageUrl) return <Image source={{ uri: p.imageUrl }} style={[base, style]} />;
  return (
    <View style={[base, { backgroundColor: colors.brown, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ fontSize: size * 0.45 }}>{catEmoji(p.category)}</Text>
    </View>
  );
}

export const Title = ({ children, style }) => (
  <Text style={[{ fontSize: 26, fontWeight: '800', color: colors.cream }, style]}>{children}</Text>
);

const s = StyleSheet.create({
  btn: { minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  btnText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: {
    minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    backgroundColor: colors.surface, paddingHorizontal: spacing.md, fontSize: 16, color: colors.cream,
  },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, ...shadow },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface, marginRight: 8,
  },
});
