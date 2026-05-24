// =====================================================
// UTILITÁRIO JWT (JSON Web Token)
// JWT é o equivalente moderno a sessions do PHP — mas sem estado no servidor.
// O token é gerado no login e enviado pelo cliente em cada requisição.
//
// COMO FUNCIONA:
// 1. Login → servidor gera token assinado com JWT_SECRET
// 2. Cliente guarda o token (localStorage no web, SecureStore no mobile)
// 3. Nas próximas requisições, cliente envia: Authorization: Bearer <token>
// 4. Servidor valida a assinatura e lê os dados do token
//
// Estrutura do token: header.payload.signature (tudo em base64)
// Você pode decodificar em: https://jwt.io
// =====================================================

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Gera um token JWT com os dados do usuário.
 * @param {object} payload - Dados a incluir no token (não inclua senha!)
 * @returns {string} Token JWT
 */
function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Verifica e decodifica um token JWT.
 * Lança exceção se o token for inválido ou expirado.
 * @param {string} token
 * @returns {object} Payload decodificado
 */
function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { generateToken, verifyToken };
