// =====================================================
// CONTROLADOR DE AUTENTICAÇÃO
// Recebe a requisição HTTP, valida os dados e chama o serviço.
// Equivalente ao AuthController.php do Laravel.
//
// Separação de responsabilidades:
//   Controller → valida entrada, chama Service, retorna resposta HTTP
//   Service    → lógica de negócio, acesso ao banco
// =====================================================

const { validationResult } = require('express-validator');
const authService = require('../services/authService');

// Helper: extrai erros de validação em formato limpo
function getValidationErrors(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errors.array().map(e => ({ field: e.path, message: e.msg }));
  }
  return null;
}

// =====================================================
// POST /api/auth/register
// =====================================================
async function register(req, res) {
  // Verifica se os campos passaram na validação (definida nas rotas)
  const errors = getValidationErrors(req);
  if (errors) return res.status(422).json({ errors });

  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });

    // 201 = Created (recurso criado com sucesso)
    return res.status(201).json({
      message: 'Conta criada com sucesso!',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    if (error.message === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({ error: 'Este email já está cadastrado.' });
    }
    console.error('Erro no registro:', error);
    return res.status(500).json({ error: 'Erro ao criar conta. Tente novamente.' });
  }
}

// =====================================================
// POST /api/auth/login
// =====================================================
async function login(req, res) {
  const errors = getValidationErrors(req);
  if (errors) return res.status(422).json({ errors });

  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    return res.json({
      message: 'Login realizado com sucesso!',
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    if (error.message === 'INVALID_CREDENTIALS') {
      // 401 = Unauthorized
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro ao fazer login. Tente novamente.' });
  }
}

// =====================================================
// POST /api/auth/forgot-password
// =====================================================
async function forgotPassword(req, res) {
  const errors = getValidationErrors(req);
  if (errors) return res.status(422).json({ errors });

  try {
    const { email } = req.body;
    await authService.forgotPassword({ email });

    // Sempre retorna a mesma mensagem, independente de o email existir ou não.
    // Isso evita que um atacante descubra quais emails estão cadastrados.
    return res.json({
      message: 'Se este email estiver cadastrado, você receberá as instruções em breve.',
    });
  } catch (error) {
    console.error('Erro no forgot password:', error);
    return res.status(500).json({ error: 'Erro ao processar solicitação. Tente novamente.' });
  }
}

// =====================================================
// POST /api/auth/reset-password
// =====================================================
async function resetPassword(req, res) {
  const errors = getValidationErrors(req);
  if (errors) return res.status(422).json({ errors });

  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword({ token, newPassword });

    return res.json({ message: 'Senha redefinida com sucesso! Faça login com sua nova senha.' });
  } catch (error) {
    const errorMessages = {
      INVALID_TOKEN: 'Link inválido. Solicite um novo link de redefinição.',
      TOKEN_ALREADY_USED: 'Este link já foi utilizado. Solicite um novo.',
      TOKEN_EXPIRED: 'Este link expirou. Solicite um novo link de redefinição.',
    };

    const message = errorMessages[error.message];
    if (message) {
      return res.status(400).json({ error: message });
    }

    console.error('Erro no reset password:', error);
    return res.status(500).json({ error: 'Erro ao redefinir senha. Tente novamente.' });
  }
}

// =====================================================
// GET /api/auth/me (rota protegida)
// =====================================================
async function getMe(req, res) {
  try {
    // req.user foi preenchido pelo authMiddleware
    const user = await authService.getMe(req.user.id);
    return res.json({ user });
  } catch (error) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }
}

module.exports = { register, login, forgotPassword, resetPassword, getMe };
