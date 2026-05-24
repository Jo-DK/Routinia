# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

React 18 + Vite + Tailwind CSS + React Router v6 + React Hook Form + Axios.

## Commands

```bash
npm install        # Instalar dependências
npm run dev        # Dev server em http://localhost:5173 (hot reload automático)
npm run build      # Build de produção em dist/
npm run preview    # Visualizar o build de produção localmente
npm run lint       # Verificar erros de código
```

## Setup Inicial

```bash
cp .env.example .env
npm install
npm run dev
```

A variável `VITE_API_URL` deve apontar para o backend (`http://localhost:3333/api`).

## Architecture

```
src/
  main.jsx              # Entry point: monta o React no DOM
  App.jsx               # Roteador principal (BrowserRouter + Routes)
  index.css             # Tailwind CSS imports
  api/axios.js          # Instância Axios com interceptors (token JWT + 401 handler)
  contexts/AuthContext   # Estado global de autenticação (user, login, logout)
  components/
    ProtectedRoute.jsx  # Redireciona para /login se não autenticado
  pages/
    Login.jsx           # POST /api/auth/login
    Register.jsx        # POST /api/auth/register
    ForgotPassword.jsx  # POST /api/auth/forgot-password
    ResetPassword.jsx   # POST /api/auth/reset-password (lê ?token= da URL)
    Dashboard.jsx       # Área logada (placeholder)
```

## Key Patterns

- **Estado global**: `useAuth()` retorna `{ user, isAuthenticated, login, logout }` de qualquer componente
- **Formulários**: sempre usar `react-hook-form` — evita estado manual para cada campo
- **HTTP**: sempre usar a instância `api` de `src/api/axios.js` (não o axios puro) — ela injeta o token automaticamente
- **Erros da API**: vêm em `error.response.data.error` (string) ou `error.response.data.errors` (array com `field` e `message`)
- **Rotas protegidas**: envolver o elemento com `<ProtectedRoute>`

## Adicionando uma Nova Página

1. Criar `src/pages/NomePagina.jsx`
2. Adicionar a rota em `App.jsx`
3. Se protegida, envolver com `<ProtectedRoute>`
4. Criar chamadas de API diretamente no componente (ou extrair para `src/api/nomeApi.js`)
