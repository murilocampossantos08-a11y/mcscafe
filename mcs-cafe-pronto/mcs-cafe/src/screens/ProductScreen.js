import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { subscribeProduct } from '../services/db';
import { Button, ProductArt } from '../components/ui';
import { colors, spacing, radius, brl } from '../theme';

export default function ProductScreen({ route, navigation }) {
  const { add } = useCart();
  const [p, setP] = useState(undefined);
  const [qty, setQty] = useState(1);

  useEffect(() => subscribeProduct(route.params.id, setP), [route.params.id]);

  if (p === undefined) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><ActivityIndicator color={colors.gold} size="large" /></View>;
  if (p === null) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: colors.cream }}>Produto indisponível.</Text></View>;

  const Row = ({ label, value }) => value ? (
    <View style={{ marginTop: spacing.md }}>
      <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>{label}</Text>
      <Text style={{ color: colors.cream, marginTop: 4, lineHeight: 21 }}>{value}</Text>
    </View>
  ) : null;

  const max = Math.max(p.stock, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView>
        <View>
          <ProductArt p={p} style={{ width: '100%', height: 300, borderRadius: 0 }} size={300} />
          <Pressable onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 16, left: 16, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={22} color={colors.cream} />
          </Pressable>
        </View>
        <View style={{ padding: spacing.lg, backgroundColor: colors.bg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, marginTop: -24 }}>
          <Text style={{ color: colors.cream, fontSize: 26, fontWeight: '800' }}>{p.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
            <Text style={{ color: colors.gold, fontSize: 24, fontWeight: '800' }}>{brl(p.price)}</Text>
            {p.oldPrice > p.price && <Text style={{ color: colors.muted, textDecorationLine: 'line-through', marginLeft: 10 }}>{brl(p.oldPrice)}</Text>}
          </View>
          <Text style={{ color: colors.muted, marginTop: spacing.md, lineHeight: 21 }}>{p.description}</Text>
          <Row label="INGREDIENTES" value={p.ingredients} />
          <Row label="INFORMAÇÕES NUTRICIONAIS" value={p.nutrition} />
        </View>
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md }}>
          <Pressable onPress={() => setQty(Math.max(1, qty - 1))} style={{ width: 44, height: 52, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="remove" size={20} color={colors.cream} />
          </Pressable>
          <Text style={{ color: colors.cream, fontWeight: '800', fontSize: 16, minWidth: 24, textAlign: 'center' }}>{qty}</Text>
          <Pressable onPress={() => setQty(Math.min(Math.max(max, 1), qty + 1))} style={{ width: 44, height: 52, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={20} color={colors.cream} />
          </Pressable>
        </View>
        <Button
          style={{ flex: 1 }}
          disabled={p.stock <= 0}
          title={p.stock <= 0 ? 'Indisponível' : `Adicionar · ${brl(p.price * qty)}`}
          onPress={() => { add(p, qty); navigation.goBack(); }}
        />
      </View>
    </SafeAreaView>
  );
}
