import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import { colors, spacing } from '../theme';

const msg = (e) => ({
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/weak-password': 'A senha precisa ter ao menos 6 caracteres.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/network-request-failed': 'Sem conexão com a internet.',
}[e.code] || 'Algo deu errado. Tente novamente.');

function Shell({ subtitle, children }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: colors.brown, borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 42 }}>☕</Text>
            </View>
            <Text style={{ color: colors.gold, fontSize: 28, fontWeight: '800', letterSpacing: 3, marginTop: 14 }}>MCS CAFÉ</Text>
            <Text style={{ color: colors.muted, marginTop: 4, textAlign: 'center' }}>{subtitle}</Text>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function LoginScreen({ navigation }) {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (!email || !pass) return Alert.alert('Preencha e-mail e senha');
    setBusy(true);
    try { await login(email, pass); } catch (e) { Alert.alert('Não foi possível entrar', msg(e)); }
    setBusy(false);
  };

  const forgot = async () => {
    if (!email) return Alert.alert('Informe seu e-mail acima');
    try { await resetPassword(email); Alert.alert('Enviamos um link para redefinir a senha.'); }
    catch (e) { Alert.alert(msg(e)); }
  };

  return (
    <Shell subtitle="Café feito para o seu momento.">
      <Input label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="voce@email.com" />
      <Input label="Senha" value={pass} onChangeText={setPass} secureTextEntry placeholder="••••••" />
      <Button title="Entrar" onPress={go} loading={busy} />
      <Pressable onPress={forgot} style={{ padding: 14, alignItems: 'center' }}>
        <Text style={{ color: colors.muted }}>Esqueci minha senha</Text>
      </Pressable>
      <Button title="Criar conta" variant="ghost" onPress={() => navigation.navigate('Register')} />
    </Shell>
  );
}

export function RegisterScreen() {
  const { register } = useAuth();
  const [f, setF] = useState({ name: '', email: '', pass: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF({ ...f, [k]: v });

  const go = async () => {
    if (!f.name || !f.email || !f.pass) return Alert.alert('Preencha todos os campos');
    setBusy(true);
    try { await register(f); } catch (e) { Alert.alert('Não foi possível cadastrar', msg(e)); }
    setBusy(false);
  };

  return (
    <Shell subtitle="Crie sua conta em menos de um minuto.">
      <Input label="Seu nome" value={f.name} onChangeText={set('name')} />
      <Input label="E-mail" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
      <Input label="Senha" value={f.pass} onChangeText={set('pass')} secureTextEntry placeholder="Mínimo 6 caracteres" />
      <Button title="Cadastrar" onPress={go} loading={busy} />
    </Shell>
  );
}
