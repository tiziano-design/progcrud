const express = require('express');
const cors = require('cors');
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

// 1. LEER TODOS (GET /socios)
app.get('/socios', async (req, res) => {
  try {
    const socios = await prisma.socio.findMany();
    res.json(socios);
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
    const { nombre, apellido, dni, plan } = req.body;
    
    // Validación básica exigida en el TP
    if (!nombre || !apellido || !dni || !plan) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const nuevoSocio = await prisma.socio.create({
      data: { nombre, apellido, dni, plan }
    });
    res.status(201).json(nuevoSocio);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el socio. Quizás el DNI ya existe." });
  }
});

// 4. ACTUALIZAR (PUT /socios/:id)
app.put('/socios/:id', async (req, res) => {
  try {
    const { nombre, apellido, dni, plan, estado } = req.body;
    const socioActualizado = await prisma.socio.update({
      where: { id: parseInt(req.params.id) },
      data: { nombre, apellido, dni, plan, estado }
    });
    res.json(socioActualizado);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el socio" });
  }
});

// 5. BORRAR (DELETE /socios/:id)
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