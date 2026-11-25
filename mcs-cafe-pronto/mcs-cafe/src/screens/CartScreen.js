import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/db';
import { Button, Card, Chip, Empty, Input, ProductArt, Title } from '../components/ui';
import { colors, spacing, radius, brl, COUPONS, DELIVERY_FEE } from '../theme';

export default function CartScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { items, change, clear, subtotal } = useCart();
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState('');
  const [payment, setPayment] = useState('pix');
  const [delivery, setDelivery] = useState(false);
  const [address, setAddress] = useState(profile.address || '');
  const [busy, setBusy] = useState(false);

  const rate = COUPONS[applied] || 0;
  const discount = subtotal * rate;
  const fee = delivery ? DELIVERY_FEE : 0;
  const total = subtotal - discount + fee;

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (COUPONS[code]) { setApplied(code); } else { setApplied(''); Alert.alert('Cupom inválido'); }
  };

  const finish = async () => {
    if (delivery && !address.trim()) return Alert.alert('Informe o endereço de entrega');
    setBusy(true);
    try {
      await createOrder({
        uid: user.uid,
        customerName: profile.name,
        items: items.map(({ id, name, price, qty, category }) => ({ productId: id, name, price, qty, category })),
        subtotal, discount, fee, total, payment, coupon: applied,
        delivery, address: delivery ? address.trim() : '',
      });
      clear();
      setApplied(''); setCoupon('');
      Alert.alert('Pedido enviado ☕', 'Acompanhe o andamento na aba Pedidos.');
      navigation.navigate('Pedidos');
    } catch (e) {
      Alert.alert('Erro ao enviar o pedido');
    }
    setBusy(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Title style={{ marginBottom: spacing.md }}>Carrinho</Title>
        {items.length === 0 ? (
          <Empty emoji="🛒" title="Seu carrinho está vazio" hint="Escolha algo gostoso no cardápio." />
        ) : (
          <>
            {items.map((i) => (
              <Card key={i.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 12 }}>
                <ProductArt p={i} size={64} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.cream, fontWeight: '700' }} numberOfLines={1}>{i.name}</Text>
                  <Text style={{ color: colors.gold, fontWeight: '800', marginTop: 2 }}>{brl(i.price * i.qty)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable onPress={() => change(i.id, -1)} style={{ width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.cream, fontSize: 20, fontWeight: '800' }}>−</Text>
                  </Pressable>
                  <Text style={{ color: colors.cream, width: 30, textAlign: 'center', fontWeight: '700' }}>{i.qty}</Text>
                  <Pressable onPress={() => change(i.id, 1)} style={{ width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.cream, fontSize: 20, fontWeight: '800' }}>+</Text>
                  </Pressable>
                </View>
              </Card>
            ))}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.sm, alignItems: 'flex-end' }}>
              <Input style={{ flex: 0 }} label="Cupom" value={coupon} onChangeText={setCoupon} autoCapitalize="characters" placeholder="MCS10" />
              <Button title="Aplicar" variant="ghost" onPress={applyCoupon} style={{ marginBottom: spacing.md }} />
            </View>

            <Text style={{ color: colors.muted, fontWeight: '600', marginBottom: 8 }}>Recebimento</Text>
            <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
              <Chip label="🏪 Retirada" active={!delivery} onPress={() => setDelivery(false)} />
              <Chip label={`🛵 Entrega · ${brl(DELIVERY_FEE)}`} active={delivery} onPress={() => setDelivery(true)} />
            </View>
            {delivery && <Input label="Endereço" value={address} onChangeText={setAddress} placeholder="Rua, número, bairro" />}

            <Text style={{ color: colors.muted, fontWeight: '600', marginBottom: 8 }}>Pagamento</Text>
            <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
              {[['pix', 'Pix'], ['cartao', 'Cartão'], ['dinheiro', 'Dinheiro']].map(([k, l]) => (
                <Chip key={k} label={l} active={payment === k} onPress={() => setPayment(k)} />
              ))}
            </View>

            <Card>
              <Line label="Subtotal" value={brl(subtotal)} />
              {discount > 0 && <Line label={`Cupom ${applied}`} value={`− ${brl(discount)}`} color={colors.ok} />}
              <Line label="Entrega" value={delivery ? brl(fee) : 'Grátis'} />
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />
              <Line label="Total" value={brl(total)} big />
            </Card>

            <Button title="Finalizar pedido" onPress={finish} loading={busy} style={{ marginTop: spacing.md }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const Line = ({ label, value, big, color }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 }}>
    <Text style={{ color: big ? colors.cream : colors.muted, fontWeight: big ? '800' : '500', fontSize: big ? 18 : 14 }}>{label}</Text>
    <Text style={{ color: color || (big ? colors.gold : colors.cream), fontWeight: big ? '800' : '600', fontSize: big ? 20 : 14 }}>{value}</Text>
  </View>
);
