# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Node.js + Express + Prisma ORM + PostgreSQL.

## Commands

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento (auto-reload)
npm run dev

# Rodar em produção
npm start

# Banco de dados
npm run db:migrate     # Aplica novas migrations (cria/altera tabelas)
npm run db:generate    # Regenera o Prisma Client após mudar o schema
npm run db:studio      # Abre GUI visual do banco no navegador
npm run db:reset       # CUIDADO: apaga tudo e roda todas as migrations do zero
```

## Setup Inicial

```bash
cp .env.example .env   # Configure as variáveis de ambiente
npm install
npm run db:migrate     # Cria as tabelas no PostgreSQL
npm run dev
```

## Architecture

```
src/
  index.js              # Entry point: configura Express, CORS, rotas globais
  routes/auth.js        # Definição de endpoints + validações (express-validator)
  controllers/          # Recebe req/res, valida entrada, chama services
  services/             # Lógica de negócio e acesso ao banco (Prisma)
  middleware/auth.js    # Verifica JWT em rotas protegidas
  utils/jwt.js          # generateToken / verifyToken
prisma/schema.prisma    # Definição do schema do banco (ORM model)
```

**Fluxo de uma requisição:** `Route → Validation → Controller → Service → Prisma → DB`

## Auth Flow

- `POST /api/auth/register` → cria usuário, retorna JWT
- `POST /api/auth/login` → valida credenciais, retorna JWT
- `POST /api/auth/forgot-password` → gera token no banco, envia email
- `POST /api/auth/reset-password` → valida token, atualiza senha, marca token como usado
- `GET /api/auth/me` → rota protegida, retorna usuário logado (req.user vem do authMiddleware)

## Key Conventions

- Erros de domínio são lançados como `throw new Error('SNAKE_CASE_CODE')` nos services e mapeados para HTTP no controller.
- Nunca retornar o campo `password` nas respostas — usar `select` no Prisma ou desestruturação.
- O token JWT expira em `JWT_EXPIRES_IN` (padrão 7d). Para refresh tokens, implementar `POST /api/auth/refresh`.
- Adicionar novos models em `prisma/schema.prisma` e rodar `npm run db:migrate` para criar a migration.

## Adicionando um Novo Módulo

1. Adicionar model em `prisma/schema.prisma`
2. `npm run db:migrate -- --name nome_da_migration`
3. Criar `src/services/nomeService.js`
4. Criar `src/controllers/nomeController.js`
5. Criar `src/routes/nome.js`
6. Registrar em `src/index.js`: `app.use('/api/nome', nomeRoutes)`
