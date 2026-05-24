# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Routinia — Visão Geral do Ecossistema

Gerenciador de rotinas assistido por IA, voltado para pessoas com TDAH e neurodivergências. O usuário organiza sua semana com **Filas de Tarefas** que rotacionam automaticamente no calendário.

## Repositórios

| Pasta    | Tecnologia              | Porta padrão |
|----------|-------------------------|--------------|
| `api/`   | Node.js + Express + Prisma + PostgreSQL | 3333 |
| `web/`   | React + Vite + Tailwind | 5173 |
| `mobile/`| React Native + Expo     | (Metro Bundler) |

Cada repositório tem seu próprio `CLAUDE.md` com comandos e arquitetura detalhados.

## Ordem de Inicialização

```bash
# 1. Banco de dados (PostgreSQL deve estar rodando)
# 2. API
cd api && npm run dev

# 3. Web (em outro terminal)
cd web && npm run dev

# 4. Mobile (em outro terminal)
cd mobile && npm start
```

## Conceitos Centrais

### Filas (Queues)
Grupos de tarefas que rotacionam no calendário. Exemplos:
- **Academia**: Bíceps → Pernas → Cardio → (repete)
- **Leitura**: livro A → livro B (avança manualmente ao terminar)
- **Trabalho**: bloco fixo de 8h, sem rotação

### Tipos de Rotação
- `sequential`: avança automaticamente a cada execução agendada
- `manual`: o usuário marca conclusão para avançar

## Módulos Planejados

- [x] **Auth** — login, cadastro, esqueci senha, reset senha
- [ ] **Filas (Queues)** — CRUD de filas com tipo de rotação
- [ ] **Tarefas (Tasks)** — CRUD de tarefas dentro de filas
- [ ] **Calendário** — grid drag-and-drop (inspirado no Google Calendar)
- [ ] **IA** — endpoint para sugestão e criação automática de rotinas via LLM
- [ ] **Analytics** — gráficos de dias passados e futuros agendados

## Auth Flow (implementado)

```
POST /api/auth/register         → cria conta, retorna JWT
POST /api/auth/login            → valida credenciais, retorna JWT
POST /api/auth/forgot-password  → envia email com link (token expira em 15min)
POST /api/auth/reset-password   → valida token, atualiza senha
GET  /api/auth/me               → retorna usuário logado (requer Bearer token)
```

Token JWT é armazenado em `localStorage` (web) e `SecureStore` (mobile).

## Stack Decisions

- **Prisma** (ORM): migrations declarativas, autocomplete forte, similar ao Eloquent
- **react-hook-form**: gerenciamento de formulários performático (evita re-renders por campo)
- **Tailwind** (web): design system rápido sem CSS manual
- **Expo** (mobile): simplifica setup iOS/Android, hot reload, builds na nuvem

## PHP → JS/TS Mental Model

| PHP / Laravel | JavaScript / Node.js |
|---------------|----------------------|
| `$_POST['campo']` | `req.body.campo` |
| `$_GET['param']` | `req.query.param` |
| `echo json_encode($data)` | `res.json(data)` |
| `Eloquent::find($id)` | `prisma.user.findUnique({ where: { id } })` |
| `password_hash()` | `bcrypt.hash(password, 10)` |
| `password_verify()` | `bcrypt.compare(plain, hash)` |
| Middleware Laravel | `authMiddleware` (função antes do controller) |
| `.env` | `.env` (igual, mas `process.env.VAR` no código) |
| `Session / $_SESSION` | JWT (token stateless) |
| `Str::random(64)` | `crypto.randomBytes(32).toString('hex')` |
