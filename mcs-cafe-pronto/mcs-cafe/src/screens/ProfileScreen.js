import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/db';
import { Button, Card, Input } from '../components/ui';
import { colors, spacing } from '../theme';

const ROLE = { cliente: 'Cliente', funcionario: 'Funcionário', admin: 'Administrador' };

export default function ProfileScreen() {
  const { user, profile, logout } = useAuth();
  const [f, setF] = useState({ name: '', phone: '', address: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setF({ name: profile.name || '', phone: profile.phone || '', address: profile.address || '' });
  }, [profile]);

  const save = async () => {
    if (!f.name.trim()) return Alert.alert('Informe seu nome');
    setBusy(true);
    try { await updateProfile(user.uid, { name: f.name.trim(), phone: f.phone, address: f.address }); Alert.alert('Perfil atualizado'); }
    catch (e) { Alert.alert('Erro ao salvar'); }
    setBusy(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.brown, borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.gold, fontSize: 36, fontWeight: '800' }}>{(f.name || '?')[0].toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', marginTop: 10, color: colors.cream }}>{f.name}</Text>
          <Text style={{ color: colors.muted }}>{user.email}</Text>
          <View style={{ backgroundColor: colors.brown, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginTop: 8 }}>
            <Text style={{ color: colors.gold, fontWeight: '700', fontSize: 12 }}>{ROLE[profile.role] || 'Cliente'}</Text>
          </View>
        </View>
        <Card>
          <Input label="Seu nome" value={f.name} onChangeText={(v) => setF({ ...f, name: v })} />
          <Input label="Telefone / WhatsApp" value={f.phone} onChangeText={(v) => setF({ ...f, phone: v })} keyboardType="phone-pad" />
          <Input label="Endereço padrão" value={f.address} onChangeText={(v) => setF({ ...f, address: v })} />
          <Button title="Salvar alterações" onPress={save} loading={busy} />
        </Card>
        <Button
          title="Sair da conta" variant="danger" style={{ marginTop: spacing.lg }}
          onPress={() => Alert.alert('Sair?', '', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', onPress: logout }])}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
