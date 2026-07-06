const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./auth');
const app = require('./app');
const { PORT } = require('./config');

const prisma = new PrismaClient();

async function ensureDefaultUsers() {
  const total = await prisma.user.count();
  if (total > 0) return;

  const passwordSeed = {
    usuario: await hashPassword('usuario123'),
    admin: await hashPassword('admin123'),
    superadmin: await hashPassword('super123')
  };

  await prisma.user.createMany({
    data: [
      { email: 'usuario@gym.com', password: passwordSeed.usuario, role: 'usuario' },
      { email: 'admin@gym.com', password: passwordSeed.admin, role: 'admin' },
      { email: 'superadmin@gym.com', password: passwordSeed.superadmin, role: 'superadmin' }
    ]
  });
}


async function start() {
  await ensureDefaultUsers();
  app.listen(PORT, () => {
    console.log(`Servidor del gimnasio corriendo en http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
