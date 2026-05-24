// =====================================================
// TELA DE LOGIN — MOBILE
// React Native usa componentes nativos ao invés de HTML:
//   <View>   → <div>
//   <Text>   → <p>, <h1>, <span>
//   <TextInput> → <input>
//   <TouchableOpacity> → <button>
//   <ScrollView> → <div> com scroll
//
// Estilos são feitos com StyleSheet (objetos JavaScript), não CSS.
// Todos os valores de tamanho são em "density-independent pixels" (dp),
// não pixels reais.
// =====================================================

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

// No React Native, usamos Controller do react-hook-form
// porque os inputs nativos não são inputs HTML
export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm();

  async function onSubmit(data) {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      // login() é async no mobile (usa SecureStore)
      await login(response.data.user, response.data.token);
      // A navegação acontece automaticamente via AppNavigator
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao fazer login. Tente novamente.';
      // Alert.alert é o equivalente mobile do alert() do browser
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    // KeyboardAvoidingView empurra o conteúdo para cima quando o teclado aparece
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Routinia</Text>
          <Text style={styles.subtitle}>Gerencie suas rotinas com inteligência</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Entrar</Text>

          {/* Campo Email */}
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
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          {/* Campo Senha */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Senha</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.link}>Esqueci minha senha</Text>
              </TouchableOpacity>
            </View>
            <Controller
              control={control}
              name="password"
              rules={{ required: 'Senha é obrigatória' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="••••••••"
                  secureTextEntry // Esconde os caracteres da senha
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>

          {/* Botão de login */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          {/* Link para cadastro */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Cadastre-se grátis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// =====================================================
// ESTILOS
// StyleSheet.create() otimiza os estilos (similar ao CSS-in-JS).
// Diferente do CSS, aqui não existe herança de estilos (cada elemento
// precisa ter seus próprios estilos definidos).
// =====================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,                  // flex: 1 = ocupa todo o espaço disponível
    backgroundColor: '#eef2ff',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4f46e5',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',       // Sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,              // Sombra no Android
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#f87171',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  link: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '500',
  },
});
