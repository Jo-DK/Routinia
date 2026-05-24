// =====================================================
// DASHBOARD — Página principal (protegida)
// Placeholder para as próximas funcionalidades do Routinia
// =====================================================

import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">Routinia</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">Olá, <strong>{user?.name}</strong></span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Bem-vindo ao Routinia!
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Em breve você poderá organizar suas filas de tarefas e rotinas aqui.
            O gerenciador de calendário com arrastar e soltar está a caminho!
          </p>
        </div>
      </main>
    </div>
  );
}
