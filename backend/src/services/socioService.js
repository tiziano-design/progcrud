const { PrismaClient } = require('@prisma/client');
const { ValidationError, NotFoundError } = require('../errors');

const prisma = new PrismaClient();

function isPagoVencido(fechaPago) {
  if (!fechaPago) return true;
  const pagoDate = new Date(fechaPago);
  const DIAS_PASADOS = (Date.now() - pagoDate.getTime()) / (1000 * 60 * 60 * 24);
  return DIAS_PASADOS >= 30;
}

function validarSocioPayload(body) {
  const { nombre, apellido, dni, plan } = body || {};

  if (!nombre || !apellido || !dni || !plan || nombre.trim() === '' || apellido.trim() === '' || plan.trim() === '') {
    throw new ValidationError('Todos los campos son obligatorios y no pueden estar vacíos.');
  }

  const dniNumero = Number(dni);
  if (Number.isNaN(dniNumero) || !Number.isInteger(dniNumero) || dniNumero <= 0) {
    throw new ValidationError('El DNI debe ser un número válido y positivo.');
  }

  return {
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    dni: dniNumero.toString(),
    plan: plan.trim()
  };
}

async function getAllSocios() {
  const socios = await prisma.socio.findMany();
  return Promise.all(socios.map(async (socio) => {
    if (socio.estado === 'Activo' && isPagoVencido(socio.fechaPago)) {
      return prisma.socio.update({
        where: { id: socio.id },
        data: { estado: 'Inactivo' }
      });
    }
    return socio;
  }));
}

async function getSocioById(id) {
  const idNumero = parseInt(id, 10);
  if (Number.isNaN(idNumero)) {
    throw new ValidationError('El ID debe ser un número válido.');
  }

  const socio = await prisma.socio.findUnique({ where: { id: idNumero } });
  if (!socio) {
    throw new NotFoundError('El socio solicitado no existe.');
  }

  return socio;
}

async function createSocio(body) {
  const payload = validarSocioPayload(body);
  const fechaPago = body?.fechaPago ? new Date(body.fechaPago) : new Date();

  return prisma.socio.create({
    data: {
      ...payload,
      estado: 'Activo',
      fechaPago
    }
  });
}

async function updateSocio(id, body) {
  const idNumero = parseInt(id, 10);
  if (Number.isNaN(idNumero)) {
    throw new ValidationError('El ID debe ser un número válido.');
  }

  const payload = validarSocioPayload(body);
  const dataActualizada = {
    ...payload,
    ...(body?.fechaPago ? { fechaPago: new Date(body.fechaPago) } : {})
  };

  return prisma.socio.update({
    where: { id: idNumero },
    data: dataActualizada
  });
}

async function updateEstadoSocio(id, body) {
  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId)) {
    throw new ValidationError('El ID debe ser un número válido.');
  }

  const socio = await prisma.socio.findUnique({ where: { id: parsedId } });
  if (!socio) {
    throw new NotFoundError('El socio solicitado no existe.');
  }

  const nuevoEstado = body?.estado === 'Activo' || body?.estado === 'Inactivo'
    ? body.estado
    : socio.estado === 'Activo' ? 'Inactivo' : 'Activo';

  const updatedData = { estado: nuevoEstado };
  if (nuevoEstado === 'Activo') {
    updatedData.fechaPago = new Date();
  }

  return prisma.socio.update({
    where: { id: parsedId },
    data: updatedData
  });
}

async function updatePagoSocio(id) {
  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId)) {
    throw new ValidationError('El ID debe ser un número válido.');
  }

  const socio = await prisma.socio.findUnique({ where: { id: parsedId } });
  if (!socio) {
    throw new NotFoundError('El socio solicitado no existe.');
  }

  return prisma.socio.update({
    where: { id: parsedId },
    data: {
      fechaPago: new Date(),
      estado: 'Activo'
    }
  });
}

async function deleteSocio(id) {
  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId)) {
    throw new ValidationError('El ID debe ser un número válido.');
  }

  await prisma.socio.delete({ where: { id: parsedId } });
  return { mensaje: 'Socio eliminado correctamente' };
}

module.exports = {
  getAllSocios,
  getSocioById,
  createSocio,
  updateSocio,
  updateEstadoSocio,
  updatePagoSocio,
  deleteSocio
};
