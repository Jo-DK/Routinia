// =====================================================
// PÁGINA DE REDEFINIÇÃO DE SENHA
// O usuário chega aqui clicando no link do email:
//   https://routinia.app/reset-password?token=abc123...
//
// useSearchParams lê os query params da URL
// Equivalente a $_GET['token'] no PHP
// =====================================================

import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/axios';

export default function ResetPassword() {
  // useSearchParams lê ?token=... da URL
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('newPassword');

  // Se não tem token na URL, mostra erro
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Link inválido</h2>
          <p className="text-gray-500 mb-4">
            Este link de redefinição é inválido ou expirou.
          </p>
          <Link to="/esqueci-senha" className="text-primary-600 font-medium hover:underline">
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(data) {
    setApiError('');
    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword,
      });
      setSuccess(true);
    } catch (error) {
      setApiError(error.response?.data?.error || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Senha redefinida!</h2>
          <p className="text-gray-500 mb-6">Sua senha foi atualizada com sucesso.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-6 rounded-lg transition"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Routinia</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Nova senha</h2>
          <p className="text-gray-500 text-sm mb-6">Escolha uma senha forte para sua conta.</p>

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              {apiError}{' '}
              {(apiError.includes('expirou') || apiError.includes('inválido')) && (
                <Link to="/esqueci-senha" className="underline font-medium">
                  Solicitar novo link
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
              <input
                type="password"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
                  errors.newPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Mínimo 8 caracteres"
                {...register('newPassword', {
                  required: 'Nova senha é obrigatória',
                  minLength: { value: 8, message: 'Senha deve ter pelo menos 8 caracteres' },
                })}
              />
              {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
              <input
                type="password"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
                  errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Repita a nova senha"
                {...register('confirmPassword', {
                  required: 'Confirmação é obrigatória',
                  validate: (value) => value === password || 'As senhas não coincidem',
                })}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
