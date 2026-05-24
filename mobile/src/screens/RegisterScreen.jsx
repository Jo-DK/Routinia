import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  async function onSubmit(data) {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      await login(response.data.user, response.data.token);
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao criar conta.';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={styles.logo}>Routinia</Text>
          <Text style={styles.subtitle}>Comece a organizar sua rotina hoje</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Criar conta</Text>

          {/* Nome */}
          <View style={styles.field}>
            <Text style={styles.label}>Nome</Text>
            <Controller
              control={control}
              name="name"
              rules={{ required: 'Nome é obrigatório', minLength: { value: 2, message: 'Mínimo 2 caracteres' } }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Seu nome completo"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email é obrigatório',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Email inválido' },
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          {/* Senha */}
          <View style={styles.field}>
            <Text style={styles.label}>Senha</Text>
            <Controller
              control={control}
              name="password"
              rules={{ required: 'Senha é obrigatória', minLength: { value: 8, message: 'Mínimo 8 caracteres' } }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Mínimo 8 caracteres"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>

          {/* Confirmar Senha */}
          <View style={styles.field}>
            <Text style={styles.label}>Confirmar senha</Text>
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
                  placeholder="Repita a senha"
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
            <Text style={styles.buttonText}>{loading ? 'Criando conta...' : 'Criar conta'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Entrar</Text>
            </TouchableOpacity>
          </View>
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
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
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
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1f2937',
  },
  inputError: { borderColor: '#f87171', backgroundColor: '#fef2f2' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  button: { backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#6b7280', fontSize: 14 },
  link: { color: '#4f46e5', fontSize: 14, fontWeight: '500' },
});
