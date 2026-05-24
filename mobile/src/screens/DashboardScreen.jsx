import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  return (
    // SafeAreaView garante que o conteúdo não fique embaixo do notch ou da barra de status
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Routinia</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>🚀</Text>
        <Text style={styles.title}>Bem-vindo, {user?.name}!</Text>
        <Text style={styles.description}>
          Em breve você poderá organizar suas filas de tarefas aqui.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  logo: { fontSize: 20, fontWeight: '700', color: '#4f46e5' },
  logout: { fontSize: 14, color: '#6b7280' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '600', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
  description: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
});
