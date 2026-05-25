import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useQueueConflict } from '../contexts/QueueConflictContext';

import LoginScreen          from '../screens/LoginScreen';
import RegisterScreen       from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen  from '../screens/ResetPasswordScreen';
import DashboardScreen      from '../screens/DashboardScreen';
import QueuesScreen         from '../screens/QueuesScreen';
import QueueDetailScreen    from '../screens/QueueDetailScreen';
import CalendarScreen       from '../screens/CalendarScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#eef2ff' } }}>
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="Register"       component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

// Stack interno de Filas (lista + detalhe)
function QueuesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QueuesList"  component={QueuesScreen} />
      <Stack.Screen name="QueueDetail" component={QueueDetailScreen} />
    </Stack.Navigator>
  );
}

// Tab navigation para a área logada
function AppTabs() {
  const { hasConflict } = useQueueConflict();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#e5e7eb' },
      }}
    >
      <Tab.Screen
        name="Início"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Filas"
        component={QueuesStack}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📋</Text> }}
      />
      <Tab.Screen
        name="Calendário"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📅</Text>,
          tabBarBadge: hasConflict ? '!' : undefined,
          tabBarBadgeStyle: { backgroundColor: '#f59e0b', color: 'white', fontSize: 10, minWidth: 16, height: 16 },
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuth();
  return (
    <NavigationContainer>
      {isAuthenticated ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
