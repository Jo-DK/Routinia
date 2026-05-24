# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

React Native + Expo + React Navigation v6 + React Hook Form + Axios + expo-secure-store.

## Commands

```bash
npm install            # Instalar dependências
npm start              # Iniciar o Metro Bundler (QR code para escanear com Expo Go)
npm run android        # Rodar no emulador Android (AVD precisa estar aberto)
npm run ios            # Rodar no simulador iOS (apenas macOS)
```

## Setup Inicial

```bash
# Instalar o Expo CLI globalmente (uma vez só)
npm install -g expo-cli

npm install
npm start
# Escaneie o QR code com o app Expo Go (Android/iOS)
```

**Emulador Android**: use `10.0.2.2` no lugar de `localhost` para apontar para a máquina host.
**Dispositivo físico**: use o IP local da máquina (ex: `192.168.1.10`).

## Architecture

```
App.jsx                         # Entry point: SafeAreaProvider + AuthProvider + AppNavigator
src/
  api/axios.js                  # Instância Axios com SecureStore para token JWT
  contexts/AuthContext.jsx      # Estado global de auth (async, usa SecureStore)
  navigation/AppNavigator.jsx   # AuthStack (não logado) ↔ AppStack (logado)
  screens/
    LoginScreen.jsx
    RegisterScreen.jsx
    ForgotPasswordScreen.jsx
    ResetPasswordScreen.jsx     # Recebe token via route.params ou input manual
    DashboardScreen.jsx
```

## Key Differences from Web

- **Storage**: `SecureStore` (async) ao invés de `localStorage` (sync) — todas as operações de token usam `await`
- **Formulários**: `Controller` do react-hook-form (não `register`) — necessário para inputs nativos
- **Navegação**: `useNavigation()` / `navigation.navigate('NomeTela')` ao invés de `useNavigate()` / `navigate('/rota')`
- **Estilos**: `StyleSheet.create({})` ao invés de classes Tailwind
- **Alertas**: `Alert.alert('Título', 'Mensagem')` ao invés de `alert()`
- **Deep Links**: configurar em `app.json` para o link de reset-password abrir o app diretamente

## Adicionando uma Nova Tela

1. Criar `src/screens/NomeDaTelaScreen.jsx`
2. Adicionar no stack correto em `src/navigation/AppNavigator.jsx`
3. Navegar com: `navigation.navigate('NomeDaTela', { param: valor })`
4. Receber parâmetros: `const route = useRoute(); route.params?.param`
