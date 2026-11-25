import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeAllOrders, subscribeProducts, saveProduct, removeProduct, seedProducts } from '../services/db';
import { Button, Card, Chip, Empty, Input, ProductArt, Title } from '../components/ui';
import { colors, spacing, radius, brl, CATS } from '../theme';
import { SEED } from '../utils/seed';

const sameDay = (a, b) => a.toDateString() === b.toDateString();

function Kpi({ icon, label, value }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={{ color: colors.gold, fontSize: 20, fontWeight: '800', marginTop: 6 }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export function DashboardScreen() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => subscribeAllOrders(setOrders), []);
  useEffect(() => subscribeProducts(setProducts), []);

  const d = useMemo(() => {
    const today = new Date();
    const todays = orders.filter((o) => sameDay(o.date, today));
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - i));
      return { label: 'DSTQQSS'[day.getDay()], value: orders.filter((o) => sameDay(o.date, day)).reduce((s, o) => s + o.total, 0) };
    });
    return {
      count: todays.length,
      revenue: todays.reduce((s, o) => s + o.total, 0),
      sold: todays.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0),
      clients: new Set(orders.map((o) => o.uid)).size,
      running: orders.filter((o) => o.status === 'novo' || o.status === 'preparando').length,
      days,
      low: products.filter((p) => p.stock <= 5),
    };
  }, [orders, products]);

  const max = Math.max(...d.days.map((x) => x.value), 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
        <Title style={{ marginBottom: spacing.md }}>Painel</Title>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <Kpi icon="🧾" label="Pedidos hoje" value={String(d.count)} />
          <Kpi icon="💰" label="Faturamento hoje" value={brl(d.revenue)} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: spacing.md }}>
          <Kpi icon="☕" label="Produtos vendidos" value={String(d.sold)} />
          <Kpi icon="👥" label="Clientes" value={String(d.clients)} />
        </View>

        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.cream, fontWeight: '700', fontSize: 16, marginBottom: 14 }}>Faturamento · 7 dias</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 130 }}>
            {d.days.map((x, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                <View style={{ width: '60%', height: Math.max((x.value / max) * 100, x.value > 0 ? 4 : 0), backgroundColor: i === 6 ? colors.gold : colors.brownLight, borderRadius: 6 }} />
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>{x.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.cream, fontWeight: '700', fontSize: 16 }}>Pedidos em andamento</Text>
          <Text style={{ color: colors.gold, fontSize: 32, fontWeight: '800', marginTop: 6 }}>{d.running}</Text>
        </Card>

        <Card>
          <Text style={{ color: colors.cream, fontWeight: '700', fontSize: 16, marginBottom: 10 }}>Produtos acabando</Text>
          {d.low.length === 0 ? <Text style={{ color: colors.muted }}>Estoque em dia.</Text> : d.low.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: colors.cream }}>{p.name}</Text>
              <Text style={{ color: colors.danger, fontWeight: '700' }}>{p.stock} un.</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const blank = { name: '', category: 'Cafés', price: '', oldPrice: '', stock: '', description: '', ingredients: '', nutrition: '', imageUrl: '' };
const num = (v) => parseFloat(String(v).replace(',', '.'));

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeProducts(setProducts), []);

  const edit = (p) => setForm({
    id: p.id, name: p.name, category: p.category || 'Cafés', price: String(p.price), oldPrice: String(p.oldPrice || ''),
    stock: String(p.stock), description: p.description || '', ingredients: p.ingredients || '', nutrition: p.nutrition || '', imageUrl: p.imageUrl || '',
  });

  const save = async () => {
    const price = num(form.price);
    const stock = parseInt(form.stock || '0', 10);
    if (!form.name.trim() || isNaN(price) || price < 0) return Alert.alert('Informe nome e preço válidos');
    setBusy(true);
    try {
      await saveProduct({
        ...form, name: form.name.trim(), price, oldPrice: isNaN(num(form.oldPrice)) ? 0 : num(form.oldPrice),
        stock: isNaN(stock) ? 0 : stock, active: true,
      });
      setForm(null);
    } catch (e) { Alert.alert('Erro ao salvar'); }
    setBusy(false);
  };

  const del = () => Alert.alert('Excluir produto?', form.name, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: async () => { await removeProduct(form.id); setForm(null); } },
  ]);

  const seed = async () => {
    try { await seedProducts(SEED); } catch (e) { Alert.alert('Erro ao cadastrar o cardápio de exemplo'); }
  };

  const set = (k) => (v) => setForm({ ...form, [k]: v });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md }}>
        <Title>Produtos</Title>
        <Button title="+ Novo" onPress={() => setForm(blank)} style={{ minHeight: 44 }} />
      </View>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.md, paddingTop: 0, gap: 10, paddingBottom: 40 }}
        ListEmptyComponent={
          <View>
            <Empty title="Nenhum produto ainda" hint="Cadastre o primeiro ou carregue um cardápio de exemplo." />
            <Button title="Carregar cardápio de exemplo" variant="ghost" onPress={seed} />
          </View>
        }
        renderItem={({ item: p }) => (
          <Pressable onPress={() => edit(p)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
              <ProductArt p={p} size={56} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.cream, fontWeight: '700', fontSize: 16 }} numberOfLines={1}>{p.name}</Text>
                <Text style={{ color: p.stock <= 5 ? colors.danger : colors.muted, marginTop: 2 }}>{p.category} · {p.stock} un.</Text>
              </View>
              <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 16 }}>{brl(p.price)}</Text>
            </Card>
          </Pressable>
        )}
      />
      <Modal visible={!!form} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setForm(null)}>
        {form && (
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
            <ScrollView contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.cream, marginBottom: spacing.md }}>{form.id ? 'Editar produto' : 'Novo produto'}</Text>
              <Input label="Nome" value={form.name} onChangeText={set('name')} />
              <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 13, marginBottom: 6 }}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                {CATS.map((c) => <Chip key={c.k} label={`${c.e} ${c.k}`} active={form.category === c.k} onPress={() => set('category')(c.k)} />)}
              </ScrollView>
              <Input label="Preço (R$)" value={form.price} onChangeText={set('price')} keyboardType="decimal-pad" />
              <Input label="Preço antigo (opcional)" value={form.oldPrice} onChangeText={set('oldPrice')} keyboardType="decimal-pad" />
              <Input label="Estoque" value={form.stock} onChangeText={set('stock')} keyboardType="number-pad" />
              <Input label="Descrição" value={form.description} onChangeText={set('description')} multiline style={{ minHeight: 80, paddingTop: 12, textAlignVertical: 'top' }} />
              <Input label="Ingredientes" value={form.ingredients} onChangeText={set('ingredients')} />
              <Input label="Informações nutricionais" value={form.nutrition} onChangeText={set('nutrition')} />
              <Input label="Link da imagem (opcional)" value={form.imageUrl} onChangeText={set('imageUrl')} autoCapitalize="none" />
              <Button title="Salvar" onPress={save} loading={busy} />
              {form.id && <Button title="Excluir" variant="danger" onPress={del} style={{ marginTop: 10 }} />}
              <Button title="Cancelar" variant="ghost" onPress={() => setForm(null)} style={{ marginTop: 10 }} />
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}
