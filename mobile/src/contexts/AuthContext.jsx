// =====================================================
// CONTEXTO DE AUTENTICAÇÃO — MOBILE
// Funciona da mesma forma que o web, mas:
// - Usa SecureStore ao invés de localStorage
// - Todas as operações de storage são assíncronas (await)
// =====================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ao iniciar o app, verifica se há sessão salva
  useEffect(() => {
    async function loadSession() {
      try {
        const savedUser = await SecureStore.getItemAsync('routinia_user');
        const savedToken = await SecureStore.getItemAsync('routinia_token');

        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  const login = useCallback(async (userData, token) => {
    // SecureStore só aceita strings — por isso usamos JSON.stringify para objetos
    await SecureStore.setItemAsync('routinia_token', token);
    await SecureStore.setItemAsync('routinia_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('routinia_token');
    await SecureStore.deleteItemAsync('routinia_user');
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
