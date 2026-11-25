import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { subscribeProducts, toggleFavorite } from '../services/db';
import { Card, Chip, Empty, ProductArt } from '../components/ui';
import { colors, spacing, radius, brl, CATS } from '../theme';

export default function HomeScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { add } = useCart();
  const [products, setProducts] = useState([]);
  const [cat, setCat] = useState('Todos');
  const [q, setQ] = useState('');

  useEffect(() => subscribeProducts(setProducts), []);

  const favs = profile.favorites || [];
  const shown = products.filter((p) =>
    p.active !== false &&
    (cat === 'Todos' || (cat === 'Favoritos' ? favs.includes(p.id) : p.category === cat)) &&
    p.name.toLowerCase().includes(q.toLowerCase()));

  const header = (
    <View>
      <Text style={{ color: colors.muted }}>Olá, {(profile.name || '').split(' ')[0]} ☕</Text>
      <View style={{ backgroundColor: colors.brown, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.brownLight }}>
        <Text style={{ color: colors.gold, fontWeight: '700', letterSpacing: 2, fontSize: 12 }}>MCS CAFÉ</Text>
        <Text style={{ color: colors.cream, fontSize: 24, fontWeight: '800', marginTop: 6 }}>Café feito para o seu momento.</Text>
        <Text style={{ color: '#D9C7B3', marginTop: 6 }}>Use o cupom MCS10 e ganhe 10% no primeiro pedido.</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, marginTop: spacing.md }}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Buscar no cardápio" placeholderTextColor={colors.muted}
          style={{ flex: 1, minHeight: 48, color: colors.cream, marginLeft: 8, fontSize: 16 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: spacing.md }}>
        <Chip label="Todos" active={cat === 'Todos'} onPress={() => setCat('Todos')} />
        {CATS.map((c) => <Chip key={c.k} label={`${c.e} ${c.k}`} active={cat === c.k} onPress={() => setCat(c.k)} />)}
        <Chip label="❤️ Favoritos" active={cat === 'Favoritos'} onPress={() => setCat('Favoritos')} />
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <FlatList
        data={shown}
        keyExtractor={(p) => p.id}
        numColumns={2}
        ListHeaderComponent={header}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: spacing.md, gap: 12, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Empty title="Nada por aqui" hint="Nenhum item encontrado neste filtro." />}
        renderItem={({ item: p }) => {
          const fav = favs.includes(p.id);
          return (
            <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('Produto', { id: p.id })}>
              <Card style={{ padding: 10 }}>
                <View>
                  <ProductArt p={p} size={100} style={{ width: '100%', height: 110 }} />
                  <Pressable
                    onPress={() => toggleFavorite(user.uid, p.id, !fav)}
                    hitSlop={10}
                    style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={fav ? 'heart' : 'heart-outline'} size={18} color={fav ? colors.danger : colors.cream} />
                  </Pressable>
                </View>
                <Text style={{ color: colors.cream, fontWeight: '700', fontSize: 15, marginTop: 10 }} numberOfLines={1}>{p.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2, minHeight: 30 }} numberOfLines={2}>{p.description}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 16 }}>{brl(p.price)}</Text>
                  <Pressable
                    disabled={p.stock <= 0}
                    onPress={() => add(p, 1)}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: p.stock <= 0 ? colors.border : colors.gold, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="add" size={22} color="#1A1208" />
                  </Pressable>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
