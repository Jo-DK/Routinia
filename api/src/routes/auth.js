// =====================================================
// ROTAS DE AUTENTICAÇÃO
// Define os endpoints e as validações de entrada.
// Equivalente ao routes/auth.php do Laravel (com form validation inline).
//
// Cada rota tem:
//   1. O método HTTP e o caminho
//   2. Middlewares de validação (express-validator)
//   3. O controlador que processa a requisição
// =====================================================

const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = Router();

// =====================================================
// POST /api/auth/register
// Corpo esperado: { name, email, password }
// =====================================================
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Nome é obrigatório')
      .isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),

    body('email')
      .trim()
      .notEmpty().withMessage('Email é obrigatório')
      .isEmail().withMessage('Email inválido')
      .normalizeEmail(),

    body('password')
      .notEmpty().withMessage('Senha é obrigatória')
      .isLength({ min: 8 }).withMessage('Senha deve ter pelo menos 8 caracteres'),
  ],
  authController.register,
);

// =====================================================
// POST /api/auth/login
// Corpo esperado: { email, password }
// =====================================================
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email é obrigatório')
      .isEmail().withMessage('Email inválido')
      .normalizeEmail(),

    body('password')
      .notEmpty().withMessage('Senha é obrigatória'),
  ],
  authController.login,
);

// =====================================================
// POST /api/auth/forgot-password
// Corpo esperado: { email }
// =====================================================
router.post(
  '/forgot-password',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email é obrigatório')
      .isEmail().withMessage('Email inválido')
      .normalizeEmail(),
  ],
  authController.forgotPassword,
);

// =====================================================
// POST /api/auth/reset-password
// Corpo esperado: { token, newPassword }
// =====================================================
router.post(
  '/reset-password',
  [
    body('token')
      .notEmpty().withMessage('Token é obrigatório'),

    body('newPassword')
      .notEmpty().withMessage('Nova senha é obrigatória')
      .isLength({ min: 8 }).withMessage('Senha deve ter pelo menos 8 caracteres'),
  ],
  authController.resetPassword,
);

// =====================================================
// GET /api/auth/me — ROTA PROTEGIDA
// Requer header: Authorization: Bearer <token>
// =====================================================
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
