// =====================================================
// CONFIGURAÇÃO DO AXIOS PARA O MOBILE
// Muito similar ao web, mas usa expo-secure-store ao invés de localStorage.
//
// SecureStore é mais seguro que AsyncStorage para dados sensíveis (tokens).
// Ele criptografa os dados usando o Keychain (iOS) ou Keystore (Android).
// Equivalente ao Keychain Services do iOS ou Keystore do Android.
//
// ATENÇÃO: No emulador Android, localhost não funciona.
// Use 10.0.2.2 para apontar para o host da máquina.
// No dispositivo físico, use o IP local da sua máquina.
// =====================================================

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3333/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout (importante no mobile)
});

// Interceptor de requisição: adiciona o token JWT
api.interceptors.request.use(
  async (config) => {
    // SecureStore é async (diferente do localStorage do web que é sync)
    const token = await SecureStore.getItemAsync('routinia_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
