// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// Protege rotas que exigem login.
// Equivalente ao middleware 'auth' do Laravel.
//
// USO nas rotas:
//   router.get('/perfil', authMiddleware, controller.perfil)
//
// O cliente deve enviar no header:
//   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// =====================================================

const { verifyToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  // Pega o header Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  // Remove o prefixo "Bearer " para pegar só o token
  const token = authHeader.split(' ')[1];

  try {
    // Verifica a assinatura e validade do token
    const decoded = verifyToken(token);

    // Adiciona os dados do usuário na requisição
    // Agora qualquer controlador pode acessar req.user
    req.user = decoded;

    // Continua para o próximo middleware ou controlador
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = authMiddleware;
