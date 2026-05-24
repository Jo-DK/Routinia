// =====================================================
// SERVIÇO DE AUTENTICAÇÃO
// Contém a lógica de negócio do auth.
// Separa a lógica dos controladores (padrão Service Layer).
//
// No PHP/Laravel isso seria equivalente ao App\Services\AuthService.
// A separação facilita testes unitários e reuso.
// =====================================================

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('./emailService');

// Prisma é o ORM — equivalente ao Eloquent do Laravel.
// PrismaClient é o "DB::connection()" centralizado.
const prisma = new PrismaClient();

// =====================================================
// REGISTRO DE NOVO USUÁRIO
// =====================================================
async function register({ name, email, password }) {
  // Verifica se o email já está cadastrado
  // Equivalente a: User::where('email', $email)->exists()
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  // Criptografa a senha com bcrypt (nunca salve senhas em texto puro!)
  // O número 10 é o "salt rounds" — mais alto = mais seguro e mais lento
  // Equivalente ao password_hash($password, PASSWORD_BCRYPT) do PHP
  const hashedPassword = await bcrypt.hash(password, 10);

  // Cria o usuário no banco
  // Equivalente a: User::create([...])
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    },
    // Seleciona apenas os campos seguros para retornar (nunca retorne a senha!)
    select: { id: true, name: true, email: true, createdAt: true },
  });

  // Gera o token JWT para o usuário já ficar logado após o registro
  const token = generateToken({ id: user.id, email: user.email, name: user.name });

  return { user, token };
}

// =====================================================
// LOGIN
// =====================================================
async function login({ email, password }) {
  // Busca o usuário pelo email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Se não encontrou o usuário, retorna o mesmo erro de senha errada.
  // IMPORTANTE: nunca diga "email não encontrado" — isso é uma vulnerabilidade
  // de enumeração de usuários. Sempre use a mesma mensagem genérica.
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Compara a senha digitada com o hash salvo no banco
  // Equivalente ao password_verify($password, $hash) do PHP
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Gera o token JWT
  const token = generateToken({ id: user.id, email: user.email, name: user.name });

  // Retorna os dados sem a senha
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}

// =====================================================
// ESQUECI A SENHA
// Gera um token temporário e envia email com link de redefinição
// =====================================================
async function forgotPassword({ email }) {
  // Busca o usuário (mas não revela se existe ou não)
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Se não existe, silenciosamente não faz nada.
  // O controlador sempre retornará a mesma mensagem de sucesso.
  if (!user) return;

  // Invalida tokens anteriores do mesmo usuário (segurança extra)
  await prisma.passwordReset.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  // Gera um token criptograficamente seguro (32 bytes = 64 chars hex)
  // Equivalente ao Str::random(64) do Laravel
  const token = crypto.randomBytes(32).toString('hex');

  // Token expira em 15 minutos
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Salva o token no banco
  await prisma.passwordReset.create({
    data: { token, userId: user.id, expiresAt },
  });

  // Monta o link que será enviado no email
  const resetLink = `${process.env.WEB_URL}/reset-password?token=${token}`;

  // Envia o email (de forma assíncrona)
  await sendPasswordResetEmail(user.email, user.name, resetLink);
}

// =====================================================
// REDEFINIR SENHA
// Valida o token e atualiza a senha do usuário
// =====================================================
async function resetPassword({ token, newPassword }) {
  // Busca o token no banco
  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
    include: { user: true }, // JOIN com a tabela users
  });

  // Valida: token existe?
  if (!resetRecord) {
    throw new Error('INVALID_TOKEN');
  }

  // Valida: token já foi usado?
  if (resetRecord.usedAt) {
    throw new Error('TOKEN_ALREADY_USED');
  }

  // Valida: token expirou?
  if (new Date() > resetRecord.expiresAt) {
    throw new Error('TOKEN_EXPIRED');
  }

  // Criptografa a nova senha
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Atualiza a senha E marca o token como usado (transação atômica)
  // O $transaction garante que as duas operações ocorrem juntas
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

// =====================================================
// BUSCAR USUÁRIO LOGADO
// =====================================================
async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return user;
}

module.exports = { register, login, forgotPassword, resetPassword, getMe };
