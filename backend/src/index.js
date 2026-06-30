const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
  }
}

app.use(cors());
app.use(express.json());

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

app.get('/socios', async (req, res, next) => {
  try {
    const socios = await prisma.socio.findMany();

    const sociosActualizados = await Promise.all(socios.map(async (socio) => {
      if (socio.estado === 'Activo' && isPagoVencido(socio.fechaPago)) {
        return prisma.socio.update({
          where: { id: socio.id },
          data: { estado: 'Inactivo' }
        });
      }
      return socio;
    }));

    res.json(sociosActualizados);
  } catch (error) {
    next(error);
  }
});

app.get('/socios/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const idNumero = parseInt(id, 10);

    if (Number.isNaN(idNumero)) {
      return next(new ValidationError('El ID debe ser un número válido.'));
    }

    const socio = await prisma.socio.findUnique({
      where: { id: idNumero }
    });

    if (!socio) {
      return next(new NotFoundError('El socio solicitado no existe.'));
    }

    res.json(socio);
  } catch (error) {
    next(error);
  }
});

app.post('/socios', async (req, res, next) => {
  try {
    const payload = validarSocioPayload(req.body);
    const fechaPago = req.body?.fechaPago ? new Date(req.body.fechaPago) : new Date();

    const nuevoSocio = await prisma.socio.create({
      data: {
        ...payload,
        estado: 'Activo',
        fechaPago
      }
    });

    res.status(201).json(nuevoSocio);
  } catch (error) {
    next(error);
  }
});

app.put('/socios/:id', async (req, res, next) => {
  try {
    const idNumero = parseInt(req.params.id, 10);
    if (Number.isNaN(idNumero)) {
      return next(new ValidationError('El ID debe ser un número válido.'));
    }

    const payload = validarSocioPayload(req.body);
    const dataActualizada = {
      ...payload,
      ...(req.body?.fechaPago ? { fechaPago: new Date(req.body.fechaPago) } : {})
    };

    const socioActualizado = await prisma.socio.update({
      where: { id: idNumero },
      data: dataActualizada
    });

    res.json(socioActualizado);
  } catch (error) {
    if (error?.code === 'P2025') {
      return next(new NotFoundError('El socio solicitado no existe.'));
    }
    next(error);
  }
});

app.patch('/socios/:id/estado', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return next(new ValidationError('El ID debe ser un número válido.'));
    }

    const socio = await prisma.socio.findUnique({ where: { id } });
    if (!socio) {
      return next(new NotFoundError('El socio solicitado no existe.'));
    }

    const nuevoEstado = req.body?.estado === 'Activo' || req.body?.estado === 'Inactivo'
      ? req.body.estado
      : socio.estado === 'Activo' ? 'Inactivo' : 'Activo';

    const updatedData = { estado: nuevoEstado };
    if (nuevoEstado === 'Activo') {
      updatedData.fechaPago = new Date();
    }

    const socioActualizado = await prisma.socio.update({
      where: { id },
      data: updatedData
    });

    res.json(socioActualizado);
  } catch (error) {
    if (error?.code === 'P2025') {
      return next(new NotFoundError('El socio solicitado no existe.'));
    }
    next(error);
  }
});

app.patch('/socios/:id/pago', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return next(new ValidationError('El ID debe ser un número válido.'));
    }

    const socio = await prisma.socio.findUnique({ where: { id } });
    if (!socio) {
      return next(new NotFoundError('El socio solicitado no existe.'));
    }

    const socioActualizado = await prisma.socio.update({
      where: { id },
      data: {
        fechaPago: new Date(),
        estado: 'Activo'
      }
    });

    res.json(socioActualizado);
  } catch (error) {
    if (error?.code === 'P2025') {
      return next(new NotFoundError('El socio solicitado no existe.'));
    }
    next(error);
  }
});

app.delete('/socios/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return next(new ValidationError('El ID debe ser un número válido.'));
    }

    await prisma.socio.delete({
      where: { id }
    });

    res.json({ mensaje: 'Socio eliminado correctamente' });
  } catch (error) {
    if (error?.code === 'P2025') {
      return next(new NotFoundError('El socio solicitado no existe.'));
    }
    next(error);
  }
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  console.error('💥 ERROR INESPERADO:', err);
  res.status(500).json({
    status: 'error',
    message: 'Algo salió muy mal en el servidor de forma interna.'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor del gimnasio corriendo en http://localhost:${PORT}`);
});

module.exports = app;
