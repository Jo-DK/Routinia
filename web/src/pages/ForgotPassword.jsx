import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api/axios';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm();

  async function onSubmit(data) {
    setApiError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSuccess(true); // Mostra tela de sucesso
    } catch (error) {
      setApiError('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Tela de sucesso (após enviar o email)
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* Ícone de email */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Email enviado!</h2>
            <p className="text-gray-500 mb-6">
              Se este email estiver cadastrado, você receberá as instruções de redefinição em breve.
              Verifique também a caixa de spam.
            </p>
            <Link
              to="/login"
              className="inline-block text-primary-600 font-medium hover:underline"
            >
              ← Voltar para o login
            </Link>
          </div>
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
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Esqueceu a senha?</h2>
          <p className="text-gray-500 text-sm mb-6">
            Digite seu email e enviaremos um link para você criar uma nova senha.
          </p>

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? 'Enviando...' : 'Enviar link de redefinição'}
            </button>
          </form>

          <p className="text-center text-sm mt-6">
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              ← Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
