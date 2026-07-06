const { PrismaClient } = require('@prisma/client');
const { createToken, hashPassword, comparePassword } = require('../auth');
const { ValidationError } = require('../errors');

const prisma = new PrismaClient();

async function login({ email, password }) {
  if (!email || !password || email.trim() === '' || password.trim() === '') {
    throw new ValidationError('Email y contraseña son obligatorios.');
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    throw new ValidationError('Credenciales inválidas.');
  }

  const passwordValida = await comparePassword(password, user.password);
  if (!passwordValida) {
    throw new ValidationError('Credenciales inválidas.');
  }

  const token = createToken({ sub: user.id, email: user.email, role: user.role });

  return {
    message: 'Login correcto',
    token,
    user: { id: user.id, email: user.email, role: user.role }
  };
}

async function register({ email, password, role = 'usuario' }) {
  if (!email || !password || email.trim() === '' || password.trim() === '') {
    throw new ValidationError('Email y contraseña son obligatorios.');
  }

  if (!['usuario', 'admin', 'superadmin'].includes(role)) {
    throw new ValidationError('Rol inválido.');
  }

  const existe = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existe) {
    throw new ValidationError('El email ya está registrado.');
  }

  const passwordHash = await hashPassword(password);
  const nuevoUsuario = await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      password: passwordHash,
      role
    }
  });

  return {
    message: 'Usuario creado correctamente',
    user: { id: nuevoUsuario.id, email: nuevoUsuario.email, role: nuevoUsuario.role }
  };
}

module.exports = {
  login,
  register
};
