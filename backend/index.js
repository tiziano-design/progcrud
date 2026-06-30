const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

// Configuración básica
app.use(cors());
app.use(express.json()); // Para poder recibir datos en formato JSON

// ----------------------------------------------------
// RUTAS CRUD PARA LOS SOCIOS DEL GIMNASIO
// ----------------------------------------------------

function isPagoVencido(fechaPago) {
  if (!fechaPago) return true;
  const pagoDate = new Date(fechaPago);
  const DIAS_PASADOS = (Date.now() - pagoDate.getTime()) / (1000 * 60 * 60 * 24);
  return DIAS_PASADOS >= 30;
}

// 1. LEER TODOS (GET /socios)
app.get('/socios', async (req, res) => {
  try {
    const socios = await prisma.socio.findMany();

    const sociosActualizados = await Promise.all(socios.map(async (socio) => {
      if (socio.estado === 'Activo' && isPagoVencido(socio.fechaPago)) {
        return await prisma.socio.update({
          where: { id: socio.id },
          data: { estado: 'Inactivo' }
        });
      }
      return socio;
    }));

    res.json(sociosActualizados);
  } catch (error) {
    res.status(500).json({ error: "Error al traer los socios" });
  }
});

// 2. LEER UNO SOLO (GET /socios/:id)
app.get('/socios/:id', async (req, res) => {
  try {
    const socio = await prisma.socio.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (socio) {
      res.json(socio);
    } else {
      res.status(404).json({ error: "Socio no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al buscar el socio" });
  }
});

// 3. CREAR UNO NUEVO (POST /socios)
app.post('/socios', async (req, res) => {
  try {
    const { nombre, apellido, dni, plan, fechaPago } = req.body;
    
    // Validación básica
    if (!nombre || !apellido || !dni || !plan) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const nuevoSocio = await prisma.socio.create({
      data: {
        nombre,
        apellido,
        dni,
        plan,
        estado: "Activo",
        fechaPago: fechaPago ? new Date(fechaPago) : new Date()
      }
    });
    res.status(201).json(nuevoSocio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el socio en la base de datos." });
  }
});

// 4. ACTUALIZAR (PUT /socios/:id)
app.put('/socios/:id', async (req, res) => {
  try {
    const { nombre, apellido, dni, plan, fechaPago } = req.body;
    const dataActualizada = {
      nombre,
      apellido,
      dni,
      plan,
      ...(fechaPago ? { fechaPago: new Date(fechaPago) } : {})
    };

    const socioActualizado = await prisma.socio.update({
      where: { id: parseInt(req.params.id) },
      data: dataActualizada
    });
    res.json(socioActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el socio" });
  }
});

// 5. CAMBIAR ESTADO EXPLÍCITO (PATCH /socios/:id/estado)
app.patch('/socios/:id/estado', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { estado } = req.body;
    const socio = await prisma.socio.findUnique({ where: { id } });

    if (!socio) {
      return res.status(404).json({ error: "Socio no encontrado" });
    }

    const nuevoEstado = estado === 'Activo' || estado === 'Inactivo'
      ? estado
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
    console.error(error);
    res.status(500).json({ error: "Error al cambiar el estado del socio" });
  }
});

// 6. REGISTRAR PAGO (PATCH /socios/:id/pago)
app.patch('/socios/:id/pago', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const socio = await prisma.socio.findUnique({ where: { id } });

    if (!socio) {
      return res.status(404).json({ error: "Socio no encontrado" });
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
    console.error(error);
    res.status(500).json({ error: "Error al registrar el pago del socio" });
  }
});

// 7. BORRAR (DELETE /socios/:id)
app.delete('/socios/:id', async (req, res) => {
  try {
    await prisma.socio.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ mensaje: "Socio eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el socio" });
  }
});

// ----------------------------------------------------
// ARRANCAR EL SERVIDOR
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor del gimnasio corriendo en http://localhost:${PORT}`);
});