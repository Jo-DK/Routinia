// =====================================================
// COMPONENTE RAIZ DO APP
// Carrega os providers necessários e o navegador principal.
//
// SafeAreaProvider: necessário para SafeAreaView funcionar
// AuthProvider: estado global de autenticação
// AppNavigator: toda a navegação do app
// =====================================================

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
