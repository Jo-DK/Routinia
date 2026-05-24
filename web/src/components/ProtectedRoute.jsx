// =====================================================
// ROTA PROTEGIDA
// Redireciona para /login se o usuário não estiver autenticado.
// Equivalente ao middleware 'auth' do Laravel nas rotas web.
//
// USO em App.jsx:
//   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
// =====================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Salva a rota que o usuário tentou acessar para redirecionar após login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
