// =====================================================
// PONTO DE ENTRADA DA APLICAÇÃO
// Equivalente ao index.php ou ao bootstrap/app.php do Laravel
// =====================================================

// dotenv carrega as variáveis do arquivo .env
// Deve ser a primeira linha do arquivo
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Importa as rotas de autenticação
const authRoutes = require('./routes/auth');
const queueRoutes    = require('./routes/queues');
const scheduleRoutes = require('./routes/schedules');

const app = express();
const PORT = process.env.PORT || 3333;

// =====================================================
// MIDDLEWARES GLOBAIS
// Middlewares processam a requisição ANTES de chegar nas rotas.
// É equivalente aos Middleware do Laravel, mas registrado globalmente aqui.
// =====================================================

// Permite receber requisições de outros domínios (frontend, mobile)
// Em produção, substitua '*' pelo domínio real: 'https://routinia.app'
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.WEB_URL
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Permite que o Express leia JSON no corpo das requisições (req.body)
// Equivalente ao json_decode() automático do Laravel
app.use(express.json());

// =====================================================
// ROTAS
// =====================================================

// Rota de health check — útil para saber se o servidor está rodando
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Todas as rotas de auth ficam em /api/auth/*
app.use('/api/auth', authRoutes);
app.use('/api/queues',     queueRoutes);
app.use('/api/schedules', scheduleRoutes);

// =====================================================
// TRATAMENTO DE ERROS GLOBAL
// Qualquer erro que chegar aqui sem tratamento será capturado.
// Em PHP seria como um handler de Exception global.
// =====================================================
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// =====================================================
// INICIALIZAÇÃO DO SERVIDOR
// =====================================================
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`📚 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
