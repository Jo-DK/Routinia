// =====================================================
// TELA DE REDEFINIÇÃO DE SENHA — MOBILE
// No mobile, o usuário chega aqui através de um Deep Link.
// Configure o deep link no app.json e no sistema operacional
// para que o link do email abra o app diretamente.
//
// Deep link exemplo: routinia://reset-password?token=abc123
//
// Por ora, esta tela recebe o token via parâmetro de navegação.
// O usuário pode copiar o token do email e colar aqui.
// =====================================================

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import api from '../api/axios';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  // useRoute dá acesso aos parâmetros da rota (passados via navigate)
  const route = useRoute();
  const token = route.params?.token;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [manualToken, setManualToken] = useState(token || '');

  const { control, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('newPassword');

  async function onSubmit(data) {
    const finalToken = token || manualToken;
    if (!finalToken) {
      Alert.alert('Erro', 'Informe o token de redefinição');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: finalToken,
        newPassword: data.newPassword,
      });
      setSuccess(true);
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao redefinir senha.';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Senha redefinida!</Text>
          <Text style={styles.successMessage}>
            Sua senha foi atualizada com sucesso.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Ir para o login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Routinia</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Nova senha</Text>

          {/* Se não veio token pela URL, permite digitar manualmente */}
          {!token && (
            <View style={styles.field}>
              <Text style={styles.label}>Token (do email)</Text>
              <TextInput
                style={styles.input}
                placeholder="Cole o token do email aqui"
                value={manualToken}
                onChangeText={setManualToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.hint}>
                O token está no link do email que você recebeu.
              </Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Nova senha</Text>
            <Controller
              control={control}
              name="newPassword"
              rules={{ required: 'Senha é obrigatória', minLength: { value: 8, message: 'Mínimo 8 caracteres' } }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.newPassword && styles.inputError]}
                  placeholder="Mínimo 8 caracteres"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword.message}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirmar nova senha</Text>
            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: 'Confirmação é obrigatória',
                validate: (value) => value === password || 'As senhas não coincidem',
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.confirmPassword && styles.inputError]}
                  placeholder="Repita a nova senha"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Salvando...' : 'Salvar nova senha'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eef2ff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 32, fontWeight: '700', color: '#4f46e5' },
  card: {
    backgroundColor: 'white', borderRadius: 20, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  title: { fontSize: 24, fontWeight: '600', color: '#1f2937', marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16,
  },
  inputError: { borderColor: '#f87171', backgroundColor: '#fef2f2' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  hint: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  button: { backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  successCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  successMessage: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
});
