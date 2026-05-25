import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QueueConflictProvider } from './contexts/QueueConflictContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login          from './pages/Login';
import Register       from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import Queues         from './pages/Queues';
import QueueDetail    from './pages/QueueDetail';
import Calendar       from './pages/Calendar';

function P({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueueConflictProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/login"          element={<Login />} />
          <Route path="/cadastro"       element={<Register />} />
          <Route path="/esqueci-senha"  element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protegidas */}
          <Route path="/queues"     element={<P><Queues /></P>} />
          <Route path="/queues/:id" element={<P><QueueDetail /></P>} />
          <Route path="/calendar"   element={<P><Calendar /></P>} />

          <Route path="/"  element={<Navigate to="/queues" replace />} />
          <Route path="*"  element={<Navigate to="/queues" replace />} />
        </Routes>
        </QueueConflictProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
