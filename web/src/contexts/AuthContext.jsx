// =====================================================
// CONTEXTO DE AUTENTICAÇÃO
// O Context API do React é equivalente a uma variável de sessão global do PHP.
// Qualquer componente pode acessar os dados do usuário logado sem precisar
// passar via props através de toda a árvore de componentes.
//
// COMO FUNCIONA:
// 1. AuthProvider envolve toda a aplicação (em App.jsx)
// 2. Qualquer componente usa: const { user, login, logout } = useAuth()
// =====================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

// Cria o contexto (é como criar um "storage" global)
const AuthContext = createContext(null);

// =====================================================
// PROVIDER — envolve a aplicação e fornece o estado global
// =====================================================
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true enquanto verifica se já está logado

  // Ao carregar a aplicação, verifica se há sessão salva
  useEffect(() => {
    const savedUser = localStorage.getItem('routinia_user');
    const savedToken = localStorage.getItem('routinia_token');

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  // Faz login: salva token e dados do usuário
  const login = useCallback((userData, token) => {
    localStorage.setItem('routinia_token', token);
    localStorage.setItem('routinia_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Faz logout: limpa tudo
  const logout = useCallback(() => {
    localStorage.removeItem('routinia_token');
    localStorage.removeItem('routinia_user');
    setUser(null);
  }, []);

  // Atualiza os dados do usuário (ex: após editar perfil)
  const updateUser = useCallback((updatedData) => {
    const newUser = { ...user, ...updatedData };
    localStorage.setItem('routinia_user', JSON.stringify(newUser));
    setUser(newUser);
  }, [user]);

  // O valor exposto para todos os componentes filhos
  const value = {
    user,           // null = não logado, objeto = logado
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Não renderiza nada enquanto verifica a sessão (evita flash de conteúdo) */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// =====================================================
// HOOK PERSONALIZADO — facilita o uso do contexto
// Ao invés de: const { user } = useContext(AuthContext)
// Basta usar: const { user } = useAuth()
// =====================================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
