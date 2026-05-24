// =====================================================
// LAYOUT COMPARTILHADO
// Header + navegação entre Filas e Calendário.
// =====================================================
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children, className = '' }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const navItem = (to, icon, label) => {
    const active = pathname === to || (to !== '/queues' && pathname.startsWith(to));
    const queueActive = to === '/queues' && (pathname === '/queues' || pathname.startsWith('/queues/'));
    const isActive = queueActive || (to !== '/queues' && active);
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
          isActive
            ? 'bg-primary-50 text-primary-700'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span>{icon}</span>
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/queues" className="text-lg font-bold text-primary-600 shrink-0">
            Routinia
          </Link>
          <nav className="flex items-center gap-1">
            {navItem('/queues',   '📋', 'Filas')}
            {navItem('/calendar', '📅', 'Calendário')}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-gray-500 hidden md:block">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-gray-600 transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className={`flex-1 ${className}`}>{children}</main>
    </div>
  );
}
