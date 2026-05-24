// =====================================================
// CONFIGURAÇÃO DO AXIOS (cliente HTTP)
// Axios é o equivalente ao Guzzle do PHP para fazer requisições HTTP.
// Aqui configuramos uma instância com a URL base da API.
//
// INTERCEPTORS (interceptadores):
// Funcionam como middleware, mas para as requisições do cliente.
// - Request interceptor: adiciona o token JWT automaticamente
// - Response interceptor: trata erros globais (ex: redirecionar no 401)
// =====================================================

import axios from 'axios';

// Cria uma instância do axios com configurações padrão
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Vem do .env (VITE_API_URL)
  headers: {
    'Content-Type': 'application/json',
  },
});

// =====================================================
// INTERCEPTOR DE REQUISIÇÃO
// Adiciona o token JWT em todas as requisições automaticamente.
// Assim você não precisa colocar o header manualmente em cada chamada.
// =====================================================
api.interceptors.request.use(
  (config) => {
    // Busca o token salvo no localStorage
    const token = localStorage.getItem('routinia_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// =====================================================
// INTERCEPTOR DE RESPOSTA
// Trata erros HTTP globalmente.
// =====================================================
api.interceptors.response.use(
  (response) => response, // Sucesso: passa direto
  (error) => {
    // Se o token expirou ou é inválido, faz logout automático
    if (error.response?.status === 401) {
      localStorage.removeItem('routinia_token');
      localStorage.removeItem('routinia_user');
      // Redireciona para login (sem usar o React Router pois estamos fora do contexto)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
