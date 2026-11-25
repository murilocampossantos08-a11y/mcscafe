import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { subscribeMyOrders, subscribeAllOrders, setOrderStatus } from '../services/db';
import { Button, Card, Chip, Empty, Title } from '../components/ui';
import { colors, spacing, brl, STATUS, STATUS_COLOR, NEXT_STATUS } from '../theme';

const fmt = (d) => `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

export default function OrdersScreen() {
  const { user, profile } = useAuth();
  const staff = profile.role !== 'cliente';
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('todos');

  useEffect(() => (staff ? subscribeAllOrders(setOrders) : subscribeMyOrders(user.uid, setOrders)), [staff, user.uid]);

  const shown = orders.filter((o) => filter === 'todos' || o.status === filter);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ padding: spacing.md, paddingBottom: 0 }}>
        <Title>{staff ? 'Pedidos' : 'Meus pedidos'}</Title>
        {staff && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: spacing.md }}>
            <Chip label="Todos" active={filter === 'todos'} onPress={() => setFilter('todos')} />
            {Object.entries(STATUS).map(([k, l]) => <Chip key={k} label={l} active={filter === k} onPress={() => setFilter(k)} />)}
          </ScrollView>
        )}
      </View>
      <FlatList
        data={shown}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing.md, gap: 12, paddingBottom: 40 }}
        ListEmptyComponent={<Empty emoji="🧾" title="Nenhum pedido" hint={staff ? 'Os novos pedidos aparecem aqui.' : 'Faça seu primeiro pedido no cardápio.'} />}
        renderItem={({ item: o }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{fmt(o.date)}</Text>
              <View style={{ backgroundColor: STATUS_COLOR[o.status] + '33', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                <Text style={{ color: STATUS_COLOR[o.status], fontWeight: '700', fontSize: 12 }}>{STATUS[o.status]}</Text>
              </View>
            </View>
            {staff && <Text style={{ color: colors.cream, fontWeight: '700', marginTop: 8 }}>{o.customerName}</Text>}
            <View style={{ marginTop: 8 }}>
              {o.items.map((i, idx) => <Text key={idx} style={{ color: colors.cream }}>{i.qty}x {i.name}</Text>)}
            </View>
            <Text style={{ color: colors.muted, marginTop: 8, fontSize: 12 }}>
              {o.delivery ? `Entrega: ${o.address}` : 'Retirada no balcão'} · {o.payment}
            </Text>
            <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 18, marginTop: 6 }}>{brl(o.total)}</Text>
            {staff && NEXT_STATUS[o.status] && (
              <Button
                title={`Marcar como ${STATUS[NEXT_STATUS[o.status]].toLowerCase()}`}
                onPress={() => setOrderStatus(o.id, NEXT_STATUS[o.status])}
                style={{ marginTop: 12, minHeight: 46 }}
              />
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}
