// =====================================================
// PÁGINA DE LOGIN
//
// Conceitos React usados aqui:
// - useState: estado local do componente (como uma variável que, ao mudar, re-renderiza)
// - useNavigate: navegação programática (equivalente ao redirect() do PHP)
// - useForm (react-hook-form): gerencia formulário, validação e erros
// - useAuth: hook personalizado para acessar o contexto de auth
// =====================================================

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // useForm gerencia o formulário: registra campos, valida e pega os valores
  const {
    register,   // registra um input no formulário
    handleSubmit, // wraps o onSubmit com validação automática
    formState: { errors }, // erros de validação
  } = useForm();

  // Rota para redirecionar após login (se tentou acessar uma rota protegida)
  const from = location.state?.from?.pathname || '/dashboard';

  // Esta função só é chamada se a validação do useForm passar
  async function onSubmit(data) {
    setApiError('');
    setLoading(true);

    try {
      // POST /api/auth/login
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      // Salva o token e os dados do usuário no contexto
      login(response.data.user, response.data.token);

      // Redireciona para o dashboard (ou para onde tentava ir)
      navigate(from, { replace: true });
    } catch (error) {
      // error.response.data.error vem da API
      setApiError(error.response?.data?.error || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Routinia</h1>
          <p className="text-gray-500 mt-1">Gerencie suas rotinas com inteligência</p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Entrar</h2>

          {/* Mensagem de erro da API */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Campo Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
                  errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="seu@email.com"
                {...register('email', {
                  required: 'Email é obrigatório',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Email inválido' },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Campo Senha */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <Link to="/esqueci-senha" className="text-sm text-primary-600 hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
              <input
                type="password"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
                  errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                {...register('password', {
                  required: 'Senha é obrigatória',
                })}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Botão de submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Link para cadastro */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-primary-600 font-medium hover:underline">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
